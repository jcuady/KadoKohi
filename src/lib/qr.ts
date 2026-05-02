/**
 * QR payload builder and URL helpers.
 *
 * Currently generates canonical URL strings for table and takeout QR codes.
 * When deployed, replace BASE_URL with the production domain.
 * To render actual QR images, swap `qrImageUrl()` internals for a real QR library
 * (e.g. `qrcode`, `qr-code-styling`) or a service like quickchart.io.
 */

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://kadokohi.com';

/** Canonical URL for a specific dine-in table QR. */
export function tableQrUrl(tableCode: string): string {
  return `${BASE_URL}/order/qr/${tableCode}`;
}

/** Canonical URL for a branch-wide takeout QR. */
export function takeoutQrUrl(branchSlug: string): string {
  return `${BASE_URL}/order/takeout?b=${branchSlug}`;
}

/**
 * Returns a quickchart.io URL that renders a QR code image for the given payload.
 * Drop-in: use as <img src={qrImageUrl(payload)} />.
 * Swap this implementation for a local library in production.
 */
export function qrImageUrl(payload: string, size = 200): string {
  const encoded = encodeURIComponent(payload);
  return `https://quickchart.io/qr?text=${encoded}&size=${size}&margin=2&dark=191919&light=FAF9F6`;
}

/** Short human-readable code derived from the branch slug + table label, e.g. 'mrk-t03'. */
export function buildTableCode(branchSlug: string, tableNumber: number): string {
  const prefix = branchSlug.slice(0, 3).toLowerCase();
  return `${prefix}-t${String(tableNumber).padStart(2, '0')}`;
}
