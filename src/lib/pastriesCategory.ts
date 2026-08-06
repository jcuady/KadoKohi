import type { MenuCategory, Product } from '../types/domain';
import { isKukiBuilderOnlyProduct } from './kukido';

export const PASTRIES_CATEGORY_NAME = 'Pastries';

export function isPastriesCategory(category: Pick<MenuCategory, 'name'> | undefined): boolean {
  return category?.name.trim().toLowerCase() === PASTRIES_CATEGORY_NAME.toLowerCase();
}

/** All categories named Pastries (handles accidental duplicates in admin). */
export function findPastriesCategories(categories: MenuCategory[]): MenuCategory[] {
  return categories
    .filter((c) => isPastriesCategory(c))
    .sort((a, b) => a.order - b.order);
}

/** Match the admin-created "Pastries" menu category (prefer stable seed id). */
export function findPastriesCategory(categories: MenuCategory[]): MenuCategory | undefined {
  const all = findPastriesCategories(categories);
  return all.find((c) => c.id === 'cat_pastries') ?? all[0];
}

export function isPastriesCategoryId(categories: MenuCategory[], categoryId: string | null | undefined): boolean {
  if (!categoryId) return false;
  const cat = categories.find((c) => c.id === categoryId);
  return isPastriesCategory(cat);
}

export function pastryCategoryIds(categories: MenuCategory[]): Set<string> {
  return new Set(findPastriesCategories(categories).map((c) => c.id));
}

/** Visible categories for public tabs — one chip per display name (first by order wins). */
export function uniqueVisibleMenuCategories(categories: MenuCategory[]): MenuCategory[] {
  const seen = new Set<string>();
  return [...categories]
    .filter((c) => c.visible)
    .sort((a, b) => a.order - b.order)
    .filter((c) => {
      const key = c.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function pastriesProducts(categories: MenuCategory[], products: Product[]): Product[] {
  const ids = pastryCategoryIds(categories);
  if (ids.size === 0) return [];
  return products
    .filter(
      (p) =>
        ids.has(p.categoryId) &&
        p.visible &&
        !isKukiBuilderOnlyProduct(p.id),
    )
    .sort((a, b) => a.order - b.order);
}

export function allPastriesProducts(categories: MenuCategory[], products: Product[]): Product[] {
  const ids = pastryCategoryIds(categories);
  if (ids.size === 0) return [];
  return products.filter((p) => ids.has(p.categoryId)).sort((a, b) => a.order - b.order);
}

export function pastryHasPrice(product: Pick<Product, 'basePrice'>): boolean {
  return Number(product.basePrice) > 0;
}
