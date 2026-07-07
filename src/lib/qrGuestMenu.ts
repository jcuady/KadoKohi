import type { MenuCategory, Product } from '../types/domain';
import { findPastriesCategory, isPastriesCategory, isPastriesCategoryId, pastryHasPrice, pastriesProducts } from './pastriesCategory';

export type QrGuestCategoryTab = { id: string; name: string };

export type QrGuestMenuSection = {
  id: string;
  name: string;
  products: Product[];
};

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

/** All visible guest menu sections (every category on one scroll). */
export function qrGuestMenuSections(
  categories: MenuCategory[],
  products: Product[],
  productsByCategory: (id: string) => Product[],
): QrGuestMenuSection[] {
  return qrGuestCategoryTabs(categories, products)
    .map((tab) => ({
      id: tab.id,
      name: tab.name,
      products: qrGuestProductsInCategory(tab.id, categories, productsByCategory),
    }))
    .filter((section) => section.products.length > 0);
}
