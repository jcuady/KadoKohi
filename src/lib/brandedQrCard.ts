/**
 * Print-ready Kado Kohi QR cards — dine-in (square) and takeout (portrait).
 * Paired layouts share chrome, typography, and spacing rhythm.
 * @see BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md
 */
import {
  BRAND,
  FONT_BODY,
  FONT_HEADLINE,
  FONT_MONO,
  LOGO,
  QR_TABLE_EXPORT_SIZE,
  QR_TAKEOUT_EXPORT_HEIGHT,
  QR_TAKEOUT_EXPORT_WIDTH,
} from './brandTokens';
import { ensureBrandFontsLoaded } from './canvasFonts';
import { blobToDataUrl, printImageDataUrl } from './qrPrint';
import { canonicalScanUrl, getSiteOrigin, scanUrlForDisplay } from './siteUrl';
import { qrImageUrl } from './qr';

export type QrCardLayout = 'table' | 'takeout';

export type BrandedQrCardInput = {
  layout: QrCardLayout;
  title: string;
  subtitle?: string;
  scanUrl: string;
  tagline?: string;
};

type CardAssets = {
  wordmark: HTMLImageElement;
  mark: HTMLImageElement;
  qr: HTMLImageElement;
};

/** Shared layout rhythm (fractions of card width). */
const RHYTHM = {
  bleed: 0.04,
  panelRadius: 0.032,
  innerPadRatio: 0.09,
  gap: 0.038,
  bandHeight: 0.095,
  /** Dine-in wordmark — keep compact so QR + footer fit in 1:1. */
  logoHeightTable: 0.062,
  logoHeightTakeout: 0.065,
  borderInset: 0.01,
  ruleInset: 0.1,
  /** Max dine-in title size (fraction of card width). */
  titleMaxTable: 0.072,
} as const;

function assetUrl(path: string): string {
  return `${getSiteOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
}

async function loadQrImage(scanUrl: string, size: number): Promise<HTMLImageElement> {
  const res = await fetch(qrImageUrl(scanUrl, size));
  if (!res.ok) throw new Error('Could not generate QR code');
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  try {
    return await loadImage(blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
): number {
  const scale = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, x + (maxW - w) / 2, y + (maxH - h) / 2, w, h);
  return h;
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  fontWeight: string,
  fontFamily: string,
): number {
  let size = maxSize;
  while (size >= minSize) {
    ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  }
  return minSize;
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  size: number,
  color: string,
  fontWeight: string,
  fontFamily: string,
  letterSpacing = 0,
): number {
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
  if (letterSpacing > 0) ctx.letterSpacing = `${letterSpacing}px`;
  ctx.fillText(text, cx, y);
  ctx.letterSpacing = '0px';
  return size;
}

type PanelMetrics = {
  cx: number;
  panelX: number;
  panelY: number;
  panelW: number;
  panelH: number;
  contentX: number;
  contentW: number;
  innerPad: number;
  gap: number;
};

function measurePanel(width: number, height: number): PanelMetrics {
  const bleedX = width * RHYTHM.bleed;
  const bleedY = height * RHYTHM.bleed;
  const panelX = bleedX;
  const panelY = bleedY;
  const panelW = width - bleedX * 2;
  const panelH = height - bleedY * 2;
  const innerPad = panelW * RHYTHM.innerPadRatio;
  return {
    cx: width / 2,
    panelX,
    panelY,
    panelW,
    panelH,
    contentX: panelX + innerPad,
    contentW: panelW - innerPad * 2,
    innerPad,
    gap: width * RHYTHM.gap,
  };
}

/** Cream field + off-white panel + inset red frame (shared by dine-in & takeout). */
function drawCardChrome(ctx: CanvasRenderingContext2D, width: number, height: number, m: PanelMetrics): void {
  ctx.fillStyle = BRAND.cream;
  ctx.fillRect(0, 0, width, height);

  const r = width * RHYTHM.panelRadius;
  ctx.fillStyle = BRAND.offwhite;
  roundRect(ctx, m.panelX, m.panelY, m.panelW, m.panelH, r);
  ctx.fill();

  const inset = width * RHYTHM.borderInset;
  ctx.strokeStyle = BRAND.red;
  ctx.lineWidth = Math.max(2, width * 0.0026);
  roundRect(ctx, m.panelX + inset, m.panelY + inset, m.panelW - inset * 2, m.panelH - inset * 2, r * 0.92);
  ctx.stroke();
}

/** Red header band — "DINE IN" or "TAKEOUT". */
function drawTopBand(
  ctx: CanvasRenderingContext2D,
  m: PanelMetrics,
  label: string,
  width: number,
): number {
  const bandH = width * RHYTHM.bandHeight;
  const r = width * RHYTHM.panelRadius;

  ctx.fillStyle = BRAND.red;
  roundRect(ctx, m.panelX, m.panelY, m.panelW, bandH, r);
  ctx.fill();
  ctx.fillRect(m.panelX, m.panelY + bandH * 0.48, m.panelW, bandH * 0.52);

  const bandLabel = Math.round(width * 0.036);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${bandLabel}px ${FONT_HEADLINE}`;
  ctx.fillStyle = BRAND.cream;
  ctx.letterSpacing = `${bandLabel * 0.22}px`;
  ctx.fillText(label, m.cx, m.panelY + bandH / 2);
  ctx.letterSpacing = '0px';

  return bandH;
}

function drawThinRule(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  width: number,
): void {
  ctx.strokeStyle = `${BRAND.red}44`;
  ctx.lineWidth = Math.max(1, width * 0.0014);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

/**
 * Dine-in table line — title with flanking rules.
 * @param baseline Text baseline (alphabetic). Returns y below the title block.
 */
function drawFlankingTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  m: PanelMetrics,
  baseline: number,
  fontSize: number,
  width: number,
): number {
  const upper = text.toUpperCase();
  ctx.font = `800 ${fontSize}px ${FONT_HEADLINE}`;
  const textW = ctx.measureText(upper).width;
  const ruleGap = fontSize * 0.42;
  const ruleY = baseline - fontSize * 0.72;
  const contentRight = m.contentX + m.contentW;
  const ruleStart = m.contentX + m.contentW * RHYTHM.ruleInset;
  const ruleEnd = contentRight - m.contentW * RHYTHM.ruleInset;

  const leftRuleEnd = m.cx - textW / 2 - ruleGap;
  const rightRuleStart = m.cx + textW / 2 + ruleGap;

  if (leftRuleEnd > ruleStart + width * 0.02) {
    drawThinRule(ctx, ruleStart, leftRuleEnd, ruleY, width);
  }
  if (rightRuleStart < ruleEnd - width * 0.02) {
    drawThinRule(ctx, rightRuleStart, ruleEnd, ruleY, width);
  }

  drawCenteredText(ctx, upper, m.cx, baseline, fontSize, BRAND.dark, '800', FONT_HEADLINE);
  return baseline + fontSize * 0.14;
}

function measureScanPillHeight(width: number): number {
  const fontSize = Math.round(width * 0.027);
  return fontSize + width * 0.02 * 2;
}

/** Reserve bottom stack for dine-in: scan URL (above) + pill (anchored to panel bottom). */
function measureTableFooterTop(panelBottom: number, width: number, innerPad: number): number {
  const urlSize = Math.round(width * 0.016);
  const pillH = measureScanPillHeight(width);
  const stack = innerPad * 0.38 + pillH + width * 0.026 + urlSize + width * 0.018;
  return panelBottom - stack;
}

/** Bottom-anchored dine-in footer — avoids clipping the CTA on square cards. */
function drawTableFooter(
  ctx: CanvasRenderingContext2D,
  m: PanelMetrics,
  scanUrl: string,
  panelBottom: number,
  width: number,
): void {
  const urlSize = Math.round(width * 0.016);
  const pillH = measureScanPillHeight(width);
  const bottomPad = m.innerPad * 0.38;

  const pillY = panelBottom - bottomPad - pillH;
  drawScanPill(ctx, m.cx, pillY, 'SCAN TO ORDER', width);

  const urlBaseline = pillY - width * 0.024;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `500 ${urlSize}px ${FONT_MONO}`;
  ctx.fillStyle = `${BRAND.muted}90`;
  ctx.fillText(scanUrlForDisplay(scanUrl), m.cx, urlBaseline);
}

function drawQrBlock(
  ctx: CanvasRenderingContext2D,
  qrImg: HTMLImageElement,
  mark: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  cornerRadius: number,
): void {
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, x, y, size, size, cornerRadius);
  ctx.fill();

  ctx.strokeStyle = `${BRAND.red}30`;
  ctx.lineWidth = Math.max(1, size * 0.0032);
  roundRect(ctx, x, y, size, size, cornerRadius);
  ctx.stroke();

  const inset = size * 0.07;
  ctx.drawImage(qrImg, x + inset, y + inset, size - inset * 2, size - inset * 2);

  const markSize = size * 0.155;
  const markX = x + (size - markSize) / 2;
  const markY = y + (size - markSize) / 2;
  const pad = markSize * 0.16;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, markX - pad, markY - pad, markSize + pad * 2, markSize + pad * 2, pad * 0.85);
  ctx.fill();
  drawContainedImage(ctx, mark, markX, markY, markSize, markSize);
}

function drawScanPill(ctx: CanvasRenderingContext2D, cx: number, y: number, label: string, width: number): number {
  const fontSize = Math.round(width * 0.028);
  ctx.font = `700 ${fontSize}px ${FONT_HEADLINE}`;
  const textW = ctx.measureText(label).width;
  const padX = width * 0.048;
  const padY = width * 0.02;
  const pillW = textW + padX * 2;
  const pillH = fontSize + padY * 2;
  const pillX = cx - pillW / 2;

  ctx.fillStyle = BRAND.red;
  roundRect(ctx, pillX, y, pillW, pillH, pillH / 2);
  ctx.fill();

  ctx.fillStyle = BRAND.cream;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${fontSize}px ${FONT_HEADLINE}`;
  ctx.letterSpacing = `${fontSize * 0.12}px`;
  ctx.fillText(label, cx, y + pillH / 2);
  ctx.letterSpacing = '0px';

  return pillH;
}

function drawCardFooter(
  ctx: CanvasRenderingContext2D,
  m: PanelMetrics,
  data: BrandedQrCardInput,
  y: number,
  width: number,
): void {
  const tagSize = Math.round(width * 0.022);
  drawCenteredText(ctx, data.tagline!.toUpperCase(), m.cx, y, tagSize, BRAND.muted, '500', FONT_BODY);

  const urlSize = Math.round(width * 0.017);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `500 ${urlSize}px ${FONT_MONO}`;
  ctx.fillStyle = `${BRAND.muted}88`;
  ctx.fillText(scanUrlForDisplay(data.scanUrl), m.cx, m.panelY + m.panelH - m.innerPad * 0.5);
}

function normalizeInput(input: BrandedQrCardInput): BrandedQrCardInput {
  const scanUrl = canonicalScanUrl(input.scanUrl);
  const layout = input.layout ?? 'table';
  return {
    ...input,
    layout,
    scanUrl,
    title: input.title.trim(),
    subtitle: input.subtitle?.trim(),
    tagline:
      input.tagline ??
      (layout === 'takeout' ? 'Takeout · Order from your phone' : 'Dine-in · Order from your phone'),
  };
}

/**
 * Square dine-in tent (1:1) — band, wordmark, flanked table title, QR, bottom-anchored CTA.
 * Footer is measured first so the pill and URL never clip; title/subtitle use explicit baselines.
 */
function renderTableSquareCard(
  ctx: CanvasRenderingContext2D,
  size: number,
  data: BrandedQrCardInput,
  assets: CardAssets,
): void {
  const m = measurePanel(size, size);
  drawCardChrome(ctx, size, size, m);

  const panelBottom = m.panelY + m.panelH - m.innerPad;
  const footerTop = measureTableFooterTop(panelBottom, size, m.innerPad);

  const bandH = drawTopBand(ctx, m, 'DINE IN', size);
  let y = m.panelY + bandH + m.gap * 0.92;

  const logoH = size * RHYTHM.logoHeightTable;
  const logoDrawn = drawContainedImage(ctx, assets.wordmark, m.contentX, y, m.contentW, logoH);
  y += logoDrawn + m.gap * 0.92;

  const titleUpper = data.title.toUpperCase();
  const titleSize = fitFontSize(
    ctx,
    titleUpper,
    m.contentW * 0.88,
    Math.round(size * RHYTHM.titleMaxTable),
    Math.round(size * 0.044),
    '800',
    FONT_HEADLINE,
  );
  const titleBaseline = y + titleSize;
  y = drawFlankingTitle(ctx, titleUpper, m, titleBaseline, titleSize, size);
  y += m.gap * 0.95;

  if (data.subtitle) {
    const subUpper = data.subtitle.toUpperCase();
    const subSize = fitFontSize(
      ctx,
      subUpper,
      m.contentW * 0.92,
      Math.round(size * 0.028),
      Math.round(size * 0.019),
      '600',
      FONT_BODY,
    );
    const subBaseline = y + subSize;
    drawCenteredText(ctx, subUpper, m.cx, subBaseline, subSize, BRAND.muted, '600', FONT_BODY, subSize * 0.14);
    y = subBaseline + m.gap * 0.8;
  }

  drawThinRule(ctx, m.contentX + m.contentW * RHYTHM.ruleInset, m.contentX + m.contentW * (1 - RHYTHM.ruleInset), y, size);
  y += m.gap * 0.95;

  const qrGap = m.gap * 0.85;
  const availableForQr = footerTop - y - qrGap;
  const qrSize = Math.min(m.contentW * 0.72, Math.max(availableForQr, m.contentW * 0.44));
  const qrX = m.contentX + (m.contentW - qrSize) / 2;
  drawQrBlock(ctx, assets.qr, assets.mark, qrX, y, qrSize, size * 0.022);

  drawTableFooter(ctx, m, data.scanUrl, panelBottom, size);
}

/** Portrait takeout stand — same chrome and rhythm as dine-in. */
function renderTakeoutPortraitCard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: BrandedQrCardInput,
  assets: CardAssets,
): void {
  const m = measurePanel(width, height);
  drawCardChrome(ctx, width, height, m);

  const bandH = drawTopBand(ctx, m, 'TAKEOUT', width);
  let y = m.panelY + bandH + m.gap;

  const logoH = width * RHYTHM.logoHeightTakeout;
  const logoDrawn = drawContainedImage(ctx, assets.wordmark, m.contentX, y, m.contentW, logoH);
  y += logoDrawn + m.gap;

  const branchSize = fitFontSize(
    ctx,
    data.title,
    m.contentW * 0.92,
    Math.round(width * 0.05),
    Math.round(width * 0.032),
    '800',
    FONT_HEADLINE,
  );
  drawCenteredText(ctx, data.title, m.cx, y, branchSize, BRAND.dark, '800', FONT_HEADLINE);
  y += branchSize + m.gap * 0.55;

  if (data.subtitle) {
    const subSize = fitFontSize(
      ctx,
      data.subtitle.toUpperCase(),
      m.contentW * 0.95,
      Math.round(width * 0.024),
      Math.round(width * 0.017),
      '600',
      FONT_BODY,
    );
    drawCenteredText(ctx, data.subtitle.toUpperCase(), m.cx, y, subSize, BRAND.muted, '600', FONT_BODY);
    y += subSize + m.gap;
  }

  drawThinRule(ctx, m.contentX + m.contentW * RHYTHM.ruleInset, m.contentX + m.contentW * (1 - RHYTHM.ruleInset), y, width);
  y += m.gap;

  const bottomReserve = height * 0.14;
  const qrMax = Math.min(m.contentW * 0.78, m.panelY + m.panelH - m.innerPad - bottomReserve - y);
  const qrSize = Math.max(qrMax, m.contentW * 0.55);
  const qrX = m.contentX + (m.contentW - qrSize) / 2;
  drawQrBlock(ctx, assets.qr, assets.mark, qrX, y, qrSize, width * 0.022);
  y += qrSize + m.gap * 0.9;

  const pillH = drawScanPill(ctx, m.cx, y, 'SCAN TO ORDER', width);
  y += pillH + m.gap * 0.65;

  drawCardFooter(ctx, m, data, y, width);
}

function exportDimensions(layout: QrCardLayout): { width: number; height: number } {
  if (layout === 'takeout') {
    return { width: QR_TAKEOUT_EXPORT_WIDTH, height: QR_TAKEOUT_EXPORT_HEIGHT };
  }
  return { width: QR_TABLE_EXPORT_SIZE, height: QR_TABLE_EXPORT_SIZE };
}

export async function renderBrandedQrCardBlob(
  input: BrandedQrCardInput,
  exportWidth?: number,
): Promise<Blob> {
  await ensureBrandFontsLoaded();

  const data = normalizeInput(input);
  const defaults = exportDimensions(data.layout);
  const width = exportWidth ?? defaults.width;
  const height =
    data.layout === 'takeout'
      ? Math.round(width * (defaults.height / defaults.width))
      : width;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const qrPixels = data.layout === 'table' ? 800 : 840;
  const [wordmark, mark, qrImg] = await Promise.all([
    loadImage(assetUrl(LOGO.wordmark)),
    loadImage(assetUrl(LOGO.hybridMark)),
    loadQrImage(data.scanUrl, qrPixels),
  ]);
  const assets: CardAssets = { wordmark, mark, qr: qrImg };

  if (data.layout === 'takeout') {
    renderTakeoutPortraitCard(ctx, width, height, data, assets);
  } else {
    renderTableSquareCard(ctx, width, data, assets);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not export QR card'))),
      'image/png',
      1,
    );
  });
}

export async function downloadBrandedQrCard(
  input: BrandedQrCardInput,
  filename: string,
): Promise<void> {
  const { width } = exportDimensions(input.layout ?? 'table');
  const blob = await renderBrandedQrCardBlob(input, width);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function printBrandedQrCard(input: BrandedQrCardInput): Promise<void> {
  const data = normalizeInput(input);
  const { width } = exportDimensions(data.layout);
  const blob = await renderBrandedQrCardBlob(data, width);
  const dataUrl = await blobToDataUrl(blob);
  await printImageDataUrl(dataUrl, data.title, data.layout);
}

export async function createBrandedQrPreviewUrl(input: BrandedQrCardInput): Promise<string> {
  const previewWidth = input.layout === 'takeout' ? 520 : 680;
  const blob = await renderBrandedQrCardBlob(input, previewWidth);
  return URL.createObjectURL(blob);
}
