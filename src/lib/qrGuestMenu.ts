import type { MenuCategory, Product } from '../types/domain';
import {
  findPastriesCategory,
  isPastriesCategory,
  isPastriesCategoryId,
  menuKindOf,
  pastryHasPrice,
  pastriesProducts,
  uniqueVisibleMenuCategories,
  type MenuKind,
} from './pastriesCategory';
import { hasProductDiscount } from './productPricing';
import { isPromoFilterId, MENU_PROMO_FILTER_ID } from './menuCatalogFilters';
import { isKukiPackProduct } from './kukido';

export type QrGuestCategoryTab = { id: string; name: string };

/** Guest menu filter: everything, one kind, or the promo rail. */
export type QrGuestFilterId = 'all' | MenuKind | typeof MENU_PROMO_FILTER_ID;

export const QR_GUEST_DEFAULT_FILTER: QrGuestFilterId = 'all';

export type QrGuestMenuSection = {
  id: string;
  name: string;
  kind: MenuKind;
  products: Product[];
};

/** Real menu category pills (no special rails). Dedupes duplicate display names. */
function qrGuestRealCategoryTabs(
  categories: MenuCategory[],
  products: Product[],
): QrGuestCategoryTab[] {
  const pastries = findPastriesCategory(categories);
  const showPastriesTab =
    Boolean(pastries?.visible) &&
    pastriesProducts(categories, products).some((p) => pastryHasPrice(p));

  return uniqueVisibleMenuCategories(categories)
    .filter((c) => {
      if (isPastriesCategory(c)) return showPastriesTab;
      return true;
    })
    .map((c) => ({ id: c.id, name: c.name }));
}

/** Filter pills — All first, then Drinks / Pastries / On promo when each has items. */
export function qrGuestFilterTabs(
  categories: MenuCategory[],
  products: Product[],
  productsByCategory: (id: string) => Product[],
): QrGuestCategoryTab[] {
  const sections = qrGuestMenuSections(categories, products, productsByCategory);
  const hasKind = (kind: MenuKind) => sections.some((s) => s.kind === kind);
  const hasPromo =
    qrGuestProductsInCategory(MENU_PROMO_FILTER_ID, categories, productsByCategory, products).length > 0;
  return [
    { id: 'all', name: 'All' },
    ...(hasKind('drinks') ? [{ id: 'drinks', name: 'Drinks' }] : []),
    ...(hasKind('pastries') ? [{ id: 'pastries', name: 'Pastries' }] : []),
    ...(hasPromo ? [{ id: MENU_PROMO_FILTER_ID, name: 'On promo' }] : []),
  ];
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
      .filter((p) => p.visible && hasProductDiscount(p) && !isKukiPackProduct(p.id))
      .filter((p) => !isPastriesCategoryId(categories, p.categoryId) || pastryHasPrice(p))
      .sort((a, b) => a.order - b.order);
  }
  const list = productsByCategory(categoryId);
  if (isPastriesCategoryId(categories, categoryId)) {
    return list.filter((p) => pastryHasPrice(p) && !isKukiPackProduct(p.id));
  }
  return list.filter((p) => !isKukiPackProduct(p.id));
}

/** Category sections for menu browse, optionally narrowed to one kind (On promo is a separate grid). */
export function qrGuestMenuSections(
  categories: MenuCategory[],
  products: Product[],
  productsByCategory: (id: string) => Product[],
  filter: string = QR_GUEST_DEFAULT_FILTER,
): QrGuestMenuSection[] {
  return qrGuestRealCategoryTabs(categories, products)
    .map((tab) => ({
      id: tab.id,
      name: tab.name,
      kind: menuKindOf(tab),
      products: qrGuestProductsInCategory(tab.id, categories, productsByCategory),
    }))
    .filter((section) => section.products.length > 0)
    .filter((section) => filter === 'all' || section.kind === filter);
}
