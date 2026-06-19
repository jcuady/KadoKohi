import { cn } from './utils';

/** Brand type scale — see BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md */
export const CMS_FONT_FAMILIES = [
  { id: 'inherit', label: 'Section default', className: '' },
  { id: 'display', label: 'Zalando Sans (Display)', className: 'font-display' },
  { id: 'body', label: 'M PLUS 1 (Body)', className: 'font-sans' },
] as const;

export type CmsFontFamily = (typeof CMS_FONT_FAMILIES)[number]['id'];

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
  font?: CmsFontFamily;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

/** Plain string or styled object. Legacy CMS JSON uses plain strings. */
export type CmsText = string | CmsStyledText;

/** Normalize nbsp and corrupted entity strings to regular spaces for CMS storage/editing. */
export function normalizeCmsPlainText(text: string): string {
  if (!text) return text;
  return text
    .replace(/\u00A0/g, ' ')
    .replace(/&amp;nbsp;/gi, ' ')
    .replace(/&nbsp;/gi, ' ');
}

const SIZE_IDS = new Set<CmsTextSize>(CMS_TEXT_SIZES.map((s) => s.id));
const COLOR_IDS = new Set<CmsTextColor>(CMS_TEXT_COLORS.map((c) => c.id));

const FONT_IDS = new Set<CmsFontFamily>(CMS_FONT_FAMILIES.map((f) => f.id));

export function cmsTextPlain(value: CmsText | undefined | null): string {
  if (value == null) return '';
  const raw = typeof value === 'string' ? value : value.text;
  if (!/<[a-z][\s\S]*>/i.test(raw)) return normalizeCmsPlainText(raw);
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  return normalizeCmsPlainText(doc.body.textContent ?? '');
}

/** Raw stored text (may include brand-safe inline HTML). */
export function cmsTextRaw(value: CmsText | undefined | null): string {
  if (value == null) return '';
  return typeof value === 'string' ? value : value.text;
}

function coerceSize(raw: unknown): CmsTextSize | undefined {
  return typeof raw === 'string' && SIZE_IDS.has(raw as CmsTextSize) && raw !== 'inherit'
    ? (raw as CmsTextSize)
    : undefined;
}

function coerceFont(raw: unknown): CmsFontFamily | undefined {
  return typeof raw === 'string' && FONT_IDS.has(raw as CmsFontFamily) && raw !== 'inherit'
    ? (raw as CmsFontFamily)
    : undefined;
}

function coerceColor(raw: unknown): CmsTextColor | undefined {
  return typeof raw === 'string' && COLOR_IDS.has(raw as CmsTextColor) && raw !== 'inherit'
    ? (raw as CmsTextColor)
    : undefined;
}

/** Normalize persisted or draft CMS values; keeps plain strings when no style is set. */
export function normalizeCmsText(raw: unknown, fallback: CmsText): CmsText {
  const fallbackText = cmsTextPlain(fallback);
  if (typeof raw === 'string') {
    const text = normalizeCmsPlainText(raw);
    return text.length > 0 ? text : fallbackText;
  }
  if (raw && typeof raw === 'object' && 'text' in raw) {
    const styled = raw as Partial<CmsStyledText>;
    const text =
      typeof styled.text === 'string'
        ? normalizeCmsPlainText(styled.text)
        : fallbackText;
    const resolvedText = text.length > 0 ? text : fallbackText;
    const size = coerceSize(styled.size);
    const color = coerceColor(styled.color);
    const font = coerceFont(styled.font);
    const bold = styled.bold === true ? true : undefined;
    const italic = styled.italic === true ? true : undefined;
    const underline = styled.underline === true ? true : undefined;
    if (!size && !color && !font && !bold && !italic && !underline) return resolvedText;
    return {
      text: resolvedText,
      ...(size ? { size } : {}),
      ...(color ? { color } : {}),
      ...(font ? { font } : {}),
      ...(bold ? { bold } : {}),
      ...(italic ? { italic } : {}),
      ...(underline ? { underline } : {}),
    };
  }
  return fallback;
}

export function patchCmsText(
  value: CmsText,
  patch: {
    text?: string;
    size?: CmsTextSize;
    color?: CmsTextColor;
    font?: CmsFontFamily;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  },
): CmsText {
  const text = normalizeCmsPlainText(patch.text ?? cmsTextRaw(value));
  const prev = typeof value === 'object' ? value : undefined;
  const size = patch.size ?? prev?.size;
  const color = patch.color ?? prev?.color;
  const font = patch.font ?? prev?.font;
  const bold = 'bold' in patch ? patch.bold : prev?.bold;
  const italic = 'italic' in patch ? patch.italic : prev?.italic;
  const underline = 'underline' in patch ? patch.underline : prev?.underline;
  if (!size && !color && !font && !bold && !italic && !underline) return text || cmsTextRaw(value);
  return {
    text: text || cmsTextRaw(value),
    ...(size && size !== 'inherit' ? { size } : {}),
    ...(color && color !== 'inherit' ? { color } : {}),
    ...(font && font !== 'inherit' ? { font } : {}),
    ...(bold ? { bold: true } : {}),
    ...(italic ? { italic: true } : {}),
    ...(underline ? { underline: true } : {}),
  };
}

export function cmsTextSize(value: CmsText): CmsTextSize {
  return typeof value === 'object' && value.size ? value.size : 'inherit';
}

export function cmsTextColor(value: CmsText): CmsTextColor {
  return typeof value === 'object' && value.color ? value.color : 'inherit';
}

export function cmsTextMarks(value: CmsText): { bold: boolean; italic: boolean; underline: boolean } {
  if (typeof value !== 'object') return { bold: false, italic: false, underline: false };
  return {
    bold: value.bold === true,
    italic: value.italic === true,
    underline: value.underline === true,
  };
}

export function cmsTextFont(value: CmsText): CmsFontFamily {
  return typeof value === 'object' && value.font ? value.font : 'inherit';
}

export function resolveCmsTextClasses(
  value: CmsText,
  defaults?: { sizeClass?: string; colorClass?: string },
): string {
  const sizeId = cmsTextSize(value);
  const colorId = cmsTextColor(value);
  const fontId = cmsTextFont(value);
  const marks = cmsTextMarks(value);
  const sizeClass =
    sizeId !== 'inherit'
      ? (CMS_TEXT_SIZES.find((s) => s.id === sizeId)?.className ?? '')
      : (defaults?.sizeClass ?? '');
  const colorClass =
    colorId !== 'inherit'
      ? (CMS_TEXT_COLORS.find((c) => c.id === colorId)?.className ?? '')
      : (defaults?.colorClass ?? '');
  const fontClass =
    fontId !== 'inherit' ? (CMS_FONT_FAMILIES.find((f) => f.id === fontId)?.className ?? '') : '';
  return cn(
    sizeClass,
    colorClass,
    fontClass,
    marks.bold && 'font-bold',
    marks.italic && 'italic',
    marks.underline && 'underline',
  );
}

export function clampCmsTextField(raw: unknown, fallback: CmsText): CmsText {
  return normalizeCmsText(raw, fallback);
}
