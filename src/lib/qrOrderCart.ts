import type { OrderItem, Product } from '../types/domain';
import type { QrCartPayload } from '../components/qr/QrProductSheet';
import { computeOrderTotals } from './money';
import { newId } from './id';
import { resolveMilkLabel, resolveMilkPriceDelta } from './menuProductModifiers';

export type QrCartLine = QrCartPayload & { key: string };

function resolveUnit(product: Product, milkId?: string): { unit: number; milkLabel?: string } {
  return {
    unit: product.basePrice + resolveMilkPriceDelta(product, milkId),
    milkLabel: resolveMilkLabel(product, milkId),
  };
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

export function qrCartIsStale(
  cart: { productId: string }[],
  lines: OrderItem[],
): boolean {
  if (cart.length === 0) return false;
  return lines.length !== cart.length || lines.length === 0;
}
