import type { Order, Product } from '../types/domain';

export type TrackedOrderLine = {
  id: string;
  productId: string;
  productNameSnapshot: string;
  productImage?: string;
  milkLabelSnapshot?: string;
  sizeLabelSnapshot?: string;
  temperature?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type TrackedOrderSnapshot = {
  items: TrackedOrderLine[];
  subtotal: number;
  modifiersTotal: number;
  tax: number;
  total: number;
};

export function buildTrackedOrderSnapshot(order: Order, products: Product[]): TrackedOrderSnapshot {
  const byId = new Map(products.map((p) => [p.id, p]));
  return {
    items: order.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productNameSnapshot: it.productNameSnapshot,
      productImage: byId.get(it.productId)?.image,
      milkLabelSnapshot: it.milkLabelSnapshot,
      sizeLabelSnapshot: it.sizeLabelSnapshot,
      temperature: it.temperature,
      qty: it.qty,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
    })),
    subtotal: order.subtotal,
    modifiersTotal: order.modifiersTotal,
    tax: order.tax ?? 0,
    total: order.total,
  };
}

export function mapTrackedOrderLineFromRpc(row: Record<string, unknown>): TrackedOrderLine {
  return {
    id: String(row.id ?? ''),
    productId: String(row.product_id ?? ''),
    productNameSnapshot: String(row.product_name_snapshot ?? 'Item'),
    productImage: row.product_image ? String(row.product_image) : undefined,
    milkLabelSnapshot: row.milk_label_snapshot ? String(row.milk_label_snapshot) : undefined,
    sizeLabelSnapshot: row.size_label_snapshot ? String(row.size_label_snapshot) : undefined,
    temperature: row.temperature ? String(row.temperature) : undefined,
    qty: Number(row.qty ?? 1),
    unitPrice: Number(row.unit_price ?? 0),
    lineTotal: Number(row.line_total ?? 0),
  };
}
