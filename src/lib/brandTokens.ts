/**
 * Canonical Kado Kohi brand tokens — see BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md
 */
export const BRAND = {
  cream: '#F1DFBA',
  red: '#9E181D',
  dark: '#191919',
  offwhite: '#FAF9F6',
  muted: '#5C5348',
} as const;

/** Primary display + secondary body stacks (web-loaded fonts). */
export const FONT_HEADLINE =
  '"Zalando Sans Expanded", "M PLUS 1", ui-sans-serif, system-ui, sans-serif';
export const FONT_BODY = '"M PLUS 1", ui-sans-serif, system-ui, sans-serif';
export const FONT_MONO = 'ui-monospace, "Cascadia Mono", Consolas, monospace';

export const LOGO = {
  wordmark: '/logo/Logo1.png',
  hybridMark: '/logo/Logo2.png',
} as const;

/** High-res export width — download & print use the same asset. */
export const QR_CARD_EXPORT_WIDTH = 1400;
