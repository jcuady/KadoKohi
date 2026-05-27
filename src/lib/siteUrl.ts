/** Production site (Vercel). Used for QR payloads when not running in a browser. */
export const PRODUCTION_SITE_URL = 'https://kado-kohi.vercel.app';

/** Canonical origin for shareable links and QR encoding. */
export function getSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
  if (fromEnv?.trim()) return fromEnv.trim().replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return PRODUCTION_SITE_URL;
}
