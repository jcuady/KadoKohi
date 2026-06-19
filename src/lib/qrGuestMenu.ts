import type { MenuCategory, Product } from '../types/domain';
import {
  collabPastries,
  findPastriesCategory,
  isMixMatchCookie,
  isPastriesCategory,
  isPastriesCategoryId,
  mixMatchCookies,
  mixMatchDrinkProducts,
} from './pastriesCategory';

/** Virtual category tab id for QR dine-in / takeout Mix & Match section. */
export const QR_MIX_MATCH_SECTION_ID = '__mix_match__';

export function qrGuestHasMixMatchSection(categories: MenuCategory[], products: Product[]): boolean {
  return (
    mixMatchDrinkProducts(categories, products).length > 0 ||
    mixMatchCookies(categories, products).length > 0
  );
}

export type QrGuestCategoryTab = { id: string; name: string };

/** Category pills for guest QR menus — Mix & Match is its own tab; pastry cookies live there only. */
export function qrGuestCategoryTabs(
  categories: MenuCategory[],
  products: Product[],
): QrGuestCategoryTab[] {
  const pastries = findPastriesCategory(categories);
  const showPastriesTab =
    Boolean(pastries?.visible) && collabPastries(categories, products).length > 0;

  const tabs: QrGuestCategoryTab[] = categories
    .filter((c) => {
      if (!c.visible) return false;
      if (isPastriesCategory(c)) return showPastriesTab;
      return true;
    })
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ id: c.id, name: c.name }));

  if (qrGuestHasMixMatchSection(categories, products)) {
    tabs.push({ id: QR_MIX_MATCH_SECTION_ID, name: 'Mix & Match' });
  }

  return tabs;
}

export function qrGuestIsMixMatchSection(activeCat: string): boolean {
  return activeCat === QR_MIX_MATCH_SECTION_ID;
}

/** Products for a category tab — mix-match cookies only appear under the Mix & Match tab. */
export function qrGuestProductsInCategory(
  categoryId: string,
  categories: MenuCategory[],
  productsByCategory: (id: string) => Product[],
): Product[] {
  const list = productsByCategory(categoryId);
  if (isPastriesCategoryId(categories, categoryId)) {
    return list.filter((p) => !isMixMatchCookie(p));
  }
  return list;
}
