/** Production site (Vercel custom domain). Used for QR payloads when not running in a browser. */
export const PRODUCTION_SITE_URL = 'https://www.kadokohi.com';

/** Canonical origin for shareable links and QR encoding. */
export function getSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
  if (fromEnv?.trim()) return fromEnv.trim().replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return PRODUCTION_SITE_URL;
}

function isLocalDevHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
}

/**
 * Origin encoded inside table/takeout QR codes.
 * On local dev, defaults to production so printed QRs work for customers.
 */
export function getQrScanOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
  if (fromEnv?.trim()) return fromEnv.trim().replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location?.hostname) {
    if (isLocalDevHost(window.location.hostname)) return PRODUCTION_SITE_URL;
    return window.location.origin;
  }

  return PRODUCTION_SITE_URL;
}

/** Rewrite any scan URL to the canonical QR origin (path preserved). */
export function canonicalScanUrl(url: string): string {
  try {
    const parsed = new URL(url, getQrScanOrigin());
    return `${getQrScanOrigin()}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

/** Display-friendly URL without protocol. */
export function scanUrlForDisplay(url: string): string {
  return canonicalScanUrl(url).replace(/^https?:\/\//, '');
}
