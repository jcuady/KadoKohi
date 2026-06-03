/**
 * Fetches public Google Maps reviews for Kado Kohi (Marikina) and writes
 * src/content/kadoGoogleReviews.ts. Requires: npx playwright install chromium
 *
 * Optional: GOOGLE_PLACES_API_KEY uses Places API (no browser) when set.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../src/content/kadoGoogleReviews.ts');

const MAPS_SEARCH_URL = 'https://www.google.com/maps/search/Kado+Kohi+Marikina';
const SEARCH_REVIEWS_URL = 'https://www.google.com/search?q=kado+coffee+reviews&hl=en';

export const KADO_GOOGLE_LISTING = {
  name: 'Kado Coffee',
  placeLabel: 'Kado Kohi — Marikina',
  rating: 4.9,
  reviewCount: 22,
  mapsUrl: 'https://www.google.com/maps/search/Kado+Kohi+Marikina',
  reviewsUrl: SEARCH_REVIEWS_URL,
  shareUrl: 'https://share.google/Y4fAFEabPt1hCeRcz',
  address: 'J.P. Laurel, Corner Mt Everest, Marikina, 1801 Metro Manila',
};

async function syncViaPlacesApi(apiKey) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.rating,places.userRatingCount,places.googleMapsUri,places.reviews',
    },
    body: JSON.stringify({
      textQuery: 'Kado Kohi J.P. Laurel Marikina Philippines',
      languageCode: 'en',
    }),
  });
  if (!res.ok) throw new Error(`Places API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const place = data.places?.[0];
  if (!place) throw new Error('No place found');
  const reviews = (place.reviews ?? []).slice(0, 8).map((r, i) => ({
    id: i + 1,
    name: r.authorAttribution?.displayName ?? 'Google reviewer',
    role: 'Google review',
    company: r.relativePublishTimeDescription ?? '',
    content: r.text?.text ?? r.originalText?.text ?? '',
    rating: r.rating ?? 5,
    avatar: r.authorAttribution?.photoUri ?? '',
  }));
  return {
    listing: {
      ...KADO_GOOGLE_LISTING,
      rating: place.rating ?? KADO_GOOGLE_LISTING.rating,
      reviewCount: place.userRatingCount ?? KADO_GOOGLE_LISTING.reviewCount,
      mapsUrl: place.googleMapsUri ?? KADO_GOOGLE_LISTING.mapsUrl,
      placeId: place.id ?? '',
    },
    reviews: reviews.filter((r) => r.content.trim().length > 10),
    syncedAt: new Date().toISOString(),
  };
}

async function dismissConsent(page) {
  for (const sel of [
    'button:has-text("Accept all")',
    'button:has-text("Accept All")',
    'button:has-text("I agree")',
    'button:has-text("Reject all")',
  ]) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1500 })) {
        await btn.click();
        await page.waitForTimeout(600);
        return;
      }
    } catch {
      /* continue */
    }
  }
}

async function syncViaGoogleSearch(page) {
  await page.goto(SEARCH_REVIEWS_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await dismissConsent(page);
  await page.waitForTimeout(3500);

  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(400);
  }

  return page.evaluate(() => {
    const out = { rating: null, reviewCount: null, reviews: [] };
    const seen = new Set();
    const bodyText = document.body.innerText || '';
    const ratingMatch = bodyText.match(/([\d.]+)\s*(?:stars?|★)/i);
    if (ratingMatch) out.rating = parseFloat(ratingMatch[1]);
    const countMatch = bodyText.match(/([\d,]+)\s+Google reviews?/i);
    if (countMatch) out.reviewCount = parseInt(countMatch[1].replace(/,/g, ''), 10);

    const tryPush = (name, text) => {
      const t = (text || '').replace(/\s+/g, ' ').trim();
      const n = (name || '').replace(/\s+/g, ' ').trim();
      if (t.length < 30 || t.length > 650 || seen.has(t)) return;
      if (/legal disclosure|Google reviews on|Write a review|Sort by/i.test(t)) return;
      seen.add(t);
      out.reviews.push({ name: n || 'Google reviewer', content: t, rating: 5 });
    };

    // Search results review cards
    document.querySelectorAll('div[data-attrid="kc:/collection/knowledge/merchant reviews"] span').forEach((el) => {
      tryPush('', el.textContent);
    });
    document.querySelectorAll('span[jsname], div.gws-localreviews__google-review').forEach((el) => {
      const t = el.textContent?.trim() || '';
      if (t.length > 40) tryPush('', t);
    });
    // Review blocks with author line above body
    document.querySelectorAll('div, span').forEach((el) => {
      const t = el.textContent?.trim() || '';
      if (t.length < 50 || t.length > 500) return;
      if (!/kado|matcha|coffee|ube|latte|vibe|caramel|marikina|staff|cozy|drink/i.test(t)) return;
      if (/photos|Local Guide|reviews ·|Google review/i.test(t) && t.length < 80) return;
      const lines = t.split('\n').map((l) => l.trim()).filter(Boolean);
      const name = lines[0]?.length < 40 ? lines[0] : '';
      const body = lines.find((l) => l.length > 35) || t;
      tryPush(name, body);
    });

    return out;
  });
}

async function syncViaPlaywright() {
  const headed = process.env.HEADED === '1';
  const browser = await chromium.launch({ headless: !headed });
  const page = await browser.newPage({ locale: 'en-PH', viewport: { width: 1280, height: 900 } });

  let extracted = await syncViaGoogleSearch(page);
  if ((extracted.reviews?.length ?? 0) >= 3) {
    await browser.close();
    const reviews = extracted.reviews.slice(0, 8).map((r, i) => ({
      id: i + 1,
      name: r.name,
      role: 'Google review',
      company: '',
      content: r.content,
      rating: r.rating,
      avatar: '',
    }));
    return {
      listing: {
        ...KADO_GOOGLE_LISTING,
        rating: extracted.rating ?? KADO_GOOGLE_LISTING.rating,
        reviewCount: extracted.reviewCount ?? KADO_GOOGLE_LISTING.reviewCount,
      },
      reviews,
      syncedAt: new Date().toISOString(),
    };
  }

  await page.goto(MAPS_SEARCH_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await dismissConsent(page);
  await page.waitForTimeout(2500);

  // Open "Kado Coffee" at J.P. Laurel (not other "Kohi" cafes)
  const listing = page
    .locator('div[role="article"], a[href*="/maps/place/"]')
    .filter({ hasText: /Kado Coffee/i })
    .filter({ hasText: /Laurel|Mt Everest/i })
    .first();
  if (await listing.isVisible({ timeout: 8000 })) {
    await listing.click();
    await page.waitForTimeout(4000);
  } else {
    await page.locator('a[href*="/maps/place/"]').filter({ hasText: /Kado Coffee/i }).first().click();
    await page.waitForTimeout(4000);
  }

  // Reviews tab on place card
  const reviewsTab = page.getByRole('tab', { name: /^Reviews/i });
  if (await reviewsTab.isVisible({ timeout: 5000 })) {
    await reviewsTab.click();
    await page.waitForTimeout(2000);
  } else {
    await page.getByText(/^Reviews$/i).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  // Scroll the place side panel (review list lives here)
  const panel = page.locator('div[role="main"] div.m6QErb, div[role="main"]').first();
  for (let i = 0; i < 10; i++) {
    try {
      await panel.evaluate((el) => {
        el.scrollTop += 500;
      });
    } catch {
      await page.keyboard.press('PageDown');
    }
    await page.waitForTimeout(500);
  }

  await page.waitForSelector('div.jftiEf span.wiI7pd', { timeout: 12000 }).catch(() => {});

  const structuredReviews = await page.evaluate(() => {
    const reviews = [];
    const seen = new Set();
    document.querySelectorAll('div.jftiEf').forEach((block) => {
      const name = block.querySelector('.d4r55')?.textContent?.trim() || '';
      const text =
        block.querySelector('span.wiI7pd, span.MyEned')?.textContent?.trim().replace(/\s+/g, ' ') || '';
      const img = block.querySelector('button img, img.NBa7hf, img');
      const avatar = img?.src || img?.getAttribute('src') || '';
      if (text.length < 25 || text.length > 700 || seen.has(text)) return;
      if (/legal disclosure|public reviews on Google/i.test(text)) return;
      seen.add(text);
      reviews.push({
        name: name || 'Google reviewer',
        content: text,
        rating: 5,
        avatar,
      });
    });
    return reviews;
  });

  extracted = await page.evaluate(() => {
    const out = { rating: null, reviewCount: null, reviews: [] };
    const seen = new Set();

    const bodyText = document.body.innerText || '';
    const ratingMatch = bodyText.match(/([\d.]+)\s*(?:stars?|★)/i);
    if (ratingMatch) out.rating = parseFloat(ratingMatch[1]);

    const countMatch = bodyText.match(/([\d,]+)\s+reviews?/i);
    if (countMatch) out.reviewCount = parseInt(countMatch[1].replace(/,/g, ''), 10);

    const tryPush = (name, text, rating) => {
      const t = (text || '').replace(/\s+/g, ' ').trim();
      const n = (name || '').replace(/\s+/g, ' ').trim();
      if (t.length < 25 || t.length > 700 || seen.has(t)) return;
      if (/legal disclosure|public reviews on Google|Learn more about/i.test(t)) return;
      if (/^(Menu|Updates|Overview|About|Directions|Save|Share|Review)/i.test(t)) return;
      seen.add(t);
      out.reviews.push({ name: n || 'Google reviewer', content: t, rating: rating || 5 });
    };

    // Google Maps review body (wiI7pd = review text as of 2024–2026)
    document.querySelectorAll('span.wiI7pd, div.wiI7pd, span.MyEned').forEach((el) => {
      const block = el.closest('div.jftiEf, div[data-review-id]');
      const name = block?.querySelector('.d4r55')?.textContent?.trim() || '';
      tryPush(name, el.textContent, 5);
    });

    document.querySelectorAll('div.jftiEf').forEach((block) => {
      const name = block.querySelector('.d4r55')?.textContent?.trim() || '';
      const text = block.querySelector('span.wiI7pd, span.MyEned')?.textContent?.trim() || '';
      tryPush(name, text, 5);
    });

    // aria-label based review text
    document.querySelectorAll('[aria-label]').forEach((el) => {
      const label = el.getAttribute('aria-label') || '';
      if (/stars.*\n|Rated|review/i.test(label) && label.length > 40) {
        const parts = label.split('\n').filter(Boolean);
        const text = parts.find((p) => p.length > 30 && !/star|rated/i.test(p)) || '';
        const name = parts[0]?.length < 40 ? parts[0] : '';
        tryPush(name, text, 5);
      }
    });

    return out;
  });

  if (structuredReviews.length >= 3) {
    extracted.reviews = structuredReviews;
    if (!extracted.rating) extracted.rating = 4.9;
    if (!extracted.reviewCount) extracted.reviewCount = 22;
  }

  if (process.env.DEBUG_REVIEWS === '1') {
    await page.screenshot({ path: path.join(__dirname, '../test-results/google-reviews-debug.png'), fullPage: true });
    fs.writeFileSync(path.join(__dirname, '../test-results/google-reviews.html'), await page.content());
    console.log('Debug artifacts in test-results/');
  }

  await browser.close();

  const reviews = (extracted.reviews ?? []).slice(0, 8).map((r, i) => ({
    id: i + 1,
    name: r.name,
    role: 'Google review',
    company: '',
    content: r.content,
    rating: r.rating ?? 5,
    avatar: r.avatar ?? '',
  }));

  return {
    listing: {
      ...KADO_GOOGLE_LISTING,
      rating: extracted.rating ?? KADO_GOOGLE_LISTING.rating,
      reviewCount: extracted.reviewCount ?? KADO_GOOGLE_LISTING.reviewCount,
    },
    reviews,
    syncedAt: new Date().toISOString(),
  };
}

const AVATAR_DIR = path.join(__dirname, '../public/google-review-avatars');

async function cacheReviewAvatars(reviews) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
  for (const review of reviews) {
    const remote = (review.avatar || '').trim();
    if (!remote || !/googleusercontent\.com/i.test(remote)) continue;
    const file = `review-${review.id}.jpg`;
    const dest = path.join(AVATAR_DIR, file);
    try {
      const res = await fetch(remote, {
        headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.google.com/' },
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 200) continue;
      fs.writeFileSync(dest, buf);
      review.avatar = `/google-review-avatars/${file}`;
    } catch {
      // Keep remote URL as fallback
    }
  }
  return reviews;
}

function writeModule(snapshot) {
  const body = `/**
 * Google Maps reviews for Kado Kohi (Marikina). Sync with:
 *   npm run sync:google-reviews
 * Source: ${snapshot.listing.reviewsUrl}
 */
import type { StoredTestimonial } from '../store/landingContentStore';

export type GoogleReviewsListing = {
  name: string;
  placeLabel: string;
  rating: number;
  reviewCount: number;
  mapsUrl: string;
  reviewsUrl: string;
  shareUrl: string;
  address: string;
};

export const KADO_GOOGLE_LISTING: GoogleReviewsListing = ${JSON.stringify(snapshot.listing, null, 2)};

export const KADO_GOOGLE_REVIEWS_SYNCED_AT = ${JSON.stringify(snapshot.syncedAt)};

export const KADO_GOOGLE_REVIEW_ITEMS: StoredTestimonial[] = ${JSON.stringify(
    snapshot.reviews,
    null,
    2,
  )};

export function googleReviewsToTestimonials(): StoredTestimonial[] {
  return KADO_GOOGLE_REVIEW_ITEMS.map((t) => ({ ...t }));
}
`;
  fs.writeFileSync(OUT, body, 'utf8');
  console.log(`Wrote ${snapshot.reviews.length} reviews → ${OUT}`);
}

async function main() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  let snapshot;
  if (apiKey) {
    console.log('Syncing via Google Places API…');
    snapshot = await syncViaPlacesApi(apiKey);
  } else {
    console.log('Syncing via Playwright (set GOOGLE_PLACES_API_KEY to use API instead)…');
    snapshot = await syncViaPlaywright();
  }

  if (snapshot.reviews.length < 3) {
    console.error(
      `Only ${snapshot.reviews.length} review(s) extracted. Set GOOGLE_PLACES_API_KEY or retry with HEADED=1 DEBUG_REVIEWS=1`,
    );
    process.exit(1);
  }

  console.log('Caching reviewer profile photos…');
  snapshot.reviews = await cacheReviewAvatars(snapshot.reviews);
  const withPhotos = snapshot.reviews.filter((r) => r.avatar?.trim()).length;
  console.log(`Avatars ready: ${withPhotos}/${snapshot.reviews.length}`);

  writeModule(snapshot);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
