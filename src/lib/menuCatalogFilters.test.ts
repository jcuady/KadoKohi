import { describe, expect, it } from 'vitest';
import {
  baseProductsForFilters,
  DEFAULT_MENU_CATALOG_FILTERS,
  MENU_PROMO_FILTER_ID,
  parseMenuCatalogFilters,
  writeMenuCatalogFilters,
} from './menuCatalogFilters';
import type { MenuCategory, Product } from '../types/domain';

function product(overrides: Partial<Product> & Pick<Product, 'id' | 'categoryId' | 'name'>): Product {
  return {
    basePrice: 180,
    temperature: 'both',
    sizes: [],
    milks: [],
    visible: true,
    order: 0,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

const categories: MenuCategory[] = [
  { id: 'cat_a', name: 'Signatures', order: 0, visible: true },
  { id: 'cat_b', name: 'Classics', order: 1, visible: true },
];

const products: Product[] = [
  product({
    id: 'p1',
    categoryId: 'cat_a',
    name: 'Sale Latte',
    discountType: 'percent',
    discountValue: 10,
    order: 0,
  }),
  product({ id: 'p2', categoryId: 'cat_a', name: 'Full Price', order: 1 }),
  product({
    id: 'p3',
    categoryId: 'cat_b',
    name: 'Fixed Off',
    discountType: 'fixed',
    discountValue: 20,
    order: 0,
  }),
];

describe('MENU_PROMO_FILTER_ID', () => {
  it('returns only discounted products for the promo rail', () => {
    const byCategory = new Map<string, Product[]>();
    for (const p of products) {
      const list = byCategory.get(p.categoryId) ?? [];
      list.push(p);
      byCategory.set(p.categoryId, list);
    }
    const ctx = {
      categories,
      productsByCategory: (id: string) => byCategory.get(id) ?? [],
    };

    const list = baseProductsForFilters(
      { ...DEFAULT_MENU_CATALOG_FILTERS, categoryId: MENU_PROMO_FILTER_ID },
      ctx,
    );

    expect(list.map((p) => p.id)).toEqual(['p1', 'p3']);
  });

  it('round-trips category=promo in the URL', () => {
    const params = writeMenuCatalogFilters(
      new URLSearchParams(),
      { ...DEFAULT_MENU_CATALOG_FILTERS, categoryId: MENU_PROMO_FILTER_ID },
    );
    expect(params.get('category')).toBe('promo');
    expect(parseMenuCatalogFilters(params).categoryId).toBe(MENU_PROMO_FILTER_ID);
  });

  it('keeps Kuki Boxes in the public menu and hides packaging SKUs', () => {
    const cats: MenuCategory[] = [
      { id: 'cat_pastries', name: 'Pastries', order: 4, visible: true },
    ];
    const pastries: Product[] = [
      product({
        id: 'cookie_klassic',
        categoryId: 'cat_pastries',
        name: 'Klassic Cookie',
        basePrice: 100,
      }),
      product({
        id: 'kuki_box_10',
        categoryId: 'cat_pastries',
        name: 'Kuki Box - 10 pcs',
        basePrice: 900,
      }),
      product({
        id: 'kuki_pack_single',
        categoryId: 'cat_pastries',
        name: 'Single cookie box packaging',
        basePrice: 10,
      }),
    ];
    const ctx = {
      categories: cats,
      productsByCategory: (id: string) => pastries.filter((p) => p.categoryId === id),
    };
    const list = baseProductsForFilters({ ...DEFAULT_MENU_CATALOG_FILTERS, categoryId: 'all' }, ctx);
    expect(list.map((p) => p.id)).toEqual(['cookie_klassic', 'kuki_box_10']);
  });
});
