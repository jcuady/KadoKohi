import { SEED_BOOTH_ADDONS, SEED_BOOTH_PACKAGES, SEED_BOOKING_SHOWCASE_GALLERY } from '../data/seed';
import { SEED_CONTENT } from '../store/landingContentStore';
import { DEFAULT_BOOTH_PAGE_COPY } from './boothPageContent';
import { DEFAULT_MATCHA_PAGE_COPY, SEED_MATCHA_SHOWCASE_GALLERY } from './matchaPageContent';
import { DEFAULT_CAREERS_PAGE_COPY, DEFAULT_CAREER_APPLICATION_FORM, SEED_CAREER_LISTINGS } from './careersPageContent';
import { DEFAULT_PASTRIES_PAGE_CONTENT } from './pastriesPageContent';
import { orderingRepo } from './supabase/repositories/ordering';
import { supabase } from './supabase/client';

/** Seed published CMS blobs when the database row has no content yet. */
export async function ensurePublishedCms(): Promise<void> {
  if (!supabase) return;

  try {
    const [landing, booth, matcha, careers, pastries, catalog] = await Promise.all([
      orderingRepo.fetchLandingContent(),
      orderingRepo.fetchBoothPageContent(),
      orderingRepo.fetchMatchaPageContent(),
      orderingRepo.fetchCareersContent(),
      orderingRepo.fetchPastriesContent(),
      orderingRepo.fetchBoothCatalog(),
    ]);

    const writes: Promise<void>[] = [];

    if (!landing || typeof landing !== 'object') {
      writes.push(orderingRepo.upsertLandingContent(SEED_CONTENT));
    }

    if (!booth || typeof booth !== 'object') {
      writes.push(
        orderingRepo.upsertBoothPageContent({
          copy: DEFAULT_BOOTH_PAGE_COPY,
          showcase: SEED_BOOKING_SHOWCASE_GALLERY,
        }),
      );
    }

    if (!matcha || typeof matcha !== 'object') {
      writes.push(
        orderingRepo.upsertMatchaPageContent({
          copy: DEFAULT_MATCHA_PAGE_COPY,
          showcase: SEED_MATCHA_SHOWCASE_GALLERY,
        }),
      );
    }

    if (!careers || typeof careers !== 'object') {
      writes.push(
        orderingRepo.upsertCareersContent({
          copy: DEFAULT_CAREERS_PAGE_COPY,
          listings: SEED_CAREER_LISTINGS,
          applicationForm: DEFAULT_CAREER_APPLICATION_FORM,
        }),
      );
    }

    if (!pastries || typeof pastries !== 'object') {
      writes.push(orderingRepo.upsertPastriesContent(DEFAULT_PASTRIES_PAGE_CONTENT));
    }

    const hasCatalog =
      catalog &&
      typeof catalog === 'object' &&
      Array.isArray((catalog as { packages?: unknown }).packages) &&
      ((catalog as { packages: unknown[] }).packages.length > 0 ||
        Array.isArray((catalog as { addons?: unknown }).addons));

    if (!hasCatalog) {
      writes.push(
        orderingRepo.upsertBoothCatalog({
          packages: SEED_BOOTH_PACKAGES,
          addons: SEED_BOOTH_ADDONS,
        }),
      );
    }

    if (writes.length) await Promise.all(writes);
  } catch {
    // Non-fatal — local seed content still renders until admin publishes.
  }
}
