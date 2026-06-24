import type { MenuCategory, Product } from '../types/domain';

export const PASTRIES_CATEGORY_NAME = 'Pastries';

/** Match the admin-created "Pastries" menu category (case-insensitive). */
export function findPastriesCategory(categories: MenuCategory[]): MenuCategory | undefined {
  return categories.find((c) => c.name.trim().toLowerCase() === PASTRIES_CATEGORY_NAME.toLowerCase());
}

export function isPastriesCategory(category: Pick<MenuCategory, 'name'> | undefined): boolean {
  return category?.name.trim().toLowerCase() === PASTRIES_CATEGORY_NAME.toLowerCase();
}

export function isPastriesCategoryId(categories: MenuCategory[], categoryId: string | null | undefined): boolean {
  if (!categoryId) return false;
  const cat = categories.find((c) => c.id === categoryId);
  return isPastriesCategory(cat);
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

export function pastryHasPrice(product: Pick<Product, 'basePrice'>): boolean {
  return Number(product.basePrice) > 0;
}
