import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoyaltyVoucher } from '../types/domain';
import { newId } from '../lib/id';
import { useLoyaltyStore } from './loyaltyStore';
import { useAuthStore } from './authStore';

function voucherCode(): string {
  return `KK-VCH-${Math.floor(1000 + Math.random() * 9000)}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export interface VoucherStore {
  vouchers: LoyaltyVoucher[];
  claimReward: (
    customerId: string,
    rewardId: string,
  ) => { ok: true; voucher: LoyaltyVoucher } | { ok: false; error: string };
  redeemVoucher: (voucherId: string, orderId: string) => void;
  activeVouchersForCustomer: (customerId: string) => LoyaltyVoucher[];
  seed: () => void;
}

export const useVoucherStore = create<VoucherStore>()(
  persist(
    (set, get) => ({
      vouchers: [],

      claimReward: (customerId, rewardId) => {
        const reward = useLoyaltyStore.getState().config.rewards.find((r) => r.id === rewardId && r.active);
        if (!reward) return { ok: false, error: 'That reward is not available.' };

        const session = useAuthStore.getState().user;
        if (!session || session.role !== 'customer' || session.id !== customerId) {
          return { ok: false, error: 'Sign in as the same customer to claim rewards.' };
        }

        const stamps = session.loyaltyStamps ?? 0;
        if (stamps < reward.stampsRequired) {
          return {
            ok: false,
            error: `You need ${reward.stampsRequired} stamps (${stamps} now). Keep ordering drinks!`,
          };
        }

        useAuthStore.getState().spendLoyaltyStamps(reward.stampsRequired);

        const now = new Date().toISOString();
        const voucher: LoyaltyVoucher = {
          id: newId(),
          code: voucherCode(),
          customerId,
          rewardId: reward.id,
          rewardNameSnapshot: reward.name,
          rewardType: reward.type,
          rewardValue: reward.value,
          stampsSpent: reward.stampsRequired,
          status: 'active',
          createdAt: now,
          expiresAt: addDays(now, 90),
        };

        set({ vouchers: [voucher, ...get().vouchers] });
        return { ok: true, voucher };
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

      activeVouchersForCustomer: (customerId) => {
        const t = Date.now();
        return get().vouchers.filter((v) => {
          if (v.customerId !== customerId || v.status !== 'active') return false;
          if (v.expiresAt && new Date(v.expiresAt).getTime() < t) return false;
          return true;
        });
      },

      seed: () => set({ vouchers: [] }),
    }),
    {
      name: 'kado-loyalty-vouchers-v1',
      merge: (persisted, current) => {
        const p = persisted as Partial<VoucherStore> | undefined;
        return {
          ...current,
          ...p,
          vouchers: Array.isArray(p?.vouchers) ? p!.vouchers! : [],
        };
      },
    },
  ),
);
