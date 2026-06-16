import type { Product } from '../types/domain';
import { PASTRIES_PAGE } from '../content/pastriesPage';
import { computeMixMatchBundleTotal } from './pastriesCategory';
import { resolveMilkLabel, resolveMilkPriceDelta } from './menuProductModifiers';
import { isProductInStock } from './productStock';
import { pastryHasPrice } from './pastriesCategory';

export type MixMatchMode = 'bundle' | 'drink-only' | 'cookie-only';

export function resolveMixMatchMode(
  drink: Product | undefined,
  cookie: Product | undefined,
): MixMatchMode | null {
  if (drink && cookie) return 'bundle';
  if (drink) return 'drink-only';
  if (cookie) return 'cookie-only';
  return null;
}

export function mixMatchSelectionLabel(
  mode: MixMatchMode,
  drink?: Product,
  cookie?: Product,
): string {
  if (mode === 'bundle' && drink && cookie) {
    return `Mix & Match: ${drink.name} + ${cookie.name}`;
  }
  if (mode === 'drink-only' && drink) return drink.name;
  if (mode === 'cookie-only' && cookie) return cookie.name;
  return 'Mix & Match';
}

export function mixMatchUnitPrice(
  mode: MixMatchMode,
  drink?: Product,
  cookie?: Product,
  milkId?: string,
): number {
  if (mode === 'bundle' && drink && cookie) {
    const drinkUnit = (Number(drink.basePrice) || 0) + resolveMilkPriceDelta(drink, milkId);
    const cookiePrice = Number(cookie.basePrice) || 0;
    const subtotal = drinkUnit + cookiePrice;
    const discount = Math.round(subtotal * (PASTRIES_PAGE.bundleDiscountPercent / 100) * 100) / 100;
    return Math.round((subtotal - discount) * 100) / 100;
  }
  if (mode === 'drink-only' && drink) {
    return drink.basePrice + resolveMilkPriceDelta(drink, milkId);
  }
  if (mode === 'cookie-only' && cookie) {
    return Number(cookie.basePrice) || 0;
  }
  return 0;
}

export function canAddMixMatchSelection(
  drink: Product | undefined,
  cookie: Product | undefined,
  options?: { requireOpenHours?: boolean; isOpen?: boolean },
): boolean {
  const mode = resolveMixMatchMode(drink, cookie);
  if (!mode) return false;
  if (options?.requireOpenHours && options.isOpen === false) return false;

  if (mode === 'bundle') {
    return (
      Boolean(drink && cookie) &&
      pastryHasPrice(drink!) &&
      pastryHasPrice(cookie!) &&
      isProductInStock(drink!) &&
      isProductInStock(cookie!)
    );
  }
  if (mode === 'drink-only') {
    return Boolean(drink && pastryHasPrice(drink) && isProductInStock(drink));
  }
  return Boolean(cookie && pastryHasPrice(cookie) && isProductInStock(cookie));
}

export function mixMatchAddHint(
  drinkId: string | null,
  cookieId: string | null,
  options?: { requireOpenHours?: boolean; isOpen?: boolean },
): string | null {
  if (options?.requireOpenHours && options.isOpen === false) {
    return 'Online ordering opens during store hours.';
  }
  if (!drinkId && !cookieId) {
    return 'Pick a drink, a cookie, or both for a bundle.';
  }
  return null;
}

export function mixMatchCtaLabel(mode: MixMatchMode | null): string {
  switch (mode) {
    case 'bundle':
      return `Add bundle (${PASTRIES_PAGE.bundleDiscountPercent}% off)`;
    case 'drink-only':
      return 'Add drink to cart';
    case 'cookie-only':
      return 'Add cookie to cart';
    default:
      return 'Add to cart';
  }
}

export function collectMixMatchProductIds(input: {
  productId: string;
  mixMatchCookieId?: string;
}): string[] {
  const ids = [input.productId];
  if (input.mixMatchCookieId) ids.push(input.mixMatchCookieId);
  return ids;
}

export function defaultMixMatchMilkId(drink: Product): string | undefined {
  const milks = drink.milks ?? [];
  return milks[0]?.id;
}

export function buildMixMatchQrPayload(input: {
  mode: MixMatchMode;
  drink?: Product;
  cookie?: Product;
  qty?: number;
  milkId?: string;
  temperature?: 'hot' | 'iced';
}) {
  const qty = input.qty ?? 1;
  const { mode, drink, cookie } = input;

  if (mode === 'cookie-only' && cookie) {
    return {
      productId: cookie.id,
      qty,
    };
  }

  if (mode === 'drink-only' && drink) {
    const milkId = input.milkId ?? defaultMixMatchMilkId(drink);
    return {
      productId: drink.id,
      qty,
      milkId,
      milkLabel: resolveMilkLabel(drink, milkId),
      temperature: input.temperature ?? (drink.temperature === 'hot' ? 'hot' : 'iced'),
    };
  }

  if (mode === 'bundle' && drink && cookie) {
    const milkId = input.milkId ?? defaultMixMatchMilkId(drink);
    return {
      productId: drink.id,
      qty,
      mixMatchCookieId: cookie.id,
      milkId,
      milkLabel: resolveMilkLabel(drink, milkId),
      temperature: input.temperature ?? (drink.temperature === 'hot' ? 'hot' : 'iced'),
    };
  }

  return null;
}
