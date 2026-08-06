import type { CartLineVariant } from '../store/cartStore';
import {
  isKukidoCookieId,
  KUKIDO_COOKIE_IDS,
  KUKI_BOX_OPTIONS,
  KUKI_PACK_BIG_ID,
  KUKI_PACK_BIG_PRICE,
  KUKI_PACK_SINGLE_ID,
  KUKI_PACK_SINGLE_PRICE,
  kukiBoxOption,
  type KukiBoxSize,
} from './kukido';

export type KukiPackChoice = 'none' | 'single' | 'big';

export type KukiBoxCommitLine = {
  productId: string;
  productNameSnapshot: string;
  unitPrice: number;
  lineTotal: number;
  qty: number;
  image?: string;
  selectedVariants?: CartLineVariant[];
};

export function kukiBoxSizeFromProductId(productId: string): KukiBoxSize | null {
  const match = /^kuki_box_(\d+)$/.exec(productId);
  if (!match) return null;
  const size = Number(match[1]) as KukiBoxSize;
  return KUKI_BOX_OPTIONS.some((o) => o.size === size) ? size : null;
}

export function expectedKukiBoxPrice(size: KukiBoxSize): number {
  return kukiBoxOption(size).price;
}

export function sumCookieQtys(qtys: Record<string, number>): number {
  return Object.values(qtys).reduce((sum, n) => sum + Math.max(0, Math.floor(n || 0)), 0);
}

export function sanitizeCookieQtys(
  qtys: Record<string, number>,
  allowedIds: readonly string[] = KUKIDO_COOKIE_IDS,
): Record<string, number> {
  const allowed = new Set(allowedIds);
  const next: Record<string, number> = {};
  for (const [id, raw] of Object.entries(qtys)) {
    if (!allowed.has(id)) continue;
    const qty = Math.max(0, Math.floor(raw || 0));
    if (qty > 0) next[id] = qty;
  }
  return next;
}

export function validateKukiBoxFill(
  size: KukiBoxSize,
  qtys: Record<string, number>,
  allowedIds: readonly string[] = KUKIDO_COOKIE_IDS,
): { ok: boolean; filled: number; remaining: number; error?: string } {
  const allowed = new Set(allowedIds);
  for (const id of Object.keys(qtys)) {
    const qty = Math.floor(qtys[id] || 0);
    if (qty <= 0) continue;
    if (!allowed.has(id)) {
      return {
        ok: false,
        filled: sumCookieQtys(qtys),
        remaining: Math.max(0, size - sumCookieQtys(qtys)),
        error: `Unknown cookie: ${id}`,
      };
    }
  }
  const cleaned = sanitizeCookieQtys(qtys, allowedIds);
  const filled = sumCookieQtys(cleaned);
  const remaining = size - filled;
  return {
    ok: filled === size,
    filled,
    remaining: Math.max(0, remaining),
    error: filled === size ? undefined : `Fill exactly ${size} cookies`,
  };
}

export function buildKukiBoxMerchVariants(
  qtys: Record<string, number>,
  labels: Record<string, string>,
): CartLineVariant[] {
  return Object.entries(sanitizeCookieQtys(qtys))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cookieId, qty]) => {
      const label =
        labels[cookieId]?.trim() ||
        (isKukidoCookieId(cookieId) ? cookieId.replace(/^cookie_/, '').replace(/_/g, ' ') : cookieId);
      return {
        groupName: 'Cookies',
        optionId: cookieId,
        optionLabel: qty > 1 ? `${label} ×${qty}` : label,
        priceDelta: 0,
        qty,
      };
    });
}

/** Recover cookie counts from cart/order variant snapshots. */
export function parseKukiCookieQtysFromVariants(
  variants: Array<{ groupName?: string; optionId?: string; optionLabel?: string; qty?: number }> | undefined,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of variants ?? []) {
    if ((v.groupName ?? 'Cookies') !== 'Cookies') continue;
    const id = v.optionId?.trim();
    if (!id) continue;
    const fromField = typeof v.qty === 'number' && Number.isFinite(v.qty) ? Math.floor(v.qty) : 0;
    let qty = fromField;
    if (qty <= 0 && v.optionLabel) {
      const m = /×\s*(\d+)\s*$/u.exec(v.optionLabel);
      qty = m ? Number(m[1]) : 1;
    }
    if (qty <= 0) qty = 1;
    out[id] = (out[id] ?? 0) + qty;
  }
  return out;
}

export function buildKukiBoxLines(input: {
  size: KukiBoxSize;
  qtys: Record<string, number>;
  labels: Record<string, string>;
  pack: KukiPackChoice;
  allowedIds?: readonly string[];
  /** Admin catalog overrides — defaults to collab flyer prices. */
  boxPrice?: number;
  packSinglePrice?: number;
  packBigPrice?: number;
}): { box: KukiBoxCommitLine; packaging?: KukiBoxCommitLine } {
  const allowed = input.allowedIds ?? KUKIDO_COOKIE_IDS;
  const check = validateKukiBoxFill(input.size, input.qtys, allowed);
  if (!check.ok) {
    throw new Error(check.error ?? `Fill exactly ${input.size} cookies`);
  }

  const boxOpt = kukiBoxOption(input.size);
  const boxPrice =
    input.boxPrice != null && Number.isFinite(input.boxPrice) && input.boxPrice > 0
      ? Number(input.boxPrice)
      : boxOpt.price;
  const variants = buildKukiBoxMerchVariants(input.qtys, input.labels);
  const box: KukiBoxCommitLine = {
    productId: boxOpt.productId,
    productNameSnapshot: `Kuki Box - ${input.size} pcs`,
    unitPrice: boxPrice,
    lineTotal: boxPrice,
    qty: 1,
    image: '/kukido/collab-plate.webp',
    selectedVariants: variants,
  };

  const singlePrice =
    input.packSinglePrice != null && Number.isFinite(input.packSinglePrice)
      ? Number(input.packSinglePrice)
      : KUKI_PACK_SINGLE_PRICE;
  const bigPrice =
    input.packBigPrice != null && Number.isFinite(input.packBigPrice)
      ? Number(input.packBigPrice)
      : KUKI_PACK_BIG_PRICE;

  if (input.pack === 'single') {
    return {
      box,
      packaging: {
        productId: KUKI_PACK_SINGLE_ID,
        productNameSnapshot: 'Single cookie box packaging',
        unitPrice: singlePrice,
        lineTotal: singlePrice,
        qty: 1,
        image: '/kukido/collab-plate.webp',
      },
    };
  }
  if (input.pack === 'big') {
    return {
      box,
      packaging: {
        productId: KUKI_PACK_BIG_ID,
        productNameSnapshot: 'Big box packaging',
        unitPrice: bigPrice,
        lineTotal: bigPrice,
        qty: 1,
        image: '/kukido/collab-plate.webp',
      },
    };
  }
  return { box };
}
