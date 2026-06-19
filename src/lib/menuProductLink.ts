import type { MenuSeoPillarCategoryKey } from '../store/landingContentStore';

/** Deep link to a menu product — opens category tab and product drawer on /menu. */
export function menuProductHref(productId: string): string {
  return `/menu?product=${encodeURIComponent(productId)}`;
}

/** Deep link to a menu category tab on /menu. */
export function menuCategoryHref(categoryId: string): string {
  return `/menu?category=${encodeURIComponent(categoryId)}`;
}

export function menuCategoryForSeoPillar(key: MenuSeoPillarCategoryKey): string {
  switch (key) {
    case 'matcha':
      return 'cat_matcha';
    case 'signatures':
      return 'cat_signatures';
    case 'classics':
      return 'cat_classics';
    case 'sodas-yuzu':
      return 'cat_yuzu';
  }
}
