/** Production site (Vercel custom domain). Used for QR payloads when not running in a browser. */
export const PRODUCTION_SITE_URL = 'https://www.kadokohi.com';

function stripTrailingSlash(url: string): string {
  return url.trim().replace(/\/$/, '');
}

function isLocalDevHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
}

/** kadokohi.com and www.kadokohi.com both resolve to the live site on Vercel. */
function isKadokohiProductionHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'kadokohi.com' || host === 'www.kadokohi.com';
}

/** Normalize env/browser origins to the canonical www production URL for QR encoding. */
export function normalizeQrScanOrigin(origin: string): string {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    if (isKadokohiProductionHost(host) || host.endsWith('.kadokohi.com')) {
      return PRODUCTION_SITE_URL;
    }
  } catch {
    // fall through
  }
  return stripTrailingSlash(origin);
}

/** Canonical origin for shareable links and QR encoding. */
export function getSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
  if (fromEnv?.trim()) return normalizeQrScanOrigin(fromEnv);
  if (typeof window !== 'undefined' && window.location?.hostname) {
    if (isLocalDevHost(window.location.hostname)) return PRODUCTION_SITE_URL;
    if (isKadokohiProductionHost(window.location.hostname)) return PRODUCTION_SITE_URL;
    return stripTrailingSlash(window.location.origin);
  }
  return PRODUCTION_SITE_URL;
}

/**
 * Origin encoded inside table/takeout QR codes.
 * On local dev, defaults to production www so printed QRs work for customers.
 */
export function getQrScanOrigin(): string {
  return getSiteOrigin();
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
