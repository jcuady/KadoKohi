import type { MenuCategory, Product } from '../types/domain';
import { isIcedOnlyDrink, productFallbackDescription } from './menuProductModifiers';
import { isPastriesCategoryId, pastryHasPrice } from './pastriesCategory';
import { isProductInStock } from './productStock';

export type MenuTemperatureFilter = 'all' | 'hot' | 'iced' | 'both';
export type MenuSortKey = 'order' | 'name' | 'price_asc' | 'price_desc';

export type MenuCatalogFilters = {
  query: string;
  categoryId: 'all' | string;
  temperature: MenuTemperatureFilter;
  inStockOnly: boolean;
  sort: MenuSortKey;
};

export const DEFAULT_MENU_CATALOG_FILTERS: MenuCatalogFilters = {
  query: '',
  categoryId: 'all',
  temperature: 'all',
  inStockOnly: false,
  sort: 'order',
};

export type MenuCatalogFilterContext = {
  categories: MenuCategory[];
  productsByCategory: (categoryId: string) => Product[];
};

const SORT_OPTIONS: MenuSortKey[] = ['order', 'name', 'price_asc', 'price_desc'];
const TEMP_OPTIONS: MenuTemperatureFilter[] = ['all', 'hot', 'iced', 'both'];

function searchTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export function matchesMenuSearch(
  product: Product,
  query: string,
  categoryName?: string,
): boolean {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return true;

  const haystack = [
    product.name,
    product.description ?? '',
    productFallbackDescription(product),
    ...(product.tags ?? []),
    categoryName ?? '',
  ]
    .join(' ')
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

function productTemperature(product: Product): 'hot' | 'iced' | 'both' {
  if (product.temperature === 'hot' || product.temperature === 'iced') return product.temperature;
  if (isIcedOnlyDrink(product)) return 'iced';
  return 'both';
}

function matchesTemperature(product: Product, temperature: MenuTemperatureFilter): boolean {
  if (temperature === 'all') return true;
  const temp = productTemperature(product);
  if (temperature === 'both') return temp === 'both';
  return temp === temperature;
}

function sortProducts(products: Product[], sort: MenuSortKey): Product[] {
  const list = [...products];
  switch (sort) {
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case 'price_asc':
      return list.sort((a, b) => a.basePrice - b.basePrice || a.order - b.order);
    case 'price_desc':
      return list.sort((a, b) => b.basePrice - a.basePrice || a.order - b.order);
    case 'order':
    default:
      return list.sort((a, b) => a.order - b.order);
  }
}

/** Flatten visible products in category order (for "All" browse). */
export function flattenMenuProducts(ctx: MenuCatalogFilterContext): Product[] {
  const sortedCategories = [...ctx.categories]
    .filter((c) => c.visible)
    .sort((a, b) => a.order - b.order);

  const out: Product[] = [];
  for (const cat of sortedCategories) {
    let items = ctx.productsByCategory(cat.id);
    if (isPastriesCategoryId(ctx.categories, cat.id)) {
      items = items.filter((p) => pastryHasPrice(p));
    }
    out.push(...items);
  }
  return out;
}

export function baseProductsForFilters(
  filters: MenuCatalogFilters,
  ctx: MenuCatalogFilterContext,
): Product[] {
  if (filters.categoryId === 'all') return flattenMenuProducts(ctx);
  let items = ctx.productsByCategory(filters.categoryId);
  if (isPastriesCategoryId(ctx.categories, filters.categoryId)) {
    items = items.filter((p) => pastryHasPrice(p));
  }
  return items;
}

export function filterMenuProducts(
  products: Product[],
  filters: MenuCatalogFilters,
  ctx: MenuCatalogFilterContext,
): Product[] {
  const categoryNameById = new Map(ctx.categories.map((c) => [c.id, c.name]));

  let list = products.filter((p) => {
    if (!p.visible) return false;
    if (filters.inStockOnly && !isProductInStock(p)) return false;
    if (!matchesTemperature(p, filters.temperature)) return false;
    if (!matchesMenuSearch(p, filters.query, categoryNameById.get(p.categoryId))) return false;
    return true;
  });

  if (filters.sort === 'order' && filters.categoryId === 'all') {
    const orderMap = new Map(products.map((p, i) => [p.id, i]));
    list.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
  } else {
    list = sortProducts(list, filters.sort);
  }

  return list;
}

export function hasQrFilteredBrowse(filters: MenuCatalogFilters): boolean {
  return (
    Boolean(filters.query.trim()) ||
    filters.temperature !== 'all' ||
    filters.inStockOnly ||
    filters.sort !== 'order'
  );
}

export function hasActiveMenuFilters(filters: MenuCatalogFilters): boolean {
  return (
    Boolean(filters.query.trim()) ||
    filters.categoryId !== 'all' ||
    filters.temperature !== 'all' ||
    filters.inStockOnly ||
    filters.sort !== 'order'
  );
}

/** Online /menu: show full grid on All tab with default filters; paginate when filtered or per-category overflow. */
export function shouldPaginateMenuCatalog(
  filters: MenuCatalogFilters,
  resultCount: number,
  pageSize: number,
): boolean {
  if (resultCount <= pageSize) return false;
  const browsingAll =
    filters.categoryId === 'all' &&
    !Boolean(filters.query.trim()) &&
    filters.temperature === 'all' &&
    !filters.inStockOnly &&
    filters.sort === 'order';
  return !browsingAll;
}

export function parseMenuCatalogFilters(params: URLSearchParams): MenuCatalogFilters {
  const sort = params.get('sort')?.trim() as MenuSortKey | undefined;
  const temp = params.get('temp')?.trim() as MenuTemperatureFilter | undefined;
  const category = params.get('category')?.trim();

  return {
    query: params.get('q')?.trim() ?? '',
    categoryId: category && category !== 'all' ? category : 'all',
    temperature: temp && TEMP_OPTIONS.includes(temp) ? temp : 'all',
    inStockOnly: params.get('stock') === '1',
    sort: sort && SORT_OPTIONS.includes(sort) ? sort : 'order',
  };
}

export function writeMenuCatalogFilters(
  params: URLSearchParams,
  filters: MenuCatalogFilters,
  page?: number,
): URLSearchParams {
  const next = new URLSearchParams(params);

  if (filters.query.trim()) next.set('q', filters.query.trim());
  else next.delete('q');

  if (filters.categoryId !== 'all') next.set('category', filters.categoryId);
  else next.delete('category');

  if (filters.temperature !== 'all') next.set('temp', filters.temperature);
  else next.delete('temp');

  if (filters.inStockOnly) next.set('stock', '1');
  else next.delete('stock');

  if (filters.sort !== 'order') next.set('sort', filters.sort);
  else next.delete('sort');

  if (page && page > 1) next.set('page', String(page));
  else next.delete('page');

  return next;
}

export function parseMenuPage(params: URLSearchParams): number {
  const raw = Number(params.get('page'));
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
}
