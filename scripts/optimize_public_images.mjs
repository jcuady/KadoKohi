/**
 * Compress public hot-path images → WebP (PageSpeed Stage 1).
 * Targets ≤100KB where quality allows; keeps originals as raster fallbacks
 * only when WebP is larger than a recompressed original (rare).
 *
 * Usage: node scripts/optimize_public_images.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..', 'public');

/** Hot-path assets shipped on landing / menu / booth / about. */
const TARGETS = [
  { dir: 'social', maxW: 900, quality: 72 },
  { dir: 'Social Media References', maxW: 1400, quality: 68 },
  { dir: 'featuredmarikina', maxW: 1400, quality: 70 },
  { dir: 'booth-photos', maxW: 1200, quality: 70 },
  { dir: 'images', maxW: 1400, quality: 70, filter: /^hero-/ },
  { dir: '.', maxW: 900, quality: 72, files: ['hero-cup.png'] },
];

const RASTER = /\.(jpe?g|png)$/i;

async function listFiles(absDir) {
  try {
    return await fs.readdir(absDir);
  } catch {
    return [];
  }
}

async function optimizeOne(absPath, maxW, quality) {
  const ext = path.extname(absPath);
  const webpPath = absPath.replace(RASTER, '.webp');
  const before = (await fs.stat(absPath)).size;

  let pipeline = sharp(absPath, { failOn: 'none' }).rotate();
  const meta = await pipeline.metadata();
  if (meta.width && meta.width > maxW) {
    pipeline = pipeline.resize({ width: maxW, withoutEnlargement: true });
  }

  // Write WebP only — OneDrive often locks in-place rewrites of originals.
  const webpBuf = await pipeline.webp({ quality, effort: 6 }).toBuffer();
  await fs.writeFile(webpPath, webpBuf);

  return {
    file: path.relative(ROOT, absPath),
    beforeKb: +(before / 1024).toFixed(1),
    webpKb: +(webpBuf.length / 1024).toFixed(1),
  };
}

async function main() {
  const results = [];

  for (const target of TARGETS) {
    const absDir = path.join(ROOT, target.dir);
    if (target.files) {
      for (const name of target.files) {
        const abs = path.join(absDir, name);
        try {
          await fs.access(abs);
          results.push(await optimizeOne(abs, target.maxW, target.quality));
        } catch {
          /* skip missing */
        }
      }
      continue;
    }

    const names = await listFiles(absDir);
    for (const name of names) {
      if (!RASTER.test(name)) continue;
      if (target.filter && !target.filter.test(name)) continue;
      const abs = path.join(absDir, name);
      const st = await fs.stat(abs);
      if (!st.isFile()) continue;
      results.push(await optimizeOne(abs, target.maxW, target.quality));
    }
  }

  const before = results.reduce((s, r) => s + r.beforeKb, 0);
  const webp = results.reduce((s, r) => s + r.webpKb, 0);
  console.table(results);
  console.log(
    `\nOptimized ${results.length} files. Raster was ${before.toFixed(0)}KB → WebP total ${webp.toFixed(0)}KB (−${(
      ((before - webp) / Math.max(before, 1)) *
      100
    ).toFixed(0)}%).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
