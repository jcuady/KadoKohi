import { MENU_CATEGORIES, MENU_PRODUCTS, filterCoffeeMenu } from '../data/menuCatalog';
import type { MenuCategory, Product } from '../types/domain';
import { orderingRepo } from './supabase/repositories/ordering';

/** Push canonical catalog rows via admin RLS (requires admin session). */
export async function pushMenuCatalogToRemote(
  categories: MenuCategory[] = MENU_CATEGORIES,
  products: Product[] = MENU_PRODUCTS,
): Promise<void> {
  for (const c of categories) {
    await orderingRepo.upsertCategory(c);
  }
  for (const p of products) {
    await orderingRepo.upsertProduct(p);
  }
}

export function coffeeMenuIsEmpty(categories: MenuCategory[], products: Product[]): boolean {
  return filterCoffeeMenu(categories, products).categories.length === 0;
}
