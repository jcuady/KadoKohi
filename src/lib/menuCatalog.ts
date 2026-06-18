import type { MenuCategory, Product } from '../types/domain';
import { normalizeExternalMenuImageUrl } from './menuProductImage';

const FALLBACK_IMAGE_BY_CATEGORY: Record<string, string> = {
  cat_classics:
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=700&auto=format&fit=crop',
  cat_signatures:
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?q=80&w=700&auto=format&fit=crop',
  cat_matcha:
    'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=700&auto=format&fit=crop',
  cat_yuzu:
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=700&auto=format&fit=crop',
};

const PASTRY_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=700&auto=format&fit=crop';

export const DEFAULT_MENU_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=700&auto=format&fit=crop';

export function isMerchCategoryName(name: string | undefined): boolean {
  return Boolean(name?.toLowerCase().includes('merch'));
}

/** Same image resolution as /menu — product.image from Supabase, then category fallback. */
export function getMenuProductImageUrl(
  product: Pick<Product, 'image' | 'categoryId'>,
  options?: { pastriesCategoryId?: string },
): string {
  const fromProduct = product.image?.trim();
  if (fromProduct) return normalizeExternalMenuImageUrl(fromProduct);
  if (product.categoryId && FALLBACK_IMAGE_BY_CATEGORY[product.categoryId]) {
    return FALLBACK_IMAGE_BY_CATEGORY[product.categoryId];
  }
  if (options?.pastriesCategoryId && product.categoryId === options.pastriesCategoryId) {
    return PASTRY_FALLBACK_IMAGE;
  }
  return DEFAULT_MENU_PRODUCT_IMAGE;
}

/** Ordered URLs to try when a product image fails to load (product → category → default). */
export function getMenuProductImageFallbackChain(
  product: Pick<Product, 'image' | 'categoryId'>,
  options?: { pastriesCategoryId?: string },
): string[] {
  const urls: string[] = [];
  const push = (url: string) => {
    if (url && !urls.includes(url)) urls.push(url);
  };

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
