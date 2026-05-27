import { create } from 'zustand';
import type { LoyaltyVoucher } from '../types/domain';

interface CheckoutStore {
  selectedVoucherId: string | null;
  setSelectedVoucherId: (id: string | null) => void;
  clearVoucher: () => void;
}

export const useCheckoutStore = create<CheckoutStore>()((set) => ({
  selectedVoucherId: null,
  setSelectedVoucherId: (id) => set({ selectedVoucherId: id }),
  clearVoucher: () => set({ selectedVoucherId: null }),
}));

export function findSelectedVoucher(
  vouchers: LoyaltyVoucher[],
  selectedId: string | null,
): LoyaltyVoucher | null {
  if (!selectedId) return null;
  return vouchers.find((v) => v.id === selectedId) ?? null;
}
