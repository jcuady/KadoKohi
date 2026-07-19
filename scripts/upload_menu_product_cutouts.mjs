/**
 * Upload “Kado Kohi Products for Menu” cutouts → kado-menu-images + kk_products.image.
 * Project: idwtlujcdfnnndxmlaco only.
 *
 * Usage: node scripts/upload_menu_product_cutouts.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const REF = 'idwtlujcdfnnndxmlaco';
const BUCKET = 'kado-menu-images';
const MAX_SIDE = 1200;
const MAX_BYTES = 220 * 1024;

function loadEnv() {
  const envPath = path.resolve(import.meta.dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2] ?? '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || `https://${REF}.supabase.co`;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url.includes(REF)) {
  console.error(`Refusing upload — URL must be ${REF}, got ${url}`);
  process.exit(1);
}
if (!key) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

/** Named cutouts only — NO NAME assets intentionally skipped. */
const MAP = [
  ['AmeriKADO No Straw.png', 'prod_amerikado'],
  ['Cafe Latte No Straw.png', 'prod_cafe_latte'],
  ['Dirty Matcha Oat Latte No Straw.png', 'prod_dirty_matcha'],
  ['KADO Latte No Straw.png', 'prod_kado_latte'],
  ['Matcha Oat Latte No Straw.png', 'prod_matcha_oat'],
  ['Matcha Strawberry Latte No Straw.png', 'prod_matcha_straw'],
  ['Moka Latte No Straw.png', 'prod_moka_latte'],
  ['Nori Salted Cream Latte No Straw.png', 'prod_nori_salted'],
  ['Ube Shio Caramel Latte No Straw.png', 'prod_ube_shio'],
  ['Yuzu Amerikado No Straw.png', 'prod_yuzu_amerikado'],
  ['Yuzu Strawberry Soda No Straw.png', 'prod_yuzu_straw'],
];

const SRC_DIR = path.resolve(
  import.meta.dirname,
  '..',
  'KADO Website Assets',
  'Kado Kohi Products for Menu',
);

async function toJpeg(inputPath) {
  let quality = 78;
  let buf = await sharp(inputPath, { failOn: 'none' })
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: { r: 241, g: 223, b: 186 } }) // kado-cream for any residual edge
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  while (buf.length > MAX_BYTES && quality > 52) {
    quality -= 6;
    buf = await sharp(inputPath, { failOn: 'none' })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: { r: 241, g: 223, b: 186 } })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }
  return buf;
}

async function main() {
  console.log(`Uploading ${MAP.length} menu cutouts → ${REF} / ${BUCKET}`);

  for (const [fileName, productId] of MAP) {
    const abs = path.join(SRC_DIR, fileName);
    if (!fs.existsSync(abs)) {
      console.warn(`SKIP missing file: ${fileName}`);
      continue;
    }

    const jpeg = await toJpeg(abs);
    const storagePath = `products/${productId}.jpg`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, jpeg, {
      upsert: true,
      contentType: 'image/jpeg',
      cacheControl: '31536000',
    });
    if (upErr) throw new Error(`${productId} upload: ${upErr.message}`);

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;

    const { error: dbErr } = await supabase
      .from('kk_products')
      .update({ image: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', productId);
    if (dbErr) throw new Error(`${productId} db: ${dbErr.message}`);

    console.log(`OK ${productId} ${(jpeg.length / 1024).toFixed(1)}KB → ${publicUrl.slice(0, 90)}…`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
