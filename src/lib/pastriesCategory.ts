import type { MenuCategory, Product } from '../types/domain';
import { PASTRIES_PAGE } from '../content/pastriesPage';

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

function hasTag(product: Product, tag: string): boolean {
  return (product.tags ?? []).some((t) => t.trim().toLowerCase() === tag.toLowerCase());
}

export function isCollabPastry(product: Product): boolean {
  return hasTag(product, PASTRIES_PAGE.collabTag) || hasTag(product, 'kukilatte');
}

export function isMixMatchCookie(product: Product): boolean {
  if (isCollabPastry(product)) return false;
  return hasTag(product, PASTRIES_PAGE.mixMatchCookieTag) || hasTag(product, 'cookie');
}

function nameMatchesList(productName: string, configName: string): boolean {
  const p = productName.trim().toLowerCase();
  const c = configName.trim().toLowerCase();
  return p === c || p.startsWith(`${c} `) || p.startsWith(c) || c.startsWith(p);
}

function sortByConfigNames(products: Product[], names: readonly string[]): Product[] {
  return [...products].sort((a, b) => {
    const ia = names.findIndex((n) => nameMatchesList(a.name, n));
    const ib = names.findIndex((n) => nameMatchesList(b.name, n));
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

/** Step 2 — Kukidō cookies for the bundle (excludes collab items like Kukilatte). */
export function mixMatchCookies(categories: MenuCategory[], products: Product[]): Product[] {
  const tagged = pastriesProducts(categories, products).filter(
    (p) => isMixMatchCookie(p) && pastryHasPrice(p),
  );
  if (tagged.length > 0) return sortByConfigNames(tagged, PASTRIES_PAGE.defaultCookieNames);

  const byName = PASTRIES_PAGE.defaultCookieNames
    .map((name) => pastriesProducts(categories, products).find((p) => nameMatchesList(p.name, name)))
    .filter((p): p is Product => Boolean(p));
  return byName;
}

/** Featured collab pastries (e.g. Kado Kukilatte). */
export function collabPastries(categories: MenuCategory[], products: Product[]): Product[] {
  return pastriesProducts(categories, products).filter((p) => isCollabPastry(p));
}

export type MixMatchDrinkEntry =
  | { kind: 'product'; product: Product }
  | { kind: 'label'; name: string };

export function findFeaturedPastry(products: Product[], idOrSlug?: string): Product | undefined {
  if (idOrSlug?.trim()) {
    const hit = products.find((p) => p.id === idOrSlug || p.name.trim().toLowerCase() === idOrSlug.toLowerCase());
    if (hit) return hit;
  }
  return products.find((p) => hasTag(p, 'kukilatte') || hasTag(p, 'featured'));
}

export function mixMatchDrinkEntries(categories: MenuCategory[], products: Product[]): MixMatchDrinkEntry[] {
  const pastriesId = findPastriesCategory(categories)?.id;
  const coffee = products.filter((p) => p.visible && p.categoryId && p.categoryId !== pastriesId);

  const tag = PASTRIES_PAGE.mixMatchDrinkTag.toLowerCase();
  const tagged = coffee.filter((p) => hasTag(p, tag));
  if (tagged.length > 0) {
    return sortByConfigNames(tagged, PASTRIES_PAGE.defaultDrinkNames).map((product) => ({
      kind: 'product' as const,
      product,
    }));
  }

  const used = new Set<string>();
  const entries: MixMatchDrinkEntry[] = [];

  for (const name of PASTRIES_PAGE.defaultDrinkNames) {
    const match = coffee.find((p) => nameMatchesList(p.name, name));
    if (match && !used.has(match.id)) {
      used.add(match.id);
      entries.push({ kind: 'product', product: match });
    } else {
      entries.push({ kind: 'label', name });
    }
  }

  return entries;
}

export function mixMatchDrinkProducts(categories: MenuCategory[], products: Product[]): Product[] {
  return mixMatchDrinkEntries(categories, products)
    .filter((e): e is { kind: 'product'; product: Product } => e.kind === 'product')
    .map((e) => e.product);
}

export function computeMixMatchBundleTotal(drink: Product, cookie: Product): {
  drinkPrice: number;
  cookiePrice: number;
  subtotal: number;
  discount: number;
  total: number;
} {
  const drinkPrice = Number(drink.basePrice) || 0;
  const cookiePrice = Number(cookie.basePrice) || 0;
  const subtotal = drinkPrice + cookiePrice;
  const discount = Math.round(subtotal * (PASTRIES_PAGE.bundleDiscountPercent / 100));
  const total = subtotal - discount;
  return { drinkPrice, cookiePrice, subtotal, discount, total };
}
