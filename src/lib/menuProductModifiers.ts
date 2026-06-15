import type { MilkOption, Product } from '../types/domain';

export const YUZU_SODA_CATEGORY_ID = 'cat_yuzu';

/** Drinks with "oat" in the name already include oat milk — no milk picker. */
export function isOatNamedDrink(product: Pick<Product, 'name'>): boolean {
  return /\boat\b/i.test(product.name);
}

export function isYuzuSodaProduct(product: Pick<Product, 'categoryId'>): boolean {
  return product.categoryId === YUZU_SODA_CATEGORY_ID;
}

/** Printed menu ice icon = iced only. */
export function isIcedOnlyDrink(product: Pick<Product, 'temperature'>): boolean {
  return product.temperature === 'iced';
}

export function showTemperatureChoice(product: Pick<Product, 'temperature'>): boolean {
  return product.temperature === 'both';
}

export function getOrderableMilks(product: Product): MilkOption[] {
  if (isOatNamedDrink(product) || isYuzuSodaProduct(product)) return [];
  return product.milks ?? [];
}

export function showMilkChoice(product: Product): boolean {
  return getOrderableMilks(product).length > 0;
}

export function resolveMilkPriceDelta(product: Product, milkId?: string): number {
  if (!milkId || !showMilkChoice(product)) return 0;
  return getOrderableMilks(product).find((m) => m.id === milkId)?.priceDelta ?? 0;
}

export function resolveMilkLabel(product: Product, milkId?: string): string | undefined {
  if (!milkId || !showMilkChoice(product)) return undefined;
  return getOrderableMilks(product).find((m) => m.id === milkId)?.label;
}

export function defaultOrderTemperature(
  product: Pick<Product, 'temperature'>,
  preferIced = false,
): 'hot' | 'iced' {
  if (product.temperature === 'iced') return 'iced';
  if (product.temperature === 'hot') return 'hot';
  return preferIced ? 'iced' : 'hot';
}

export function resolveOrderTemperature(
  product: Pick<Product, 'temperature'>,
  selected?: 'hot' | 'iced',
): 'hot' | 'iced' {
  if (product.temperature === 'iced') return 'iced';
  if (product.temperature === 'hot') return 'hot';
  return selected ?? 'hot';
}

export function defaultMilkId(product: Product): string | undefined {
  return getOrderableMilks(product)[0]?.id;
}

export function productFallbackDescription(product: Product): string {
  if (product.description) return product.description;
  if (isYuzuSodaProduct(product)) return 'Sparkling yuzu soda — served iced.';
  if (isOatNamedDrink(product)) {
    return showTemperatureChoice(product)
      ? 'Made with oat milk — available hot or iced.'
      : 'Made with oat milk — served iced.';
  }
  if (isIcedOnlyDrink(product)) return 'Served iced — crisp and refreshing.';
  if (showTemperatureChoice(product)) return 'Available hot or iced.';
  return 'Crafted in-house with care.';
}
