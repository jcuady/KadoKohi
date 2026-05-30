import { create } from 'zustand';
import { orderingRepo } from '../lib/supabase/repositories/ordering';

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
  /** Public contact page & footer */
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactHours: string;
  mapsEmbedUrl: string;
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
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
  contactEmail: 'kadocoffeeph@gmail.com',
  contactPhone: '+63 920 948 2934',
  contactAddress: 'J.P. Laurel St. Corner Mt. Everest, Marikina',
  contactHours: 'Mon – Sun: 7 AM – 11 PM',
  mapsEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.6!2d121.1!3d14.65!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDM5JzAwLjAiTiAxMjHCsDA2JzAwLjAiRQ!5e0!3m2!1sen!2sph!4v1234567890',
  socialInstagram: '',
  socialFacebook: '',
  socialTiktok: '',
};

export interface SettingsStore {
  settings: AppSettings;
  hydrateFromRemote: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => void;
  toggleDashTheme: () => void;
  seed: () => void;
}

/** App settings from Supabase; no localStorage cache (GCash QR etc. must stay current). */
export const useSettingsStore = create<SettingsStore>()((set) => ({
      settings: DEFAULTS,
      hydrateFromRemote: async () => {
        try {
          const remote = await orderingRepo.fetchSettings();
          if (!remote) return;
          set({ settings: { ...DEFAULTS, ...remote } });
        } catch {
          // Keep defaults when remote fetch fails.
        }
      },
      updateSettings: (patch) =>
        set((s) => {
          const settings = { ...s.settings, ...patch };
          void orderingRepo.upsertSettings(settings);
          return { settings };
        }),
      toggleDashTheme: () =>
        set((s) => {
          const settings = {
            ...s.settings,
            brandMode: (s.settings.brandMode === 'light' ? 'dark' : 'light') as DashTheme,
          };
          void orderingRepo.upsertSettings(settings);
          return { settings };
        }),
      seed: () => set({ settings: DEFAULTS }),
}));
