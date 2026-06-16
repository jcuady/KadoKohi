import { SEED_BOOTH_ADDONS, SEED_BOOTH_PACKAGES, SEED_BOOKING_SHOWCASE_GALLERY } from '../data/seed';
import { SEED_CONTENT } from '../store/landingContentStore';
import { DEFAULT_BOOTH_PAGE_COPY } from './boothPageContent';
import { orderingRepo } from './supabase/repositories/ordering';
import { supabase } from './supabase/client';

/** Seed published CMS blobs when the database row has no content yet. */
export async function ensurePublishedCms(): Promise<void> {
  if (!supabase) return;

  try {
    const [landing, booth, catalog] = await Promise.all([
      orderingRepo.fetchLandingContent(),
      orderingRepo.fetchBoothPageContent(),
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
