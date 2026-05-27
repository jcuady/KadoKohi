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
  /** GCash QR image for customer payments (URL or data URL). */
  gcashQrImage: string;
  /** Phone number for booth booking inquiries (click-to-call). */
  boothContactPhone: string;
  boothContactName?: string;
}

const DEFAULTS: AppSettings = {
  taxRate: 0,
  defaultOpenTime: '07:00',
  defaultCloseTime: '23:00',
  brandMode: 'light',
  shopName: 'Kado Kohi',
  currency: 'PHP',
  gcashQrImage: '',
  boothContactPhone: '+63 917 123 4567',
  boothContactName: 'Kado Kohi Events',
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
    {
      name: 'kado-settings-v2',
      merge: (persisted, current) => {
        const p = persisted as SettingsStore | undefined;
        return {
          ...current,
          settings: {
            ...DEFAULTS,
            ...current.settings,
            ...(p?.settings ?? {}),
            gcashQrImage: p?.settings?.gcashQrImage ?? current.settings.gcashQrImage ?? '',
            boothContactPhone:
              p?.settings?.boothContactPhone ?? current.settings.boothContactPhone ?? DEFAULTS.boothContactPhone,
            boothContactName:
              p?.settings?.boothContactName ?? current.settings.boothContactName ?? DEFAULTS.boothContactName,
          },
        };
      },
    },
  ),
);
