import type { OrderItem } from '../types/domain';

/** Display row after merging identical catalog configurations. */
export type ConsolidatedOrderLine = {
  key: string;
  qty: number;
  name: string;
  detail?: string;
  lineTotal: number;
  productImage?: string;
};

/** Minimal line shape — works for OrderItem and TrackedOrderLine. */
export type OrderLineLike = {
  id?: string;
  productId: string;
  productNameSnapshot: string;
  productImage?: string;
  itemType?: string;
  mixMatchCookieId?: string;
  sizeId?: string;
  sizeLabelSnapshot?: string;
  milkId?: string;
  milkLabelSnapshot?: string;
  temperature?: string | null;
  merchVariants?: { groupName: string; optionLabel: string; priceDelta: number }[];
  unitPrice: number;
  qty: number;
  lineTotal: number;
};

function variantsKey(
  variants: OrderLineLike['merchVariants'] | undefined,
): string {
  return JSON.stringify(
    (variants ?? [])
      .map((v) => `${v.groupName}:${v.optionLabel}:${v.priceDelta}`)
      .sort(),
  );
}

/** Identity for merge — same drink/config collapses to one counted line. */
export function orderItemMergeKey(item: OrderLineLike): string {
  return [
    item.productId,
    item.itemType ?? '',
    item.mixMatchCookieId ?? '',
    item.sizeId ?? item.sizeLabelSnapshot ?? '',
    item.milkId ?? item.milkLabelSnapshot ?? '',
    item.temperature ?? '',
    variantsKey(item.merchVariants),
    String(item.unitPrice),
  ].join('|');
}

function lineDetail(item: OrderLineLike): string | undefined {
  const parts = [
    item.sizeLabelSnapshot,
    item.milkLabelSnapshot,
    item.temperature === 'hot' ? 'Hot' : item.temperature === 'iced' ? 'Iced' : undefined,
    ...(item.merchVariants ?? []).map((v) => v.optionLabel),
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
}

/**
 * Collapse duplicate order lines (same product + options) into qty counts.
 * Display-only — does not mutate persisted order rows.
 */
export function consolidateOrderItemsForDisplay(
  items: OrderLineLike[] | OrderItem[],
): ConsolidatedOrderLine[] {
  const map = new Map<string, ConsolidatedOrderLine>();
  for (const item of items) {
    const key = orderItemMergeKey(item);
    const prev = map.get(key);
    if (prev) {
      prev.qty += item.qty;
      prev.lineTotal += item.lineTotal;
      if (!prev.productImage && 'productImage' in item && item.productImage) {
        prev.productImage = item.productImage;
      }
      continue;
    }
    map.set(key, {
      key,
      qty: item.qty,
      name: item.productNameSnapshot,
      detail: lineDetail(item),
      lineTotal: item.lineTotal,
      productImage: 'productImage' in item ? item.productImage : undefined,
    });
  }
  return [...map.values()];
}
