import { MENU_CATEGORIES, filterCoffeeMenu } from '../data/menuCatalog';
import type { MenuCategory, Product } from '../types/domain';
import { orderingRepo } from './supabase/repositories/ordering';

/** Push default category rows only (admin session). Never push seed products — upsert sends image:null and wipes uploads. */
export async function pushMenuCatalogToRemote(
  categories: MenuCategory[] = MENU_CATEGORIES,
): Promise<void> {
  for (const c of categories) {
    await orderingRepo.upsertCategory(c);
  }
}

export function coffeeMenuIsEmpty(categories: MenuCategory[], products: Product[]): boolean {
  return filterCoffeeMenu(categories, products).categories.length === 0;
}
