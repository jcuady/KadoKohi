import { cn } from './utils';

/** Brand type scale — see BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md */
export const CMS_TEXT_SIZES = [
  { id: 'inherit', label: 'Section default', className: '' },
  { id: 'h1', label: 'Heading 1 (36pt)', className: 'kado-h1' },
  { id: 'h1-hero', label: 'Display hero', className: 'kado-h1 kado-h1-hero' },
  { id: 'h2', label: 'Heading 2 (30pt)', className: 'kado-h2' },
  { id: 'h3', label: 'Heading 3 (24pt)', className: 'kado-h3' },
  { id: 'body', label: 'Body (14pt)', className: 'kado-body' },
  { id: 'body-sm', label: 'Body small (12pt)', className: 'kado-body-sm' },
  { id: 'subtext', label: 'Subtext (10pt)', className: 'kado-subtext' },
  { id: 'label', label: 'Label / eyebrow', className: 'kado-label' },
] as const;

/** Core brand palette — #F1DFBA, #9E181D, #191919, #FAF9F6 */
export const CMS_TEXT_COLORS = [
  { id: 'inherit', label: 'Section default', className: '', swatch: 'transparent' },
  { id: 'cream', label: 'Primary cream', className: 'text-kado-cream', swatch: '#F1DFBA' },
  { id: 'red', label: 'Primary red', className: 'text-kado-red', swatch: '#9E181D' },
  { id: 'dark', label: 'Near black', className: 'text-kado-dark', swatch: '#191919' },
  { id: 'offwhite', label: 'Off white', className: 'text-kado-offwhite', swatch: '#FAF9F6' },
  { id: 'cream-muted', label: 'Cream muted', className: 'text-kado-cream/85', swatch: '#F1DFBA' },
  { id: 'dark-muted', label: 'Dark muted', className: 'text-kado-dark/70', swatch: '#191919' },
  { id: 'red-muted', label: 'Red muted', className: 'text-kado-red/80', swatch: '#9E181D' },
] as const;

export type CmsTextSize = (typeof CMS_TEXT_SIZES)[number]['id'];
export type CmsTextColor = (typeof CMS_TEXT_COLORS)[number]['id'];

export interface CmsStyledText {
  text: string;
  size?: CmsTextSize;
  color?: CmsTextColor;
}

/** Plain string or styled object. Legacy CMS JSON uses plain strings. */
export type CmsText = string | CmsStyledText;

const SIZE_IDS = new Set<CmsTextSize>(CMS_TEXT_SIZES.map((s) => s.id));
const COLOR_IDS = new Set<CmsTextColor>(CMS_TEXT_COLORS.map((c) => c.id));

export function cmsTextPlain(value: CmsText | undefined | null): string {
  if (value == null) return '';
  return typeof value === 'string' ? value : value.text;
}

function coerceSize(raw: unknown): CmsTextSize | undefined {
  return typeof raw === 'string' && SIZE_IDS.has(raw as CmsTextSize) && raw !== 'inherit'
    ? (raw as CmsTextSize)
    : undefined;
}

function coerceColor(raw: unknown): CmsTextColor | undefined {
  return typeof raw === 'string' && COLOR_IDS.has(raw as CmsTextColor) && raw !== 'inherit'
    ? (raw as CmsTextColor)
    : undefined;
}

/** Normalize persisted or draft CMS values; keeps plain strings when no style is set. */
export function normalizeCmsText(raw: unknown, fallback: CmsText): CmsText {
  const fallbackText = cmsTextPlain(fallback).trim() || cmsTextPlain(fallback);
  if (typeof raw === 'string') {
    const text = raw.trim() || fallbackText;
    return text;
  }
  if (raw && typeof raw === 'object' && 'text' in raw) {
    const styled = raw as Partial<CmsStyledText>;
    const text = typeof styled.text === 'string' ? styled.text.trim() || fallbackText : fallbackText;
    const size = coerceSize(styled.size);
    const color = coerceColor(styled.color);
    if (!size && !color) return text;
    return { text, ...(size ? { size } : {}), ...(color ? { color } : {}) };
  }
  return fallback;
}

export function patchCmsText(value: CmsText, patch: { text?: string; size?: CmsTextSize; color?: CmsTextColor }): CmsText {
  const text = (patch.text ?? cmsTextPlain(value)).trim();
  const prev = typeof value === 'object' ? value : undefined;
  const size = patch.size ?? prev?.size;
  const color = patch.color ?? prev?.color;
  if (!size && !color) return text || cmsTextPlain(value);
  return {
    text: text || cmsTextPlain(value),
    ...(size && size !== 'inherit' ? { size } : {}),
    ...(color && color !== 'inherit' ? { color } : {}),
  };
}

export function cmsTextSize(value: CmsText): CmsTextSize {
  return typeof value === 'object' && value.size ? value.size : 'inherit';
}

export function cmsTextColor(value: CmsText): CmsTextColor {
  return typeof value === 'object' && value.color ? value.color : 'inherit';
}

export function resolveCmsTextClasses(
  value: CmsText,
  defaults?: { sizeClass?: string; colorClass?: string },
): string {
  const sizeId = cmsTextSize(value);
  const colorId = cmsTextColor(value);
  const sizeClass =
    sizeId !== 'inherit'
      ? (CMS_TEXT_SIZES.find((s) => s.id === sizeId)?.className ?? '')
      : (defaults?.sizeClass ?? '');
  const colorClass =
    colorId !== 'inherit'
      ? (CMS_TEXT_COLORS.find((c) => c.id === colorId)?.className ?? '')
      : (defaults?.colorClass ?? '');
  return cn(sizeClass, colorClass);
}

export function clampCmsTextField(raw: unknown, fallback: CmsText): CmsText {
  return normalizeCmsText(raw, fallback);
}
