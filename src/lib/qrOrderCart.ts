import type { OrderItem, Product } from '../types/domain';
import type { QrCartPayload } from '../components/qr/QrProductSheet';
import { computeOrderTotals } from './money';
import { newId } from './id';
import { resolvePosUnitPrice } from './posPricing';
import { discountedBasePrice, productDiscountAmount } from './productPricing';

export type QrCartLine = QrCartPayload & { key: string };

function customizationKey(customizations: QrCartPayload['customizations']): string {
  return JSON.stringify(
    (customizations ?? [])
      .map((c) => `${c.groupName}:${c.optionId ?? ''}:${c.optionLabel}:${c.qty ?? ''}:${c.priceDelta}`)
      .sort(),
  );
}

export function qrLinesMatch(a: QrCartPayload, b: QrCartPayload): boolean {
  return (
    a.productId === b.productId &&
    a.milkId === b.milkId &&
    a.temperature === b.temperature &&
    a.sizeId === b.sizeId &&
    customizationKey(a.customizations) === customizationKey(b.customizations)
  );
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

    const { unit, milkLabel, sizeLabel } = resolvePosUnitPrice(p, {
      milkId: line.milkId,
      sizeId: line.sizeId,
      customizations: line.customizations ?? [],
    });
    const saleBase = discountedBasePrice(p);
    const itemDiscount = productDiscountAmount(p) * line.qty;
    const lineTotal = unit * line.qty;
    subtotal += saleBase * line.qty;
    modifiers += (unit - saleBase) * line.qty;

    lines.push({
      id: newId(),
      productId: p.id,
      productNameSnapshot: line.productNameSnapshot ?? p.name,
      itemType: 'coffee',
      milkId: line.milkId,
      milkLabelSnapshot: milkLabel ?? line.milkLabel,
      sizeId: line.sizeId,
      sizeLabelSnapshot: sizeLabel ?? line.sizeLabel,
      temperature: line.temperature,
      merchVariants: line.customizations?.length ? line.customizations : undefined,
      originalUnitPrice: unit + productDiscountAmount(p),
      itemDiscountTotal: itemDiscount > 0 ? itemDiscount : undefined,
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
