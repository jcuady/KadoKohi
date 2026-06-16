import type { OrderItem, Product } from '../types/domain';
import type { QrCartPayload } from '../components/qr/QrProductSheet';
import { computeOrderTotals } from './money';
import { newId } from './id';
import { resolveMilkLabel, resolveMilkPriceDelta } from './menuProductModifiers';
import {
  mixMatchSelectionLabel,
  mixMatchUnitPrice,
  resolveMixMatchMode,
} from './mixMatchOrder';
import { isMixMatchCookie } from './pastriesCategory';

export type QrCartLine = QrCartPayload & { key: string };

function resolveUnit(
  product: Product,
  milkId?: string,
  mixMatchCookie?: Product,
): { unit: number; milkLabel?: string; name: string; itemType: OrderItem['itemType'] } {
  if (mixMatchCookie) {
    const mode = resolveMixMatchMode(product, mixMatchCookie);
    if (mode === 'bundle') {
      return {
        unit: mixMatchUnitPrice(mode, product, mixMatchCookie, milkId),
        milkLabel: resolveMilkLabel(product, milkId),
        name: mixMatchSelectionLabel(mode, product, mixMatchCookie),
        itemType: 'mix-match',
      };
    }
  }

  const unit = product.basePrice + resolveMilkPriceDelta(product, milkId);
  return {
    unit,
    milkLabel: resolveMilkLabel(product, milkId),
    name: product.name,
    itemType: isMixMatchCookie(product) ? 'coffee' : 'coffee',
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

    const cookie = line.mixMatchCookieId
      ? products.find((x) => x.id === line.mixMatchCookieId)
      : undefined;

    const { unit, milkLabel, name, itemType } = resolveUnit(p, line.milkId, cookie);
    const lineTotal = unit * line.qty;

    if (cookie && itemType === 'mix-match') {
      subtotal += (p.basePrice + cookie.basePrice) * line.qty;
      modifiers += lineTotal - (p.basePrice + cookie.basePrice) * line.qty;
    } else {
      subtotal += p.basePrice * line.qty;
      modifiers += (unit - p.basePrice) * line.qty;
    }

    lines.push({
      id: newId(),
      productId: p.id,
      productNameSnapshot: line.productNameSnapshot ?? name,
      itemType,
      mixMatchCookieId: line.mixMatchCookieId,
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
  cart: { productId: string; mixMatchCookieId?: string }[],
  lines: OrderItem[],
): boolean {
  if (cart.length === 0) return false;
  return lines.length !== cart.length || lines.length === 0;
}
