import type { Product } from '../types/domain';

/** Stable DOM id for scroll-into-view on /menu product deep links. */
export function menuProductDomId(productId: string): string {
  return `menu-product-${productId}`;
}

/** 1-based pagination page that contains productId within categoryProducts (sorted grid order). */
export function pageForProductInList(
  productId: string,
  categoryProducts: readonly Product[],
  pageSize: number,
): number | null {
  const index = categoryProducts.findIndex((p) => p.id === productId);
  if (index < 0) return null;
  return Math.floor(index / pageSize) + 1;
}

export function findVisibleMenuProduct(
  products: readonly Product[],
  productId: string,
): Product | undefined {
  if (!productId) return undefined;
  return products.find((p) => p.id === productId && p.visible);
}
