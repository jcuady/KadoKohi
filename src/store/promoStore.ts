import { create } from 'zustand';
import type { PromoCode, PromoCodeType } from '../types/domain';
import { promoRepo } from '../lib/supabase/repositories/promo';
import { newId } from '../lib/id';
import { useAuthStore } from './authStore';

export interface PromoValidationResult {
  ok: boolean;
  code?: PromoCode;
  discount: number;
  reason?: string;
}

export interface PromoCartLine {
  itemType?: string;
  unitPrice: number;
  qty: number;
}

export interface PromoStore {
  /** Admin: all promo codes, sorted newest-first */
  codes: PromoCode[];
  loading: boolean;
  hydrateError: string | null;
  /** Admin: load / refresh all codes from DB */
  fetchAll: () => Promise<void>;
  /** Admin: create a new code */
  createCode: (input: Omit<PromoCode, 'id' | 'uses' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  /** Admin: update existing code */
  updateCode: (id: string, patch: Partial<Omit<PromoCode, 'id' | 'uses' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  /** Admin: toggle active/inactive */
  toggleCode: (id: string) => Promise<void>;
  /** Admin: permanently delete a code */
  removeCode: (id: string) => Promise<void>;
  /**
   * Customer: validate a promo code against the current cart.
   * Checks DB for validity + usage limits + per-customer cap.
   */
  validateCode: (
    codeStr: string,
    cartSubtotal: number,
    branchId?: string,
    cartLines?: PromoCartLine[],
  ) => Promise<PromoValidationResult>;
  /** Called when an order is placed with a promo code applied. */
  recordClaim: (input: {
    promoCodeId: string;
    orderId: string;
    discountAmount: number;
    customerId?: string | null;
  }) => Promise<void>;
}

export function computePromoDiscount(code: PromoCode, cartSubtotal: number, cartLines?: { itemType?: string; unitPrice: number; qty: number }[]): number {
  if (code.type === 'percent') {
    return Math.min(Math.floor((cartSubtotal * code.value) / 100), cartSubtotal);
  }
  if (code.type === 'fixed') {
    return Math.min(code.value, cartSubtotal);
  }
  if (code.type === 'free_drink') {
    const drinks = (cartLines ?? []).filter((l) => l.itemType !== 'merch');
    if (drinks.length === 0) return 0;
    const cheapest = Math.min(...drinks.map((l) => l.unitPrice));
    return Math.min(cheapest, cartSubtotal);
  }
  if (code.type === 'bogo_drink') {
    const drinks = (cartLines ?? []).filter((l) => l.itemType !== 'merch').sort((a, b) => a.unitPrice - b.unitPrice);
    if (drinks.length < 2) return 0;
    // Cheapest drink of the pair is free
    return Math.min(drinks[0].unitPrice, cartSubtotal);
  }
  return 0;
}

export const usePromoStore = create<PromoStore>()((set, get) => ({
  codes: [],
  loading: false,
  hydrateError: null,

  fetchAll: async () => {
    set({ loading: true, hydrateError: null });
    try {
      const codes = await promoRepo.fetchAll();
      set({ codes, loading: false, hydrateError: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load promo codes.';
      set({ loading: false, hydrateError: message });
      throw err;
    }
  },

  createCode: async (input) => {
    const code: Omit<PromoCode, 'uses' | 'createdAt' | 'updatedAt'> = {
      id: newId(),
      code: input.code.toUpperCase().trim(),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      type: input.type,
      value: input.value,
      minOrderAmount: input.minOrderAmount,
      maxUses: input.maxUses,
      perCustomer: input.perCustomer,
      active: input.active,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      branchId: input.branchId,
    };
    const adminId = useAuthStore.getState().user?.id;
    await promoRepo.upsert({ ...code, createdBy: adminId });
    await get().fetchAll();
  },

  updateCode: async (id, patch) => {
    const existing = get().codes.find((c) => c.id === id);
    if (!existing) return;
    const adminId = useAuthStore.getState().user?.id;
    await promoRepo.upsert({
      ...existing,
      ...patch,
      id,
      code: (patch.code ?? existing.code).toUpperCase().trim(),
      createdBy: adminId,
    });
    await get().fetchAll();
  },

  toggleCode: async (id) => {
    const existing = get().codes.find((c) => c.id === id);
    if (!existing) return;
    const adminId = useAuthStore.getState().user?.id;
    await promoRepo.upsert({ ...existing, active: !existing.active, createdBy: adminId });
    set({ codes: get().codes.map((c) => (c.id === id ? { ...c, active: !c.active } : c)) });
  },

  removeCode: async (id) => {
    await promoRepo.remove(id);
    set({ codes: get().codes.filter((c) => c.id !== id) });
  },

  validateCode: async (codeStr, cartSubtotal, branchId, cartLines) => {
    const trimmed = codeStr.trim().toUpperCase();
    if (!trimmed) return { ok: false, discount: 0, reason: 'Enter a promo code.' };

    const code = await promoRepo.fetchByCode(trimmed);
    if (!code) return { ok: false, discount: 0, reason: 'Code not found or not active.' };

    const now = Date.now();
    if (code.startsAt && new Date(code.startsAt).getTime() > now) {
      return { ok: false, discount: 0, reason: 'This code is not yet valid.' };
    }
    if (code.expiresAt && new Date(code.expiresAt).getTime() < now) {
      return { ok: false, discount: 0, reason: 'This code has expired.' };
    }
    if (code.maxUses != null && code.uses >= code.maxUses) {
      return { ok: false, discount: 0, reason: 'This code has reached its usage limit.' };
    }
    if (cartSubtotal < code.minOrderAmount) {
      return {
        ok: false,
        discount: 0,
        reason: `Minimum order of ₱${code.minOrderAmount.toFixed(0)} required for this code.`,
      };
    }
    if (branchId && code.branchId && code.branchId !== branchId) {
      return { ok: false, discount: 0, reason: 'This code is not valid for the selected branch.' };
    }

    // Per-customer cap check
    const user = useAuthStore.getState().user;
    if (user && code.perCustomer > 0) {
      const used = await promoRepo.customerUsageCount(code.id, user.id);
      if (used >= code.perCustomer) {
        return { ok: false, discount: 0, reason: `You've already used this code the maximum number of times.` };
      }
    }

    const discount = computePromoDiscount(code, cartSubtotal, cartLines);
    if (discount <= 0) {
      return { ok: false, discount: 0, reason: 'This code cannot be applied to your cart.' };
    }

    return { ok: true, code, discount };
  },

  recordClaim: async ({ promoCodeId, orderId, discountAmount, customerId }) => {
    const user = useAuthStore.getState().user;
    await promoRepo.recordClaim({
      promoCodeId,
      orderId,
      discountAmount,
      customerId: customerId ?? user?.id ?? null,
    });
    // Optimistically update the local counter
    set({
      codes: get().codes.map((c) =>
        c.id === promoCodeId ? { ...c, uses: c.uses + 1 } : c,
      ),
    });
  },
}));
