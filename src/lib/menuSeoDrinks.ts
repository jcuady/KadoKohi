import { SEO_SIGNATURE_DRINKS } from '@/content/seo';
import type { MenuSeoPillarCategoryKey } from '@/store/landingContentStore';
import type { Product } from '@/types/domain';
import { menuCategoryForSeoPillar } from './menuProductLink';

export type MenuSeoDrinkLink = { name: string; productId: string };

function staticDrinksForPillar(key: MenuSeoPillarCategoryKey): MenuSeoDrinkLink[] {
  switch (key) {
    case 'matcha':
      return SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Matcha & Hojicha').map((d) => ({
        name: d.name,
        productId: d.productId,
      }));
    case 'signatures':
      return SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Signatures').map((d) => ({
        name: d.name,
        productId: d.productId,
      }));
    case 'classics':
      return SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Classics').map((d) => ({
        name: d.name,
        productId: d.productId,
      }));
    case 'sodas-yuzu':
      return SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Yuzu').map((d) => ({
        name: d.name,
        productId: d.productId,
      }));
    default:
      return SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Classics' || d.category === 'Yuzu').map(
        (d) => ({ name: d.name, productId: d.productId }),
      );
  }
}

/** Live Supabase catalog first; static SEO list only until menu hydrates. */
export function drinksForMenuSeoPillar(
  key: MenuSeoPillarCategoryKey,
  liveProducts?: readonly Product[],
): MenuSeoDrinkLink[] {
  const categoryId = menuCategoryForSeoPillar(key);
  if (liveProducts?.length) {
    const fromDb = liveProducts
      .filter((p) => p.visible && p.categoryId === categoryId)
      .sort((a, b) => a.order - b.order)
      .map((p) => ({ name: p.name, productId: p.id }));
    if (fromDb.length > 0) return fromDb;
  }
  return staticDrinksForPillar(key);
}
