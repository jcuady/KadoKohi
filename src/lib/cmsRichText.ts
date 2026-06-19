import {
  CMS_FONT_FAMILIES,
  CMS_TEXT_COLORS,
  CMS_TEXT_SIZES,
  normalizeCmsPlainText,
  type CmsFontFamily,
  type CmsTextColor,
  type CmsTextSize,
} from './cmsTypography';

const SIZE_STEPS: CmsTextSize[] = ['subtext', 'body-sm', 'body', 'label', 'h3', 'h2', 'h1', 'h1-hero'];

const COLOR_CLASS = new Map(CMS_TEXT_COLORS.map((c) => [c.id, c.className]));
const SIZE_CLASS = new Map(CMS_TEXT_SIZES.map((s) => [s.id, s.className]));
const FONT_CLASS = new Map(CMS_FONT_FAMILIES.map((f) => [f.id, f.className]));

export type InlineFormat = {
  color?: CmsTextColor;
  size?: CmsTextSize;
  font?: CmsFontFamily;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

export function cmsTextHasHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

/** Safe HTML for contentEditable — never double-escapes existing entities like &nbsp;. */
export function plainTextToEditorHtml(text: string): string {
  const raw = normalizeCmsPlainText(text);
  if (cmsTextHasHtml(raw)) return sanitizeCmsHtml(raw);
  if (typeof document === 'undefined') return raw;
  const el = document.createElement('div');
  el.textContent = raw;
  return el.innerHTML;
}

function classesForInline(format: InlineFormat): string {
  const parts: string[] = [];
  if (format.color && format.color !== 'inherit') parts.push(COLOR_CLASS.get(format.color) ?? '');
  if (format.size && format.size !== 'inherit') parts.push(SIZE_CLASS.get(format.size) ?? '');
  if (format.font && format.font !== 'inherit') parts.push(FONT_CLASS.get(format.font) ?? '');
  if (format.bold) parts.push('font-bold');
  if (format.italic) parts.push('italic');
  if (format.underline) parts.push('underline');
  return parts.filter(Boolean).join(' ');
}

function readSpanFormat(el: Element): InlineFormat {
  const format: InlineFormat = {};
  const color = el.getAttribute('data-c');
  if (color && COLOR_CLASS.has(color as CmsTextColor)) format.color = color as CmsTextColor;
  const size = el.getAttribute('data-s');
  if (size && SIZE_CLASS.has(size as CmsTextSize)) format.size = size as CmsTextSize;
  const font = el.getAttribute('data-f');
  if (font && FONT_CLASS.has(font as CmsFontFamily)) format.font = font as CmsFontFamily;
  if (el.getAttribute('data-b') === '1') format.bold = true;
  if (el.getAttribute('data-i') === '1') format.italic = true;
  if (el.getAttribute('data-u') === '1') format.underline = true;
  return format;
}

function writeSpanFormat(span: HTMLSpanElement, format: InlineFormat) {
  span.removeAttribute('data-c');
  span.removeAttribute('data-s');
  span.removeAttribute('data-f');
  span.removeAttribute('data-b');
  span.removeAttribute('data-i');
  span.removeAttribute('data-u');
  if (format.color && format.color !== 'inherit') span.setAttribute('data-c', format.color);
  if (format.size && format.size !== 'inherit') span.setAttribute('data-s', format.size);
  if (format.font && format.font !== 'inherit') span.setAttribute('data-f', format.font);
  if (format.bold) span.setAttribute('data-b', '1');
  if (format.italic) span.setAttribute('data-i', '1');
  if (format.underline) span.setAttribute('data-u', '1');
  const cls = classesForInline(format);
  if (cls) span.className = cls;
  else span.removeAttribute('class');
}

export function allowedSizeStepsForDefault(defaultSizeClass?: string): CmsTextSize[] {
  if (!defaultSizeClass) return [...SIZE_STEPS];
  if (defaultSizeClass.includes('h1-hero')) return ['h1-hero', 'h1', 'h2', 'h3'];
  if (defaultSizeClass.includes('kado-h1')) return ['h1', 'h1-hero', 'h2', 'h3', 'body'];
  if (defaultSizeClass.includes('kado-h2')) return ['h2', 'h3', 'h1', 'body', 'body-sm'];
  if (defaultSizeClass.includes('kado-h3')) return ['h3', 'h2', 'body', 'body-sm'];
  if (defaultSizeClass.includes('kado-label')) return ['label', 'subtext', 'body-sm', 'body'];
  if (defaultSizeClass.includes('kado-body')) return ['body', 'body-sm', 'subtext', 'h3'];
  if (defaultSizeClass.includes('kado-subtext')) return ['subtext', 'body-sm', 'body'];
  return [...SIZE_STEPS];
}

export function clampSizeToRole(size: CmsTextSize, defaultSizeClass?: string): CmsTextSize {
  if (size === 'inherit') return size;
  const allowed = allowedSizeStepsForDefault(defaultSizeClass);
  return allowed.includes(size) ? size : (allowed[Math.floor(allowed.length / 2)] ?? 'body');
}

export function sanitizeCmsHtml(raw: string): string {
  if (!raw || !cmsTextHasHtml(raw)) return raw.trim();
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return normalizeCmsPlainText(node.textContent ?? '')
        .replace(/</g, '')
        .replace(/>/g, '');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (tag === 'br') return '<br>';
    if (tag !== 'span') return Array.from(el.childNodes).map(walk).join('');
    const format = readSpanFormat(el);
    const inner = Array.from(el.childNodes).map(walk).join('');
    if (!inner) return '';
    const cls = classesForInline(format);
    const attrs: string[] = [];
    if (format.color && format.color !== 'inherit') attrs.push(`data-c="${format.color}"`);
    if (format.size && format.size !== 'inherit') attrs.push(`data-s="${format.size}"`);
    if (format.font && format.font !== 'inherit') attrs.push(`data-f="${format.font}"`);
    if (format.bold) attrs.push('data-b="1"');
    if (format.italic) attrs.push('data-i="1"');
    if (format.underline) attrs.push('data-u="1"');
    const attrStr = attrs.length ? ` ${attrs.join(' ')}` : '';
    const classStr = cls ? ` class="${cls}"` : '';
    return `<span${attrStr}${classStr}>${inner}</span>`;
  };
  return Array.from(doc.body.childNodes).map(walk).join('').trim();
}

export function getEditorHtml(editor: HTMLElement): string {
  return sanitizeCmsHtml(editor.innerHTML);
}

export function applyInlineFormatToSelection(editor: HTMLElement, patch: Partial<InlineFormat>): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer) || range.collapsed) return false;

  const format: InlineFormat = {};
  if (patch.color && patch.color !== 'inherit') format.color = patch.color;
  if (patch.size && patch.size !== 'inherit') format.size = patch.size;
  if (patch.font && patch.font !== 'inherit') format.font = patch.font;
  if (patch.bold) format.bold = true;
  if (patch.italic) format.italic = true;
  if (patch.underline) format.underline = true;

  const span = document.createElement('span');
  writeSpanFormat(span, format);
  try {
    span.appendChild(range.extractContents());
    range.insertNode(span);
  } catch {
    return false;
  }

  sel.removeAllRanges();
  const after = document.createRange();
  after.selectNodeContents(span);
  after.collapse(false);
  sel.addRange(after);
  return true;
}

export function toggleInlineMarkOnSelection(editor: HTMLElement, mark: 'bold' | 'italic' | 'underline'): boolean {
  editor.focus();
  const cmd = mark === 'bold' ? 'bold' : mark === 'italic' ? 'italic' : 'underline';
  return document.execCommand(cmd, false);
}

export function selectionSummary(editor: HTMLElement | null): {
  hasRange: boolean;
  collapsed: boolean;
  text: string;
} {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !editor) return { hasRange: false, collapsed: true, text: '' };
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return { hasRange: false, collapsed: true, text: '' };
  return { hasRange: true, collapsed: range.collapsed, text: range.collapsed ? '' : range.toString() };
}
