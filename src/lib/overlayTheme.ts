/**
 * Shared modal / sheet tokens — match ProductDetailDrawer (brand product sheet).
 * See BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md + UIUXPro modal rules.
 */

/** Scrim only (for motion.div backdrops that sit behind a separate panel). */
export const OVERLAY_SCRIM =
  'bg-kado-dark/55 backdrop-blur-[3px]';

/** Full-screen flex host + scrim (centered / bottom sheet hosts). */
export const OVERLAY_HOST =
  `fixed inset-0 flex items-end justify-center sm:items-center p-0 sm:p-4 ${OVERLAY_SCRIM}`;

/** Centered host (no bottom-sheet slide on mobile). */
export const OVERLAY_HOST_CENTER =
  `fixed inset-0 flex items-center justify-center p-4 ${OVERLAY_SCRIM}`;

/** Customer white sheet — product / pay / register. */
export const OVERLAY_PANEL =
  'w-full max-h-[min(92dvh,720px)] flex flex-col rounded-t-[2.5rem] sm:rounded-[2rem] bg-white border border-kado-dark/10 sm:border-kado-red/10 shadow-[0_30px_60px_rgba(158,24,29,0.15)] overflow-hidden';

export const OVERLAY_PANEL_MD = `${OVERLAY_PANEL} max-w-md`;
export const OVERLAY_PANEL_LG = `${OVERLAY_PANEL} max-w-lg`;
export const OVERLAY_PANEL_XL = `${OVERLAY_PANEL} max-w-xl`;

/** Admin / ops surface — same geometry, dash tokens. */
export const OVERLAY_PANEL_DASH =
  'w-full max-h-[min(92dvh,720px)] flex flex-col rounded-t-[2.5rem] sm:rounded-[2rem] dash-card border shadow-[0_30px_60px_rgba(158,24,29,0.12)] overflow-hidden';

export const OVERLAY_PANEL_DASH_MD = `${OVERLAY_PANEL_DASH} max-w-md`;
export const OVERLAY_PANEL_DASH_LG = `${OVERLAY_PANEL_DASH} max-w-lg`;
export const OVERLAY_PANEL_DASH_XL = `${OVERLAY_PANEL_DASH} max-w-xl`;

export const OVERLAY_CLOSE =
  'w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-kado-dark/50 hover:bg-kado-dark/8 hover:text-kado-dark touch-manipulation transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red/40';

export const OVERLAY_HEADER =
  'flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-kado-dark/10 shrink-0';

export const OVERLAY_FOOTER =
  'shrink-0 border-t border-kado-dark/5 px-5 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gray-50/50 backdrop-blur-md';

/** Primary modal CTA — pill + brand red shadow (product sheet ADD). */
export const OVERLAY_CTA =
  'inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full bg-kado-red px-5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-kado-red/30 hover:bg-kado-red-hover hover:shadow-kado-red/40 transition-colors touch-manipulation disabled:opacity-50 disabled:pointer-events-none';

export const OVERLAY_CTA_SECONDARY =
  'inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full border-2 border-kado-dark/12 bg-white px-5 text-xs font-black uppercase tracking-widest text-kado-dark/70 hover:border-kado-red/40 hover:text-kado-red transition-colors touch-manipulation';

export const OVERLAY_CTA_DARK =
  'inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full bg-kado-dark px-5 text-xs font-black uppercase tracking-widest text-kado-cream hover:bg-kado-red transition-colors touch-manipulation disabled:opacity-50';

export const OPTION_CHIP_BASE =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red/40';

export const OPTION_CHIP_ACTIVE =
  `${OPTION_CHIP_BASE} bg-kado-red text-white border-kado-red shadow-md shadow-kado-red/20`;

export const OPTION_CHIP_IDLE =
  `${OPTION_CHIP_BASE} bg-white border-kado-dark/10 text-kado-dark/65 hover:border-kado-red/50 hover:text-kado-red`;

export function optionChipClass(active: boolean): string {
  return active ? OPTION_CHIP_ACTIVE : OPTION_CHIP_IDLE;
}
