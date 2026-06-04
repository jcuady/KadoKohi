/**
 * Regenerate public/sitemap.xml from src/content/seo route list.
 * Run: node scripts/generate-sitemap.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const seoPath = path.join(root, 'src/content/seo.ts');
const source = readFileSync(seoPath, 'utf8');

const block = source.match(/export const SEO_SITEMAP_PATHS[^[]*\[([\s\S]*?)\];/);
if (!block) {
  console.error('Could not parse SEO_SITEMAP_PATHS from seo.ts');
  process.exit(1);
}

const paths = [...block[1].matchAll(/path:\s*'([^']+)'[\s\S]*?changefreq:\s*'([^']+)'[\s\S]*?priority:\s*'([^']+)'/g)].map(
  (m) => ({ path: m[1], changefreq: m[2], priority: m[3] }),
);

const lastmod = new Date().toISOString().slice(0, 10);
const origin = 'https://www.kadokohi.com';

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (p) => `  <url>
    <loc>${origin}${p.path === '/' ? '/' : p.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

writeFileSync(path.join(root, 'public/sitemap.xml'), xml, 'utf8');
console.log(`Wrote ${paths.length} URLs to public/sitemap.xml`);
