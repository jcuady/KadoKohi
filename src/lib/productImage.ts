import type { Product } from '../types/domain';
import { productFallbackDescription } from './menuProductModifiers';
import { DEFAULT_MENU_PRODUCT_IMAGE, getMenuProductImageUrl } from './menuCatalog';

/** @deprecated Use DEFAULT_MENU_PRODUCT_IMAGE from menuCatalog */
export const DEFAULT_PRODUCT_IMAGE = DEFAULT_MENU_PRODUCT_IMAGE;

export function getProductImageUrl(
  product: Pick<Product, 'image' | 'categoryId'> & { id?: string },
  options?: { pastriesCategoryId?: string },
): string {
  return getMenuProductImageUrl(product, options);
}

export function getProductDescription(product: Product): string {
  return productFallbackDescription(product);
}
