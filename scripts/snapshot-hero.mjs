import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = 'http://127.0.0.1:5174/';
const out = 'screenshots';

await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
});

await page.goto(base, { waitUntil: 'networkidle' });
await page.screenshot({ path: `${out}/hero-day-start.png`, fullPage: false });

// Pinned hero scroll distance ~= 125% of viewport height — mid-transition ~62–70vh
await page.evaluate(() => {
  window.scrollTo({ top: Math.round(window.innerHeight * 0.62), behavior: 'instant' });
});
await page.waitForTimeout(450);
await page.screenshot({ path: `${out}/hero-night-mid-transition.png`, fullPage: false });

await page.evaluate(() => {
  window.scrollTo({ top: Math.round(window.innerHeight * 1.35), behavior: 'instant' });
});
await page.waitForTimeout(450);
await page.screenshot({ path: `${out}/hero-after-pin-release.png`, fullPage: false });

await browser.close();
