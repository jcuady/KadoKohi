/** Shared option-chip styles for QR dine-in / takeout (light + prefers-color-scheme: dark). */

export const QR_CHIP_BASE =
  'relative min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-bold border-2 touch-manipulation transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qr-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--qr-sheet-bg)]';

/** Milk and generic selections — filled brand red when active. */
export function qrChipClass(active: boolean, tone: 'default' | 'hot' | 'iced' = 'default'): string {
  if (!active) return `${QR_CHIP_BASE} qr-chip-idle`;
  if (tone === 'hot') return `${QR_CHIP_BASE} qr-chip-active-hot`;
  if (tone === 'iced') return `${QR_CHIP_BASE} qr-chip-active-iced`;
  return `${QR_CHIP_BASE} qr-chip-active`;
}

/** Category / filter pills on the menu header. */
export const QR_PILL_BASE =
  'shrink-0 min-h-[40px] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border-2 touch-manipulation transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--qr-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--qr-bg)]';

export function qrPillClass(active: boolean): string {
  return active ? `${QR_PILL_BASE} qr-pill-active` : `${QR_PILL_BASE} qr-pill-idle`;
}
