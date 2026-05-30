import { create } from 'zustand';
import type { LoyaltyVoucher, PromoCode } from '../types/domain';

interface CheckoutStore {
  // Loyalty voucher (stamp-based)
  selectedVoucherId: string | null;
  setSelectedVoucherId: (id: string | null) => void;
  clearVoucher: () => void;
  // Promo code (admin-created, customer types at checkout)
  appliedPromoCode: PromoCode | null;
  promoDiscount: number;
  setAppliedPromoCode: (code: PromoCode | null, discount: number) => void;
  clearPromoCode: () => void;
  /** Clear both discounts (called after order is placed). */
  clearAll: () => void;
}

export const useCheckoutStore = create<CheckoutStore>()((set) => ({
  selectedVoucherId: null,
  setSelectedVoucherId: (id) => set({ selectedVoucherId: id, appliedPromoCode: null, promoDiscount: 0 }),
  clearVoucher: () => set({ selectedVoucherId: null }),

  appliedPromoCode: null,
  promoDiscount: 0,
  setAppliedPromoCode: (code, discount) =>
    set({ appliedPromoCode: code, promoDiscount: discount, selectedVoucherId: null }),
  clearPromoCode: () => set({ appliedPromoCode: null, promoDiscount: 0 }),

  clearAll: () =>
    set({ selectedVoucherId: null, appliedPromoCode: null, promoDiscount: 0 }),
}));

export function findSelectedVoucher(
  vouchers: LoyaltyVoucher[],
  selectedId: string | null,
): LoyaltyVoucher | null {
  if (!selectedId) return null;
  return vouchers.find((v) => v.id === selectedId) ?? null;
}
