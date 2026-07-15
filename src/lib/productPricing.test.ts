import { describe, expect, it } from 'vitest';
import {
  discountedBasePrice,
  hasProductDiscount,
  originalUnitPrice,
  productDiscountAmount,
  productPromoTag,
} from './productPricing';

describe('productPricing', () => {
  it('applies percentage discounts to the base price only', () => {
    const product = { basePrice: 175, discountType: 'percent' as const, discountValue: 20 };
    expect(discountedBasePrice(product)).toBe(140);
    expect(productDiscountAmount(product)).toBe(35);
    expect(originalUnitPrice(product, 170)).toBe(205);
    expect(productPromoTag(product)).toBe('20% off');
  });

  it('applies fixed discounts and ignores invalid configurations', () => {
    expect(discountedBasePrice({ basePrice: 180, discountType: 'fixed', discountValue: 30 })).toBe(150);
    expect(productPromoTag({ basePrice: 180, discountType: 'fixed', discountValue: 30 })).toBe('₱30 off');
    expect(hasProductDiscount({ basePrice: 180, discountType: 'fixed', discountValue: 180 })).toBe(false);
    expect(hasProductDiscount({ basePrice: 180, discountType: 'percent', discountValue: 100 })).toBe(false);
  });
});
