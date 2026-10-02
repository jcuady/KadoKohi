import { describe, expect, it } from 'vitest';
import {
  QR_GUEST_DEFAULT_FILTER,
  qrGuestFilterTabs,
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

const byCategoryOf = (list: Product[]) => (id: string) => list.filter((p) => p.categoryId === id);

describe('qrGuestMenu filters', () => {
  const mixedCats: MenuCategory[] = [
    ...categories,
    { id: 'cat_pastries', name: 'Pastries', order: 4, visible: true },
  ];
  const mixed: Product[] = [
    ...products,
    product({ id: 'cookie_klassic', categoryId: 'cat_pastries', name: 'Klassic Cookie', basePrice: 100 }),
  ];

  it('opens on All so every drink and pastry is listed', () => {
    expect(QR_GUEST_DEFAULT_FILTER).toBe('all');
    const sections = qrGuestMenuSections(mixedCats, mixed, byCategoryOf(mixed));
    expect(sections.map((s) => s.id)).toEqual(['cat_a', 'cat_b', 'cat_pastries']);
  });

  it('offers All, Drinks, Pastries, then On promo', () => {
    const tabs = qrGuestFilterTabs(mixedCats, mixed, byCategoryOf(mixed));
    expect(tabs.map((t) => t.id)).toEqual(['all', 'drinks', 'pastries', MENU_PROMO_FILTER_ID]);
  });

  it('narrows sections to drinks or pastries', () => {
    const drinks = qrGuestMenuSections(mixedCats, mixed, byCategoryOf(mixed), 'drinks');
    expect(drinks.map((s) => s.id)).toEqual(['cat_a', 'cat_b']);
    const pastries = qrGuestMenuSections(mixedCats, mixed, byCategoryOf(mixed), 'pastries');
    expect(pastries.map((s) => s.id)).toEqual(['cat_pastries']);
  });

  it('hides Pastries and On promo pills when they would be empty', () => {
    const plain = products.filter((p) => !p.discountType);
    const tabs = qrGuestFilterTabs(categories, plain, byCategoryOf(plain));
    expect(tabs.map((t) => t.id)).toEqual(['all', 'drinks']);
  });
});

describe('qrGuestMenu promo rail', () => {

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
    const sections = qrGuestMenuSections(cats, pastryProducts, byCategoryOf(pastryProducts));
    const pastrySections = sections.filter((s) => s.name === 'Pastries');
    expect(pastrySections).toHaveLength(1);
    expect(pastrySections[0]?.id).toBe('cat_pastries');
  });

  it('lists Kuki Box SKUs on the pastry tab and hides packaging add-ons', () => {
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
        id: 'kuki_pack_big',
        categoryId: 'cat_pastries',
        name: 'Big box packaging',
        basePrice: 25,
      }),
    ];
    const byCategory = (id: string) => pastries.filter((p) => p.categoryId === id);
    const list = qrGuestProductsInCategory('cat_pastries', cats, byCategory, pastries);
    expect(list.map((p) => p.id)).toEqual(['cookie_klassic', 'kuki_box_10']);
  });
});
