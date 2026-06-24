import type { MenuCategory, Product } from '../types/domain';
import { findPastriesCategory, isPastriesCategory, isPastriesCategoryId, pastryHasPrice, pastriesProducts } from './pastriesCategory';

export type QrGuestCategoryTab = { id: string; name: string };

/** Category pills for guest QR menus. */
export function qrGuestCategoryTabs(
  categories: MenuCategory[],
  products: Product[],
): QrGuestCategoryTab[] {
  const pastries = findPastriesCategory(categories);
  const showPastriesTab =
    Boolean(pastries?.visible) &&
    pastriesProducts(categories, products).some((p) => pastryHasPrice(p));

  return categories
    .filter((c) => {
      if (!c.visible) return false;
      if (isPastriesCategory(c)) return showPastriesTab;
      return true;
    })
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ id: c.id, name: c.name }));
}

/** Products for a category tab. */
export function qrGuestProductsInCategory(
  categoryId: string,
  categories: MenuCategory[],
  productsByCategory: (id: string) => Product[],
): Product[] {
  const list = productsByCategory(categoryId);
  if (isPastriesCategoryId(categories, categoryId)) {
    return list.filter((p) => pastryHasPrice(p));
  }
  return list;
}
