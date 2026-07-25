import type { Product } from '../types/domain';
import { getMenuProductImageUrl } from './menuCatalog';

/** Local cutout fallbacks for Signature Sips — used when CMS override is empty. */
export const FEATURED_CUTOUT_BY_ID: Partial<Record<string, string>> = {
  prod_matcha_straw: '/featured/matcha-strawberry.webp',
  prod_dirty_matcha: '/featured/dirty-matcha-oat.webp',
  prod_matcha_oat: '/featured/matcha-oat.webp',
};

/** Prefer CMS override, then local cutout, then menu product image. */
export function resolveFeaturedDrinkImage(drink: Product, override?: string): string {
  const fromOverride = override?.trim();
  if (fromOverride) return fromOverride;
  const localCutout = FEATURED_CUTOUT_BY_ID[drink.id];
  if (localCutout) return localCutout;
  return getMenuProductImageUrl(drink);
}
