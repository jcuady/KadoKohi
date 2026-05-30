import type { AppSettings, DashTheme } from '../store/settingsStore';

/** JSON blob stored in `kk_app_settings.order_hours` (site + hours config). */
export type SiteConfigJson = {
  defaultOpenTime?: string;
  defaultCloseTime?: string;
  brandMode?: DashTheme;
  shopName?: string;
  currency?: string;
  boothContactPhone?: string;
  boothContactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactHours?: string;
  mapsEmbedUrl?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialTiktok?: string;
};

export function siteConfigFromSettings(settings: AppSettings): SiteConfigJson {
  return {
    defaultOpenTime: settings.defaultOpenTime,
    defaultCloseTime: settings.defaultCloseTime,
    brandMode: settings.brandMode,
    shopName: settings.shopName,
    currency: settings.currency,
    boothContactPhone: settings.boothContactPhone,
    boothContactName: settings.boothContactName,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    contactAddress: settings.contactAddress,
    contactHours: settings.contactHours,
    mapsEmbedUrl: settings.mapsEmbedUrl,
    socialInstagram: settings.socialInstagram,
    socialFacebook: settings.socialFacebook,
    socialTiktok: settings.socialTiktok,
  };
}

export function settingsFromDbRow(row: {
  tax_rate?: number | string | null;
  gcash_qr_image?: string | null;
  order_hours?: SiteConfigJson | null;
}): Partial<AppSettings> {
  const site = (row.order_hours ?? {}) as SiteConfigJson;
  return {
    taxRate: Number(row.tax_rate ?? 0),
    gcashQrImage: row.gcash_qr_image ?? '',
    defaultOpenTime: site.defaultOpenTime,
    defaultCloseTime: site.defaultCloseTime,
    brandMode: site.brandMode,
    shopName: site.shopName,
    currency: site.currency,
    boothContactPhone: site.boothContactPhone,
    boothContactName: site.boothContactName,
    contactEmail: site.contactEmail,
    contactPhone: site.contactPhone,
    contactAddress: site.contactAddress,
    contactHours: site.contactHours,
    mapsEmbedUrl: site.mapsEmbedUrl,
    socialInstagram: site.socialInstagram,
    socialFacebook: site.socialFacebook,
    socialTiktok: site.socialTiktok,
  };
}
