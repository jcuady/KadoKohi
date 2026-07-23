/**
 * ponytail: fail if homepage LCP hero assets are missing or oversized.
 * Run: node scripts/check_hero_assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const checks = [
  { rel: 'public/heroes/espresso.webp', maxKiB: 120 },
  { rel: 'public/heroes/mobile/espresso.webp', maxKiB: 80 },
];

let failed = 0;
for (const { rel, maxKiB } of checks) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`MISSING ${rel}`);
    failed += 1;
    continue;
  }
  const kib = fs.statSync(full).size / 1024;
  if (kib > maxKiB) {
    console.error(`OVERSIZE ${rel}: ${kib.toFixed(1)} KiB > ${maxKiB} KiB`);
    failed += 1;
    continue;
  }
  console.log(`OK ${rel}: ${kib.toFixed(1)} KiB`);
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const needle of ['/heroes/mobile/espresso.webp', '/heroes/espresso.webp', 'm-plus-1-700.woff2', 'zalando-400.woff2']) {
  if (!html.includes(needle)) {
    console.error(`index.html missing preload/ref: ${needle}`);
    failed += 1;
  } else {
    console.log(`OK index.html has ${needle}`);
  }
}

if (html.includes('Social%20Media%20References') || html.includes('Social Media References')) {
  console.error('index.html still preloads legacy Social Media References');
  failed += 1;
}

process.exit(failed ? 1 : 0);
