import { create } from 'zustand';
import type { LoyaltyVoucher } from '../types/domain';
import { useAuthStore } from './authStore';
import { loyaltyRepo } from '../lib/supabase/repositories/loyalty';
import { orderingRepo } from '../lib/supabase/repositories/ordering';

export interface VoucherStore {
  vouchers: LoyaltyVoucher[];
  loading: boolean;
  hydrateForCustomer: (customerId: string) => Promise<void>;
  claimReward: (
    customerId: string,
    rewardId: string,
  ) => Promise<{ ok: true; voucher: LoyaltyVoucher } | { ok: false; error: string }>;
  redeemVoucher: (voucherId: string, orderId: string) => void;
  activeVouchersForCustomer: (customerId: string, branchId?: string) => LoyaltyVoucher[];
}

export const useVoucherStore = create<VoucherStore>()((set, get) => ({
  vouchers: [],
  loading: false,

  hydrateForCustomer: async (customerId) => {
    set({ loading: true });
    try {
      const vouchers = await loyaltyRepo.fetchVouchersForCustomer(customerId);
      set({ vouchers });
    } catch {
      set({ vouchers: [] });
    } finally {
      set({ loading: false });
    }
  },

  claimReward: async (customerId, rewardId) => {
    const session = useAuthStore.getState().user;
    if (!session || session.role !== 'customer' || session.id !== customerId) {
      return { ok: false, error: 'Sign in as the same customer to claim rewards.' };
    }

    try {
      const voucher = await loyaltyRepo.claimReward(rewardId);
      const profile = await orderingRepo.fetchUserById(customerId);
      if (profile) {
        useAuthStore.setState({ user: { ...session, loyaltyStamps: profile.loyaltyStamps } });
      }
      set({ vouchers: [voucher, ...get().vouchers.filter((v) => v.id !== voucher.id)] });
      return { ok: true, voucher };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not claim reward.';
      return { ok: false, error: message };
    }
  },

  redeemVoucher: (voucherId, orderId) => {
    const now = new Date().toISOString();
    set({
      vouchers: get().vouchers.map((v) =>
        v.id === voucherId && v.status === 'active'
          ? { ...v, status: 'redeemed' as const, redeemedAt: now, redeemedOrderId: orderId }
          : v,
      ),
    });
  },

  activeVouchersForCustomer: (customerId, branchId) => {
    const t = Date.now();
    return get().vouchers.filter((v) => {
      if (v.customerId !== customerId || v.status !== 'active') return false;
      if (v.expiresAt && new Date(v.expiresAt).getTime() < t) return false;
      if (branchId && v.branchId && v.branchId !== branchId) return false;
      return true;
    });
  },
}));
