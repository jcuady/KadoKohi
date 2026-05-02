import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoyaltyConfig, LoyaltyReward } from '../types/domain';
import { SEED_LOYALTY_CONFIG } from '../data/seed';
import { newId } from '../lib/id';

export interface LoyaltyStore {
  config: LoyaltyConfig;
  updateConfig: (patch: Partial<Omit<LoyaltyConfig, 'rewards'>>) => void;
  addReward: (reward: Omit<LoyaltyReward, 'id'>) => void;
  updateReward: (id: string, patch: Partial<LoyaltyReward>) => void;
  removeReward: (id: string) => void;
  toggleReward: (id: string) => void;
  seed: () => void;
}

export const useLoyaltyStore = create<LoyaltyStore>()(
  persist(
    (set, get) => ({
      config: SEED_LOYALTY_CONFIG,

      updateConfig: (patch) =>
        set((s) => ({ config: { ...s.config, ...patch } })),

      addReward: (input) => {
        const reward: LoyaltyReward = { ...input, id: newId() };
        set((s) => ({ config: { ...s.config, rewards: [...s.config.rewards, reward] } }));
      },

      updateReward: (id, patch) =>
        set((s) => ({
          config: {
            ...s.config,
            rewards: s.config.rewards.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          },
        })),

      removeReward: (id) =>
        set((s) => ({
          config: { ...s.config, rewards: s.config.rewards.filter((r) => r.id !== id) },
        })),

      toggleReward: (id) =>
        set((s) => ({
          config: {
            ...s.config,
            rewards: s.config.rewards.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
          },
        })),

      seed: () => set({ config: SEED_LOYALTY_CONFIG }),
    }),
    { name: 'kado-loyalty-v1' },
  ),
);
