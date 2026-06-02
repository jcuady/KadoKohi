/**
 * Canonical coffee menu (KADO MENU V2 flyer).
 * Synced to Supabase via migration `0021_menu_v2_catalog.sql`.
 */
import type { MenuCategory, MilkOption, Product, ProductTemperature } from '../types/domain';

const now = () => new Date().toISOString();

/** Standard milk modifiers — Milk +0, Oat +40. */
export const MENU_MILK_OPTIONS: MilkOption[] = [
  { id: 'milk_regular', label: 'Milk', priceDelta: 0 },
  { id: 'milk_oat', label: 'Oat', priceDelta: 40 },
];

const withMilks = MENU_MILK_OPTIONS;
const noMilks: MilkOption[] = [];

function product(
  id: string,
  categoryId: string,
  name: string,
  basePrice: number,
  temperature: ProductTemperature,
  order: number,
  opts?: { milks?: MilkOption[]; tags?: string[]; description?: string },
): Product {
  return {
    id,
    categoryId,
    branchId: null,
    name,
    description: opts?.description,
    basePrice,
    image: undefined,
    temperature,
    sizes: [],
    milks: opts?.milks ?? withMilks,
    tags: opts?.tags,
    customFields: [],
    visible: true,
    inStock: true,
    order,
    createdAt: now(),
    updatedAt: now(),
  };
}

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'cat_classics', branchId: null, name: 'Espresso Based Classics', order: 0, visible: true },
  { id: 'cat_signatures', branchId: null, name: 'Espresso Based Signatures', order: 1, visible: true },
  { id: 'cat_matcha', branchId: null, name: 'Matcha & Hojicha', order: 2, visible: true },
  { id: 'cat_yuzu', branchId: null, name: 'Yuzu Soda', order: 3, visible: true },
];

export const MENU_PRODUCTS: Product[] = [
  // ── Espresso Based Classics ──
  product('prod_amerikado', 'cat_classics', 'AmeriKADO', 130, 'both', 0, { milks: noMilks }),
  product('prod_cafe_latte', 'cat_classics', 'Cafe Latte', 160, 'both', 1),
  product('prod_cappuccino', 'cat_classics', 'Cappucinno', 160, 'both', 2),
  product('prod_flat_white', 'cat_classics', 'Flat White', 150, 'both', 3),
  product('prod_moka_latte', 'cat_classics', 'Moka Latte', 170, 'both', 4),
  product('prod_karamel_latte', 'cat_classics', 'Karamel Latte', 170, 'both', 5),
  product('prod_spanish_latte', 'cat_classics', 'Spanish Latte', 170, 'both', 6),

  // ── Espresso Based Signatures ──
  product('prod_kado_latte', 'cat_signatures', 'KADO Latte', 195, 'iced', 0, {
    tags: ['iced-only'],
  }),
  product('prod_ube_shio', 'cat_signatures', 'Ube Shio Karamel Latte', 195, 'both', 1),
  product('prod_yuzu_amerikado', 'cat_signatures', 'Yuzu AmeriKado', 195, 'iced', 2, {
    tags: ['iced-only'],
    milks: noMilks,
  }),
  product('prod_nori_salted', 'cat_signatures', 'Nori Salted Cream Latte', 195, 'iced', 3, {
    tags: ['iced-only'],
  }),

  // ── Matcha & Hojicha ──
  product('prod_matcha_oat', 'cat_matcha', 'Matcha Oat Latte', 170, 'both', 0),
  product('prod_dirty_matcha', 'cat_matcha', 'Dirty Matcha Oat Latte', 200, 'both', 1),
  product('prod_matcha_straw', 'cat_matcha', 'Matcha Strawberry Oat Latte', 180, 'iced', 2, {
    tags: ['iced-only'],
  }),
  product('prod_hojicha_oat', 'cat_matcha', 'Hojicha Oat Latte', 200, 'both', 3),
  product('prod_salted_hojicha', 'cat_matcha', 'Salted Cream Hojicha Oat Latte', 210, 'iced', 4, {
    tags: ['iced-only'],
  }),

  // ── Yuzu Soda (iced only, no milk) ──
  product('prod_yuzu_lime', 'cat_yuzu', 'Yuzu Lime Soda', 140, 'iced', 0, {
    tags: ['iced-only'],
    milks: noMilks,
  }),
  product('prod_yuzu_straw', 'cat_yuzu', 'Yuzu Strawberry Soda', 140, 'iced', 1, {
    tags: ['iced-only'],
    milks: noMilks,
  }),
];

/** Product IDs that are iced-only (no hot option). */
export const ICED_ONLY_PRODUCT_IDS = new Set(
  MENU_PRODUCTS.filter((p) => p.temperature === 'iced').map((p) => p.id),
);

/** Coffee menu category IDs (KADO MENU V2). Excludes merch mirror category. */
export const COFFEE_MENU_CATEGORY_IDS = [
  'cat_classics',
  'cat_signatures',
  'cat_matcha',
  'cat_yuzu',
] as const;

export const MERCH_MIRROR_CATEGORY_ID = 'cat_hidden_merch';

export function isCoffeeMenuCategory(categoryId: string): boolean {
  return (COFFEE_MENU_CATEGORY_IDS as readonly string[]).includes(categoryId);
}

export function filterCoffeeMenu(categories: MenuCategory[], products: Product[]) {
  const coffeeCategories = categories
    .filter((c) => isCoffeeMenuCategory(c.id))
    .sort((a, b) => a.order - b.order);
  const catIds = new Set(coffeeCategories.map((c) => c.id));
  const coffeeProducts = products
    .filter((p) => p.categoryId && catIds.has(p.categoryId))
    .sort((a, b) => a.order - b.order);
  return { categories: coffeeCategories, products: coffeeProducts };
}
