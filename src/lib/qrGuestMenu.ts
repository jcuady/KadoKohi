import type { MenuCategory, Product } from '../types/domain';
import { findPastriesCategory, isPastriesCategory, isPastriesCategoryId, pastryHasPrice, pastriesProducts } from './pastriesCategory';
import { hasProductDiscount } from './productPricing';
import { isPromoFilterId, MENU_PROMO_FILTER_ID } from './menuCatalogFilters';
import { isKukiBuilderOnlyProduct } from './kukido';

export type QrGuestCategoryTab = { id: string; name: string };

export type QrGuestMenuSection = {
  id: string;
  name: string;
  products: Product[];
};

/** Real menu category pills (no special rails). */
function qrGuestRealCategoryTabs(
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

/** Category pills for guest QR menus — On promo first, then real categories. */
export function qrGuestCategoryTabs(
  categories: MenuCategory[],
  products: Product[],
): QrGuestCategoryTab[] {
  return [
    { id: MENU_PROMO_FILTER_ID, name: 'On promo' },
    ...qrGuestRealCategoryTabs(categories, products),
  ];
}

/** Default pill when tabs load — first real category, not On promo. */
export function qrGuestDefaultCategoryId(tabs: QrGuestCategoryTab[]): string {
  return tabs.find((t) => !isPromoFilterId(t.id))?.id ?? tabs[0]?.id ?? '';
}

/** Products for a category tab. */
export function qrGuestProductsInCategory(
  categoryId: string,
  categories: MenuCategory[],
  productsByCategory: (id: string) => Product[],
  allProducts?: Product[],
): Product[] {
  if (isPromoFilterId(categoryId)) {
    const source =
      allProducts ??
      categories.flatMap((c) => productsByCategory(c.id));
    return source
      .filter((p) => p.visible && hasProductDiscount(p) && !isKukiBuilderOnlyProduct(p.id))
      .filter((p) => !isPastriesCategoryId(categories, p.categoryId) || pastryHasPrice(p))
      .sort((a, b) => a.order - b.order);
  }
  const list = productsByCategory(categoryId);
  if (isPastriesCategoryId(categories, categoryId)) {
    return list.filter((p) => pastryHasPrice(p) && !isKukiBuilderOnlyProduct(p.id));
  }
  return list.filter((p) => !isKukiBuilderOnlyProduct(p.id));
}

/** Scroll sections for full-menu browse — excludes the On promo rail (shown as a filtered grid). */
export function qrGuestMenuSections(
  categories: MenuCategory[],
  products: Product[],
  productsByCategory: (id: string) => Product[],
): QrGuestMenuSection[] {
  return qrGuestRealCategoryTabs(categories, products)
    .map((tab) => ({
      id: tab.id,
      name: tab.name,
      products: qrGuestProductsInCategory(tab.id, categories, productsByCategory),
    }))
    .filter((section) => section.products.length > 0);
}
