import type { LoyaltyRewardType } from '../types/domain';
import type { CartLine } from '../store/cartStore';

export function cartSubtotal(cart: CartLine[]): number {
  return cart.reduce((s, l) => s + l.lineTotal, 0);
}

export function computeVoucherDiscount(
  cart: CartLine[],
  type: LoyaltyRewardType,
  value?: number,
): { discount: number; eligible: boolean; reason?: string } {
  const subtotal = cartSubtotal(cart);
  const coffee = cart.filter((l) => l.itemType === 'coffee');
  const merch = cart.filter((l) => l.itemType === 'merch');

  if (subtotal <= 0) {
    return { discount: 0, eligible: false, reason: 'Your cart is empty.' };
  }

  if (type === 'free_drink') {
    if (coffee.length === 0) {
      return { discount: 0, eligible: false, reason: 'Add at least one drink to use this voucher.' };
    }
    const oneDrink = Math.min(...coffee.map((l) => l.unitPrice));
    return { discount: Math.min(oneDrink, subtotal), eligible: true };
  }

  if (type === 'free_merch') {
    if (merch.length === 0) {
      return { discount: 0, eligible: false, reason: 'Add merch to your cart to use this voucher.' };
    }
    const smallestLine = Math.min(...merch.map((l) => l.lineTotal));
    return { discount: Math.min(smallestLine, subtotal), eligible: true };
  }

  if (type === 'discount_percent' && value != null && value > 0) {
    const discount = Math.floor((subtotal * value) / 100);
    return { discount: Math.min(discount, subtotal), eligible: true };
  }

  if (type === 'discount_fixed' && value != null && value > 0) {
    return { discount: Math.min(value, subtotal), eligible: true };
  }

  if (type === 'custom') {
    const v = value ?? 0;
    if (v <= 0) {
      return { discount: 0, eligible: false, reason: 'This reward has no discount amount set.' };
    }
    return { discount: Math.min(v, subtotal), eligible: true };
  }

  return { discount: 0, eligible: false, reason: 'This reward cannot be applied automatically.' };
}

export function computeCartTotalsWithDiscount(
  cart: CartLine[],
  taxRatePercent: number,
  discount: number,
): { subtotal: number; discount: number; tax: number; total: number } {
  const subtotal = cartSubtotal(cart);
  const disc = Math.min(Math.max(0, discount), subtotal);
  const taxable = Math.max(0, subtotal - disc);
  const tax = taxRatePercent > 0 ? Math.round((taxable * taxRatePercent) / 100) : 0;
  return { subtotal, discount: disc, tax, total: taxable + tax };
}
