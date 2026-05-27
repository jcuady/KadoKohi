/**
 * QR payload builder and URL helpers.
 * QR images encode full HTTPS URLs so scans work on Vercel and locally.
 */
import { getQrScanOrigin } from './siteUrl';

/** Canonical URL for a specific dine-in table QR (production-safe when developing locally). */
export function tableQrUrl(tableCode: string): string {
  return `${getQrScanOrigin()}/order/qr/${encodeURIComponent(tableCode)}`;
}

/** Canonical URL for a branch-wide takeout QR. */
export function takeoutQrUrl(branchSlug: string): string {
  return `${getQrScanOrigin()}/order/takeout?b=${encodeURIComponent(branchSlug)}`;
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

/** @deprecated Use downloadBrandedQrCard from brandedQrCard.ts for print-ready assets. */
export async function downloadQrPng(scanUrl: string, filename: string, size = 512): Promise<void> {
  const { downloadBrandedQrCard } = await import('./brandedQrCard');
  await downloadBrandedQrCard({ title: 'Kado Kohi', scanUrl }, filename);
}

/** Short human-readable code derived from the branch slug + table label, e.g. 'mrk-t03'. */
export function buildTableCode(branchSlug: string, tableNumber: number): string {
  const prefix = branchSlug.slice(0, 3).toLowerCase();
  return `${prefix}-t${String(tableNumber).padStart(2, '0')}`;
}
