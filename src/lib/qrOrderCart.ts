import type { OrderItem, Product } from '../types/domain';
import type { QrCartPayload } from '../components/qr/QrProductSheet';
import { computeOrderTotals } from './money';
import { newId } from './id';

export type QrCartLine = QrCartPayload & { key: string };

function resolveUnit(product: Product, milkId?: string): { unit: number; milkLabel?: string } {
  let unit = product.basePrice;
  let milkLabel: string | undefined;
  if (milkId && product.milks?.length) {
    const m = product.milks.find((x) => x.id === milkId);
    if (m) {
      unit += m.priceDelta;
      milkLabel = m.label;
    }
  }
  return { unit, milkLabel };
}

export function buildQrCartTotals(
  cart: QrCartLine[],
  products: Product[],
  taxRate: number,
) {
  let subtotal = 0;
  let modifiers = 0;
  const lines: OrderItem[] = [];

  for (const line of cart) {
    const p = products.find((x) => x.id === line.productId);
    if (!p) continue;
    const { unit, milkLabel } = resolveUnit(p, line.milkId);
    const lineTotal = unit * line.qty;
    subtotal += p.basePrice * line.qty;
    modifiers += (unit - p.basePrice) * line.qty;
    lines.push({
      id: newId(),
      productId: p.id,
      productNameSnapshot: p.name,
      itemType: 'coffee',
      milkId: line.milkId,
      milkLabelSnapshot: milkLabel ?? line.milkLabel,
      temperature: line.temperature,
      unitPrice: unit,
      qty: line.qty,
      lineTotal,
    });
  }

  const { tax, total } = computeOrderTotals(subtotal, modifiers, taxRate);
  return { lines, subtotal, modifiers, tax, total };
}

export function qrCartIsStale(cart: QrCartLine[], lines: OrderItem[]): boolean {
  if (cart.length === 0) return false;
  return lines.length !== cart.length || lines.length === 0;
}
