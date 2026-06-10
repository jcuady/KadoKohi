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
  /** GCash QR image URL (Supabase Storage public URL or legacy data URL). */
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
  contactAddress: 'J.P. Laurel St. Corner Mt. Everest, Sta. Elena, Marikina City',
  contactHours: 'Mon – Sun: 7 AM – 11 PM',
  mapsEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.6!2d121.1!3d14.65!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDM5JzAwLjAiTiAxMjHCsDA2JzAwLjAiRQ!5e0!3m2!1sen!2sph!4v1234567890',
  socialInstagram: 'https://www.instagram.com/kadocoffeeph/?hl=en',
  socialFacebook: 'https://www.facebook.com/KadoKohi',
  socialTiktok: 'https://www.tiktok.com/@kadokohiph',
};

export interface SettingsStore {
  settings: AppSettings;
  hydrateFromRemote: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  toggleDashTheme: () => Promise<void>;
  seed: () => void;
}

/** App settings from Supabase; no localStorage cache (GCash QR etc. must stay current). */
export const useSettingsStore = create<SettingsStore>()((set, get) => ({
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
      updateSettings: async (patch) => {
        const settings = { ...get().settings, ...patch };
        await orderingRepo.upsertSettings(settings);
        set({ settings });
      },
      toggleDashTheme: async () => {
        const settings = {
          ...get().settings,
          brandMode: (get().settings.brandMode === 'light' ? 'dark' : 'light') as DashTheme,
        };
        await orderingRepo.upsertSettings(settings);
        set({ settings });
      },
      seed: () => set({ settings: DEFAULTS }),
}));
