import { create } from 'zustand';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { logAudit } from '../lib/audit';
import { KADO_LOCATION, kadoMapsEmbedUrl } from '../content/kadoLocation';

export type DashTheme = 'light' | 'dark';

export type BoothPaymentConfig = {
  gcashEnabled: boolean;
  gcashQrImage?: string;
  bankEnabled: boolean;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankInstructions?: string;
};

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
  boothPayment: BoothPaymentConfig;
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
  boothPayment: {
    gcashEnabled: true,
    bankEnabled: true,
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankInstructions: '',
  },
  contactEmail: 'kadocoffeeph@gmail.com',
  contactPhone: '+63 920 948 2934',
  contactAddress: KADO_LOCATION.displayAddress,
  contactHours: 'Mon – Sun: 7 AM – 11 PM',
  mapsEmbedUrl: kadoMapsEmbedUrl(),
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
let persistChain: Promise<void> = Promise.resolve();

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
        set({ settings: { ...get().settings, ...patch } });
        persistChain = persistChain
          .then(async () => {
            await orderingRepo.upsertSettings(get().settings);
            logAudit({
              action: 'settings.updated',
              entityType: 'settings',
              entityId: 'app',
              summary: 'App settings updated',
              metadata: { changedKeys: Object.keys(patch) },
            });
          })
          .catch((err) => {
            throw err;
          });
        await persistChain;
      },
      toggleDashTheme: async () => {
        const brandMode = (get().settings.brandMode === 'light' ? 'dark' : 'light') as DashTheme;
        set({ settings: { ...get().settings, brandMode } });
        persistChain = persistChain
          .then(async () => {
            await orderingRepo.upsertSettings(get().settings);
            logAudit({
              action: 'settings.updated',
              entityType: 'settings',
              entityId: 'app',
              summary: `Dashboard theme → ${brandMode}`,
              metadata: { changedKeys: ['brandMode'] },
            });
          })
          .catch((err) => {
            throw err;
          });
        await persistChain;
      },
      seed: () => set({ settings: DEFAULTS }),
}));
