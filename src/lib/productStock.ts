import type { Product } from '../types/domain';

/** Manual stock flag — defaults to in stock when unset (seed / legacy rows). */
export function isProductInStock(product: Pick<Product, 'inStock'>): boolean {
  return product.inStock !== false;
}
