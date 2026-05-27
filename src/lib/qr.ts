/**
 * QR payload builder and URL helpers.
 * QR images encode full HTTPS URLs so scans work on Vercel and locally.
 */
import { getSiteOrigin } from './siteUrl';

/** Canonical URL for a specific dine-in table QR. */
export function tableQrUrl(tableCode: string): string {
  return `${getSiteOrigin()}/order/qr/${encodeURIComponent(tableCode)}`;
}

/** Canonical URL for a branch-wide takeout QR. */
export function takeoutQrUrl(branchSlug: string): string {
  return `${getSiteOrigin()}/order/takeout?b=${encodeURIComponent(branchSlug)}`;
}

/** Relative path (for display in admin UI). */
export function tableQrPath(tableCode: string): string {
  return `/order/qr/${tableCode}`;
}

export function takeoutQrPath(branchSlug: string): string {
  return `/order/takeout?b=${branchSlug}`;
}

/**
 * QuickChart QR image — encodes the full URL customers scan.
 */
export function qrImageUrl(payload: string, size = 200): string {
  const encoded = encodeURIComponent(payload);
  return `https://quickchart.io/qr?text=${encoded}&size=${size}&margin=2&dark=191919&light=FAF9F6`;
}

/** Download QR PNG for printing (fetches from QuickChart). */
export async function downloadQrPng(scanUrl: string, filename: string, size = 512): Promise<void> {
  const src = qrImageUrl(scanUrl, size);
  const res = await fetch(src);
  if (!res.ok) throw new Error('Could not generate QR image');
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Short human-readable code derived from the branch slug + table label, e.g. 'mrk-t03'. */
export function buildTableCode(branchSlug: string, tableNumber: number): string {
  const prefix = branchSlug.slice(0, 3).toLowerCase();
  return `${prefix}-t${String(tableNumber).padStart(2, '0')}`;
}
