import type { Product } from '../types/domain';

export type ProductDiscountType = 'fixed' | 'percent';

export function discountedBasePrice(product: Pick<Product, 'basePrice' | 'discountType' | 'discountValue'>): number {
  const base = Math.max(0, product.basePrice);
  const value = product.discountValue ?? 0;

  if (product.discountType === 'percent' && value > 0 && value < 100) {
    return Math.round(base * (1 - value / 100) * 100) / 100;
  }
  if (product.discountType === 'fixed' && value > 0 && value < base) {
    return Math.round((base - value) * 100) / 100;
  }
  return base;
}

export function productDiscountAmount(product: Pick<Product, 'basePrice' | 'discountType' | 'discountValue'>): number {
  return Math.round((product.basePrice - discountedBasePrice(product)) * 100) / 100;
}

export function hasProductDiscount(product: Pick<Product, 'basePrice' | 'discountType' | 'discountValue'>): boolean {
  return productDiscountAmount(product) > 0;
}

export function productPromoTag(product: Pick<Product, 'basePrice' | 'discountType' | 'discountValue'>): string | null {
  if (!hasProductDiscount(product)) return null;
  return product.discountType === 'percent'
    ? `${product.discountValue}% off`
    : `₱${product.discountValue} off`;
}

export function originalUnitPrice(
  product: Pick<Product, 'basePrice' | 'discountType' | 'discountValue'>,
  discountedUnitPrice: number,
): number {
  return Math.round((discountedUnitPrice + productDiscountAmount(product)) * 100) / 100;
}
