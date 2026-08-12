import type { MenuCategory, Product } from '../types/domain';
import { normalizeExternalMenuImageUrl } from './menuProductImage';
import { displaySizedImage } from './supabaseSizedImage';
import { isKukidoCookieId, KUKIDO_COOKIE_IMAGE } from './kukido';

/** Bundled fallbacks — avoid external URLs that 404 in production. */
const FALLBACK_IMAGE_BY_CATEGORY: Record<string, string> = {
  cat_classics: '/social/cafe-latte.webp',
  cat_signatures: '/social/coffee-series.webp',
  cat_matcha: '/social/matcha-series.webp',
  cat_yuzu: '/social/matcha-latte.webp',
};

const PASTRY_FALLBACK_IMAGE = '/kukido/collab-plate.webp';

export const DEFAULT_MENU_PRODUCT_IMAGE = '/social/cafe-latte.webp';

function kukidoLocalImage(product: { id?: string }): string | null {
  if (!product.id || !isKukidoCookieId(product.id)) return null;
  return KUKIDO_COOKIE_IMAGE[product.id];
}

export function isMerchCategoryName(name: string | undefined): boolean {
  return Boolean(name?.toLowerCase().includes('merch'));
}

/** Same image resolution as /menu — kukidō cutouts first, then product.image, then category fallback. */
export function getMenuProductImageUrl(
  product: Pick<Product, 'image' | 'categoryId'> & { id?: string },
  options?: { pastriesCategoryId?: string; displayWidth?: number },
): string {
  const localCookie = kukidoLocalImage(product);
  if (localCookie) return localCookie;

  const fromProduct = product.image?.trim();
  if (fromProduct) {
    const normalized = normalizeExternalMenuImageUrl(fromProduct);
    return displaySizedImage(normalized, options?.displayWidth ?? 560);
  }
  if (product.categoryId && FALLBACK_IMAGE_BY_CATEGORY[product.categoryId]) {
    return FALLBACK_IMAGE_BY_CATEGORY[product.categoryId];
  }
  if (options?.pastriesCategoryId && product.categoryId === options.pastriesCategoryId) {
    return PASTRY_FALLBACK_IMAGE;
  }
  return DEFAULT_MENU_PRODUCT_IMAGE;
}

/** Ordered URLs to try when a product image fails to load (local cookie → product → category → default). */
export function getMenuProductImageFallbackChain(
  product: Pick<Product, 'image' | 'categoryId'> & { id?: string },
  options?: { pastriesCategoryId?: string },
): string[] {
  const urls: string[] = [];
  const push = (url: string) => {
    if (url && !urls.includes(url)) urls.push(url);
  };

  const localCookie = kukidoLocalImage(product);
  if (localCookie) push(localCookie);

  const fromProduct = product.image?.trim();
  if (fromProduct) push(normalizeExternalMenuImageUrl(fromProduct));

  if (product.categoryId && FALLBACK_IMAGE_BY_CATEGORY[product.categoryId]) {
    push(FALLBACK_IMAGE_BY_CATEGORY[product.categoryId]);
  }
  if (options?.pastriesCategoryId && product.categoryId === options.pastriesCategoryId) {
    push(PASTRY_FALLBACK_IMAGE);
  }
  push(DEFAULT_MENU_PRODUCT_IMAGE);
  return urls;
}

export function listVisibleCoffeeProducts(
  products: Product[],
  categories: MenuCategory[],
): Product[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const visibleCats = categories.filter((c) => c.visible).sort((a, b) => a.order - b.order);
  const catOrder = new Map(visibleCats.map((c, i) => [c.id, i]));

  return products
    .filter((p) => {
      if (!p.visible || !p.categoryId) return false;
      const cat = categoryById.get(p.categoryId);
      if (!cat?.visible) return false;
      return !isMerchCategoryName(cat.name);
    })
    .sort((a, b) => {
      const ca = catOrder.get(a.categoryId!) ?? 999;
      const cb = catOrder.get(b.categoryId!) ?? 999;
      if (ca !== cb) return ca - cb;
      return a.order - b.order;
    });
}

export function pickFeaturedCoffeeProducts(
  productIds: readonly string[],
  catalog: Product[],
  limit = 3,
): Product[] {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const picked = productIds
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => byId.get(id))
    .filter((p): p is Product => Boolean(p));

  if (picked.length >= limit) return picked.slice(0, limit);

  const used = new Set(picked.map((p) => p.id));
  const fill = catalog.filter((p) => !used.has(p.id));
  return [...picked, ...fill].slice(0, limit);
}
