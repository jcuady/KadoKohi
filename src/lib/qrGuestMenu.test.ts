import { describe, expect, it } from 'vitest';
import {
  qrGuestCategoryTabs,
  qrGuestDefaultCategoryId,
  qrGuestMenuSections,
  qrGuestProductsInCategory,
} from './qrGuestMenu';
import { MENU_PROMO_FILTER_ID } from './menuCatalogFilters';
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

describe('qrGuestMenu promo rail', () => {
  it('prepends On promo to category tabs', () => {
    const tabs = qrGuestCategoryTabs(categories, products);
    expect(tabs[0]).toEqual({ id: MENU_PROMO_FILTER_ID, name: 'On promo' });
    expect(tabs.map((t) => t.id)).toEqual([MENU_PROMO_FILTER_ID, 'cat_a', 'cat_b']);
  });

  it('defaults to the first real category, not On promo', () => {
    const tabs = qrGuestCategoryTabs(categories, products);
    expect(qrGuestDefaultCategoryId(tabs)).toBe('cat_a');
  });

  it('lists only discounted products for the promo tab', () => {
    const byCategory = (id: string) => products.filter((p) => p.categoryId === id);
    const list = qrGuestProductsInCategory(MENU_PROMO_FILTER_ID, categories, byCategory, products);
    expect(list.map((p) => p.id)).toEqual(['p1', 'p3']);
  });

  it('excludes On promo from scroll sections', () => {
    const byCategory = (id: string) => products.filter((p) => p.categoryId === id);
    const sections = qrGuestMenuSections(categories, products, byCategory);
    expect(sections.map((s) => s.id)).toEqual(['cat_a', 'cat_b']);
    expect(sections.every((s) => s.id !== MENU_PROMO_FILTER_ID)).toBe(true);
  });

  it('dedupes duplicate Pastries category names to seeded cat_pastries', () => {
    const cats: MenuCategory[] = [
      { id: 'cat_a', name: 'Signatures', order: 0, visible: true },
      { id: 'dup-pastries', name: 'Pastries', order: 4, visible: true },
      { id: 'cat_pastries', name: 'Pastries', order: 4, visible: true },
    ];
    const pastryProducts: Product[] = [
      product({ id: 'cookie_klassic', categoryId: 'cat_pastries', name: 'Klassic Cookie', basePrice: 100 }),
    ];
    const tabs = qrGuestCategoryTabs(cats, pastryProducts);
    const pastryTabs = tabs.filter((t) => t.name === 'Pastries');
    expect(pastryTabs).toHaveLength(1);
    expect(pastryTabs[0]?.id).toBe('cat_pastries');
  });
});
