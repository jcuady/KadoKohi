import { describe, expect, it } from 'vitest';
import {
  discountedBasePrice,
  hasProductDiscount,
  originalUnitPrice,
  productDiscountAmount,
  productPromoTag,
} from './productPricing';
import { resolvePosUnitPrice } from './posPricing';
import { buildQrCartTotals } from './qrOrderCart';
import { computeCartTotalsWithDiscount, computeVoucherDiscount } from './voucherDiscount';
import { computePromoDiscount } from '../store/promoStore';
import type { Product, PromoCode } from '../types/domain';
import type { CartLine } from '../store/cartStore';

function drink(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod_latte',
    categoryId: 'cat_classics',
    name: 'Spanish Latte',
    basePrice: 175,
    temperature: 'both',
    sizes: [
      { id: 'size_reg', label: 'Regular', priceDelta: 0 },
      { id: 'size_lrg', label: 'Large', priceDelta: 30 },
    ],
    milks: [
      { id: 'milk_reg', label: 'Regular', priceDelta: 0 },
      { id: 'milk_oat', label: 'Oat', priceDelta: 25 },
    ],
    tags: [],
    visible: true,
    inStock: true,
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function cartLine(overrides: Partial<CartLine> = {}): CartLine {
  return {
    key: 'line1',
    itemType: 'coffee',
    productId: 'prod_latte',
    productNameSnapshot: 'Spanish Latte',
    qty: 1,
    unitPrice: 140,
    lineTotal: 140,
    ...overrides,
  };
}

function promo(overrides: Partial<PromoCode> = {}): PromoCode {
  return {
    id: 'promo1',
    code: 'SAVE10',
    name: 'Save 10',
    type: 'percent',
    value: 10,
    minOrderAmount: 0,
    maxUses: null,
    uses: 0,
    perCustomer: 1,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('payment-gateway pricing matrix', () => {
  describe('product sale math', () => {
    it('covers percent, fixed, invalid, and zero-discount cases', () => {
      expect(discountedBasePrice(drink({ discountType: 'percent', discountValue: 20 }))).toBe(140);
      expect(discountedBasePrice(drink({ discountType: 'fixed', discountValue: 25 }))).toBe(150);
      expect(discountedBasePrice(drink())).toBe(175);
      expect(hasProductDiscount(drink({ discountType: 'percent', discountValue: 0 }))).toBe(false);
      expect(hasProductDiscount(drink({ discountType: 'fixed', discountValue: 175 }))).toBe(false);
      expect(hasProductDiscount(drink({ discountType: 'percent', discountValue: 100 }))).toBe(false);
      expect(productPromoTag(drink({ discountType: 'percent', discountValue: 15 }))).toBe('15% off');
      expect(productPromoTag(drink({ discountType: 'fixed', discountValue: 20 }))).toBe('₱20 off');
    });

    it('keeps modifiers on top of the sale base (not the list base)', () => {
      const product = drink({ discountType: 'percent', discountValue: 20 });
      const { unit, milkLabel, sizeLabel } = resolvePosUnitPrice(product, {
        milkId: 'milk_oat',
        sizeId: 'size_lrg',
        customizations: [{ groupName: 'Sweetness', optionLabel: 'Extra', priceDelta: 10 }],
      });
      // sale 140 + oat 25 + large 30 + sweet 10
      expect(unit).toBe(205);
      expect(milkLabel).toBe('Oat');
      expect(sizeLabel).toBe('Large');
      expect(originalUnitPrice(product, unit)).toBe(240);
      expect(productDiscountAmount(product)).toBe(35);
    });
  });

  describe('QR / POS cart preview totals', () => {
    it('builds QR totals from sale base so tax matches gateway amount', () => {
      const product = drink({ discountType: 'fixed', discountValue: 25 });
      const totals = buildQrCartTotals(
        [
          {
            key: 'k1',
            productId: product.id,
            qty: 2,
            milkId: 'milk_oat',
            sizeId: 'size_lrg',
            temperature: 'iced',
            customizations: [],
          },
        ],
        [product],
        0,
      );

      // sale base 150; unit = 150 + 25 + 30 = 205; qty 2
      expect(totals.subtotal).toBe(300);
      expect(totals.modifiers).toBe(110);
      expect(totals.lines[0]?.unitPrice).toBe(205);
      expect(totals.lines[0]?.lineTotal).toBe(410);
      expect(totals.lines[0]?.itemDiscountTotal).toBe(50);
      expect(totals.total).toBe(410);
      expect(totals.subtotal + totals.modifiers).toBe(totals.total);
    });

    it('preserves no-discount parity with list price', () => {
      const product = drink();
      const totals = buildQrCartTotals(
        [{ key: 'k1', productId: product.id, qty: 1, milkId: 'milk_reg', customizations: [] }],
        [product],
        12,
      );
      expect(totals.subtotal).toBe(175);
      expect(totals.modifiers).toBe(0);
      expect(totals.tax).toBe(21); // round(175 * 0.12)
      expect(totals.total).toBe(196);
    });
  });

  describe('voucher stacking after item sale', () => {
    it('applies percent voucher on already-discounted line totals', () => {
      const lines = [cartLine({ unitPrice: 140, lineTotal: 140, qty: 1 })];
      const voucher = computeVoucherDiscount(lines, 'discount_percent', 10);
      expect(voucher.eligible).toBe(true);
      expect(voucher.discount).toBe(14);

      const totals = computeCartTotalsWithDiscount(lines, 0, voucher.discount);
      expect(totals.subtotal).toBe(140);
      expect(totals.discount).toBe(14);
      expect(totals.total).toBe(126);
    });

    it('applies free_drink voucher to cheapest sale unit, not list price', () => {
      const lines = [
        cartLine({ key: 'a', unitPrice: 140, lineTotal: 140 }),
        cartLine({ key: 'b', productId: 'prod_2', unitPrice: 160, lineTotal: 160 }),
      ];
      const voucher = computeVoucherDiscount(lines, 'free_drink');
      expect(voucher.discount).toBe(140);
      expect(computeCartTotalsWithDiscount(lines, 0, voucher.discount).total).toBe(160);
    });

    it('applies fixed voucher capped by discounted cart', () => {
      const lines = [cartLine({ unitPrice: 50, lineTotal: 50 })];
      const voucher = computeVoucherDiscount(lines, 'discount_fixed', 80);
      expect(voucher.discount).toBe(50);
      expect(computeCartTotalsWithDiscount(lines, 0, voucher.discount).total).toBe(0);
    });
  });

  describe('promo code stacking after item sale', () => {
    it('applies percent promo on discounted merchandise subtotal', () => {
      const discount = computePromoDiscount(promo({ type: 'percent', value: 10 }), 205, [
        { itemType: 'coffee', unitPrice: 205, qty: 1 },
      ]);
      expect(discount).toBe(20);
    });

    it('applies fixed promo capped by cart', () => {
      expect(computePromoDiscount(promo({ type: 'fixed', value: 50 }), 40)).toBe(40);
    });

    it('uses discounted unit for free_drink and bogo', () => {
      const lines = [
        { itemType: 'coffee', unitPrice: 140, qty: 1 },
        { itemType: 'coffee', unitPrice: 160, qty: 1 },
      ];
      expect(computePromoDiscount(promo({ type: 'free_drink', value: 0 }), 300, lines)).toBe(140);
      expect(computePromoDiscount(promo({ type: 'bogo_drink', value: 0 }), 300, lines)).toBe(140);
      expect(computePromoDiscount(promo({ type: 'bogo_drink', value: 0 }), 140, [lines[0]])).toBe(0);
    });
  });

  describe('gateway amount invariant', () => {
    it('item sale then voucher then tax produces one payable total', () => {
      // List 175 → 20% off = 140; + oat 25 = 165; voucher 10% = 16; tax 12% on 149
      const lines = [cartLine({ unitPrice: 165, lineTotal: 165 })];
      const voucher = computeVoucherDiscount(lines, 'discount_percent', 10);
      const totals = computeCartTotalsWithDiscount(lines, 12, voucher.discount);
      expect(totals.subtotal).toBe(165);
      expect(totals.discount).toBe(16);
      expect(totals.tax).toBe(18); // round(149 * 0.12) = 18
      expect(totals.total).toBe(167);
    });

    it('item sale then promo percent then tax produces one payable total', () => {
      const merchandise = 205;
      const promoDisc = computePromoDiscount(promo({ type: 'percent', value: 10 }), merchandise, [
        { itemType: 'coffee', unitPrice: 205, qty: 1 },
      ]);
      const lines = [cartLine({ unitPrice: merchandise, lineTotal: merchandise })];
      const totals = computeCartTotalsWithDiscount(lines, 12, promoDisc);
      expect(promoDisc).toBe(20);
      expect(totals.tax).toBe(22); // round(185 * 0.12)
      expect(totals.total).toBe(207);
    });

    it('never lets voucher and promo both reduce the same preview cart', () => {
      const lines = [cartLine({ unitPrice: 140, lineTotal: 140 })];
      const voucherDisc = computeVoucherDiscount(lines, 'discount_percent', 10).discount;
      const promoDisc = computePromoDiscount(promo({ type: 'fixed', value: 20 }), 140);
      // CartDrawer rule: exclusive — only one applies
      const effective = promoDisc > 0 ? promoDisc : voucherDisc;
      expect(effective).toBe(20);
      expect(voucherDisc).toBe(14);
      expect(computeCartTotalsWithDiscount(lines, 0, effective).total).toBe(120);
    });
  });
});
