import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DashTheme = 'light' | 'dark';

export interface AppSettings {
  taxRate: number;
  defaultOpenTime: string;
  defaultCloseTime: string;
  brandMode: DashTheme;
  shopName: string;
  currency: string;
}

const DEFAULTS: AppSettings = {
  taxRate: 0,
  defaultOpenTime: '07:00',
  defaultCloseTime: '23:00',
  brandMode: 'light',
  shopName: 'Kado Kohi',
  currency: 'PHP',
};

export interface SettingsStore {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  toggleDashTheme: () => void;
  seed: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULTS,
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      toggleDashTheme: () =>
        set((s) => ({
          settings: {
            ...s.settings,
            brandMode: s.settings.brandMode === 'light' ? 'dark' : 'light',
          },
        })),
      seed: () => set({ settings: DEFAULTS }),
    }),
    { name: 'kado-settings-v1' },
  ),
);
