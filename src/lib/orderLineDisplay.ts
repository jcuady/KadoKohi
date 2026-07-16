import type { OrderItem } from '../types/domain';

/** Display row after merging identical catalog configurations. */
export type ConsolidatedOrderLine = {
  key: string;
  qty: number;
  name: string;
  detail?: string;
  lineTotal: number;
};

function variantsKey(
  variants: OrderItem['merchVariants'] | undefined,
): string {
  return JSON.stringify(
    (variants ?? [])
      .map((v) => `${v.groupName}:${v.optionLabel}:${v.priceDelta}`)
      .sort(),
  );
}

/** Identity for merge — same drink/config collapses to one counted line. */
export function orderItemMergeKey(item: OrderItem): string {
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

function lineDetail(item: OrderItem): string | undefined {
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
  items: OrderItem[],
): ConsolidatedOrderLine[] {
  const map = new Map<string, ConsolidatedOrderLine>();
  for (const item of items) {
    const key = orderItemMergeKey(item);
    const prev = map.get(key);
    if (prev) {
      prev.qty += item.qty;
      prev.lineTotal += item.lineTotal;
      continue;
    }
    map.set(key, {
      key,
      qty: item.qty,
      name: item.productNameSnapshot,
      detail: lineDetail(item),
      lineTotal: item.lineTotal,
    });
  }
  return [...map.values()];
}
