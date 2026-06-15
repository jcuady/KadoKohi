import type { MenuCategory, Product } from '../types/domain';

export const PASTRIES_CATEGORY_NAME = 'Pastries';

/** Match the admin-created "Pastries" menu category (case-insensitive). */
export function findPastriesCategory(categories: MenuCategory[]): MenuCategory | undefined {
  return categories.find((c) => c.name.trim().toLowerCase() === PASTRIES_CATEGORY_NAME.toLowerCase());
}

export function pastriesProducts(categories: MenuCategory[], products: Product[]): Product[] {
  const cat = findPastriesCategory(categories);
  if (!cat) return [];
  return products
    .filter((p) => p.categoryId === cat.id && p.visible)
    .sort((a, b) => a.order - b.order);
}

export function allPastriesProducts(categories: MenuCategory[], products: Product[]): Product[] {
  const cat = findPastriesCategory(categories);
  if (!cat) return [];
  return products.filter((p) => p.categoryId === cat.id).sort((a, b) => a.order - b.order);
}
