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
  await downloadBrandedQrCard({ layout: 'table', title: 'Kado Kohi', scanUrl }, filename);
}

/** Short human-readable code derived from the branch slug + table label, e.g. 'mar-t03'. */
export function buildTableCode(branchSlug: string, tableNumber: number): string {
  const prefix = branchSlug.slice(0, 3).toLowerCase();
  return `${prefix}-t${String(tableNumber).padStart(2, '0')}`;
}

function normalizeSlugForCode(slug: string): string {
  return slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/** Candidate codes in preference order — kk_tables.code is globally unique. */
export function tableCodeCandidates(branchSlug: string, tableNumber: number): string[] {
  const n = String(tableNumber).padStart(2, '0');
  const full = normalizeSlugForCode(branchSlug);
  const short = full.slice(0, 3);
  const out: string[] = [];
  const push = (code: string) => {
    if (code && !out.includes(code)) out.push(code);
  };
  push(`${short}-t${n}`);
  if (full.length > 3) push(`${full}-t${n}`);
  if (full.length > 6) push(`${full.slice(0, 6)}-t${n}`);
  return out;
}

/** Pick the first unused table code (avoids collisions when slugs share a 3-char prefix). */
export function pickUniqueTableCode(
  branchSlug: string,
  tableNumber: number,
  usedCodes: Iterable<string>,
): string {
  const used = new Set([...usedCodes].map((c) => c.trim().toLowerCase()));
  for (const candidate of tableCodeCandidates(branchSlug, tableNumber)) {
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
  throw new Error(
    `Could not allocate a unique table code for "${branchSlug}". Try a different branch slug.`,
  );
}
