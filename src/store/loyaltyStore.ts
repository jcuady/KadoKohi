import { create } from 'zustand';
import type { LoyaltyConfig, LoyaltyReward } from '../types/domain';
import { SEED_LOYALTY_CONFIG } from '../data/seed';
import { newId } from '../lib/id';
import { loyaltyRepo } from '../lib/supabase/repositories/loyalty';

export interface LoyaltyStore {
  config: LoyaltyConfig;
  loading: boolean;
  hydrateFromRemote: () => Promise<void>;
  addReward: (reward: Omit<LoyaltyReward, 'id'>) => Promise<void>;
  updateReward: (id: string, patch: Partial<LoyaltyReward>) => Promise<void>;
  removeReward: (id: string) => Promise<void>;
  toggleReward: (id: string) => Promise<void>;
}

export const useLoyaltyStore = create<LoyaltyStore>()((set, get) => ({
  config: SEED_LOYALTY_CONFIG,
  loading: false,

  hydrateFromRemote: async () => {
    set({ loading: true });
    try {
      const rewards = await loyaltyRepo.fetchRewards();
      if (rewards.length > 0) {
        set({ config: { rewards } });
      }
    } catch {
      // keep defaults
    } finally {
      set({ loading: false });
    }
  },

  addReward: async (input) => {
    const reward: LoyaltyReward = { ...input, id: newId() };
    await loyaltyRepo.upsertReward(reward);
    set((s) => ({ config: { rewards: [...s.config.rewards, reward] } }));
  },

  updateReward: async (id, patch) => {
    const existing = get().config.rewards.find((r) => r.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch };
    await loyaltyRepo.upsertReward(updated);
    set((s) => ({
      config: {
        rewards: s.config.rewards.map((r) => (r.id === id ? updated : r)),
      },
    }));
  },

  removeReward: async (id) => {
    await loyaltyRepo.removeReward(id);
    set((s) => ({
      config: { rewards: s.config.rewards.filter((r) => r.id !== id) },
    }));
  },

  toggleReward: async (id) => {
    const existing = get().config.rewards.find((r) => r.id === id);
    if (!existing) return;
    await get().updateReward(id, { active: !existing.active });
  },
}));
