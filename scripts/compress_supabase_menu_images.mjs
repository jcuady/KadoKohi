/**
 * Recompress oversized public menu photos in Supabase storage (service role).
 * Desktop PSI called out prod_kado_latte.jpg at ~3.2MB for a ~660px display.
 *
 * Usage: node scripts/compress_supabase_menu_images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

function loadEnv() {
  const envPath = path.resolve(import.meta.dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2] ?? '';
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const BUCKET = 'kado-menu-images';
const MAX_BYTES = 180 * 1024;
const MAX_SIDE = 1200;

async function compressBuffer(input) {
  let quality = 72;
  let buf = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  while (buf.length > MAX_BYTES && quality > 48) {
    quality -= 6;
    buf = await sharp(input, { failOn: 'none' })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }
  return buf;
}

async function main() {
  const { data: products, error } = await supabase
    .from('kk_products')
    .select('id, name, image')
    .not('image', 'is', null);

  if (error) throw error;

  const targets = (products ?? []).filter((p) =>
    String(p.image || '').includes(`/storage/v1/object/public/${BUCKET}/`),
  );

  console.log(`Scanning ${targets.length} products with menu-bucket images…`);

  for (const product of targets) {
    const imageUrl = String(product.image);
    const marker = `/object/public/${BUCKET}/`;
    const idx = imageUrl.indexOf(marker);
    if (idx < 0) continue;
    const objectPath = decodeURIComponent(imageUrl.slice(idx + marker.length).split('?')[0]);

    const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(objectPath);
    if (dlErr || !blob) {
      console.warn('skip download', product.id, dlErr?.message);
      continue;
    }

    const input = Buffer.from(await blob.arrayBuffer());
    if (input.length <= MAX_BYTES) {
      console.log(`ok ${product.id} ${(input.length / 1024).toFixed(0)}KB`);
      continue;
    }

    const out = await compressBuffer(input);
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectPath, out, {
      upsert: true,
      contentType: 'image/jpeg',
      cacheControl: '31536000',
    });
    if (upErr) {
      console.error('upload fail', product.id, upErr.message);
      continue;
    }

    // Bust caches that use ?v=
    const nextUrl = imageUrl.replace(/\?v=\d+/, '') + `?v=${Date.now()}`;
    await supabase.from('kk_products').update({ image: nextUrl }).eq('id', product.id);

    console.log(
      `compressed ${product.id} (${product.name}): ${(input.length / 1024).toFixed(0)}KB → ${(
        out.length / 1024
      ).toFixed(0)}KB`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
