/**
 * Print-ready Kado Kohi QR cards — table (square) and takeout (portrait).
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

function drawThinRule(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, width: number): void {
  ctx.strokeStyle = `${BRAND.red}40`;
  ctx.lineWidth = Math.max(1, width * 0.0015);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
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

  ctx.strokeStyle = `${BRAND.red}28`;
  ctx.lineWidth = Math.max(1, size * 0.003);
  roundRect(ctx, x, y, size, size, cornerRadius);
  ctx.stroke();

  const inset = size * 0.072;
  ctx.drawImage(qrImg, x + inset, y + inset, size - inset * 2, size - inset * 2);

  const markSize = size * 0.16;
  const markX = x + (size - markSize) / 2;
  const markY = y + (size - markSize) / 2;
  const pad = markSize * 0.14;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, markX - pad, markY - pad, markSize + pad * 2, markSize + pad * 2, pad * 0.9);
  ctx.fill();
  drawContainedImage(ctx, mark, markX, markY, markSize, markSize);
}

function drawScanPill(ctx: CanvasRenderingContext2D, cx: number, y: number, label: string, width: number): number {
  const fontSize = Math.round(width * 0.028);
  ctx.font = `700 ${fontSize}px ${FONT_HEADLINE}`;
  const textW = ctx.measureText(label).width;
  const padX = width * 0.045;
  const padY = width * 0.018;
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
  ctx.fillText(label, cx, y + pillH / 2);

  return pillH;
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
      (layout === 'takeout' ? 'Order from your phone' : 'Order from your phone'),
  };
}

/** Square table tent — minimal, print-safe spacing. */
function renderTableSquareCard(
  ctx: CanvasRenderingContext2D,
  size: number,
  data: BrandedQrCardInput,
  assets: CardAssets,
): void {
  const cx = size / 2;
  const bleed = size * 0.035;
  const panel = size - bleed * 2;
  const panelX = bleed;
  const panelY = bleed;
  const innerPad = panel * 0.09;
  const contentW = panel - innerPad * 2;
  const contentX = panelX + innerPad;
  const gap = size * 0.038;

  ctx.fillStyle = BRAND.cream;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = BRAND.offwhite;
  roundRect(ctx, panelX, panelY, panel, panel, size * 0.028);
  ctx.fill();

  ctx.strokeStyle = BRAND.red;
  ctx.lineWidth = Math.max(2, size * 0.0028);
  roundRect(ctx, panelX + size * 0.008, panelY + size * 0.008, panel - size * 0.016, panel - size * 0.016, size * 0.024);
  ctx.stroke();

  let y = panelY + innerPad;

  const markBox = size * 0.11;
  const markDrawn = drawContainedImage(ctx, assets.mark, contentX, y, contentW, markBox);
  y += markDrawn + gap * 0.65;

  const brandSize = Math.round(size * 0.034);
  drawCenteredText(ctx, 'KADO KŌHĪ', cx, y, brandSize, BRAND.red, '800', FONT_HEADLINE, brandSize * 0.14);
  y += brandSize + gap;

  drawThinRule(ctx, contentX + contentW * 0.12, contentX + contentW * 0.88, y, size);
  y += gap;

  const titleUpper = data.title.toUpperCase();
  const titleSize = fitFontSize(ctx, titleUpper, contentW * 0.92, Math.round(size * 0.072), Math.round(size * 0.04), '800', FONT_HEADLINE);
  drawCenteredText(ctx, titleUpper, cx, y, titleSize, BRAND.dark, '800', FONT_HEADLINE);
  y += titleSize * 1.05 + gap * 0.5;

  if (data.subtitle) {
    const subUpper = data.subtitle.toUpperCase();
    const subSize = fitFontSize(ctx, subUpper, contentW * 0.95, Math.round(size * 0.026), Math.round(size * 0.018), '600', FONT_BODY);
    drawCenteredText(ctx, subUpper, cx, y, subSize, BRAND.muted, '600', FONT_BODY);
    y += subSize + gap;
  }

  const footerReserve = size * 0.12;
  const availableForQr = panelY + panel - innerPad - footerReserve - y - gap;
  const qrSize = Math.min(contentW * 0.7, Math.max(availableForQr, contentW * 0.48));
  const qrX = contentX + (contentW - qrSize) / 2;
  drawQrBlock(ctx, assets.qr, assets.mark, qrX, y, qrSize, size * 0.02);
  y += qrSize + gap * 0.75;

  drawScanPill(ctx, cx, y, 'SCAN TO ORDER', size);
}

/** Portrait takeout stand — cashier-friendly hierarchy. */
function renderTakeoutPortraitCard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: BrandedQrCardInput,
  assets: CardAssets,
): void {
  const cx = width / 2;
  const bleedX = width * 0.04;
  const bleedY = height * 0.028;
  const panelW = width - bleedX * 2;
  const panelH = height - bleedY * 2;
  const panelX = bleedX;
  const panelY = bleedY;
  const innerPad = width * 0.09;
  const contentW = panelW - innerPad * 2;
  const contentX = panelX + innerPad;
  const gap = width * 0.042;

  ctx.fillStyle = BRAND.cream;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = BRAND.offwhite;
  roundRect(ctx, panelX, panelY, panelW, panelH, width * 0.032);
  ctx.fill();

  ctx.strokeStyle = BRAND.red;
  ctx.lineWidth = Math.max(2, width * 0.0025);
  roundRect(
    ctx,
    panelX + width * 0.01,
    panelY + width * 0.01,
    panelW - width * 0.02,
    panelH - width * 0.02,
    width * 0.028,
  );
  ctx.stroke();

  const bandH = width * 0.11;
  ctx.fillStyle = BRAND.red;
  roundRect(ctx, panelX, panelY, panelW, bandH, width * 0.032);
  ctx.fill();
  ctx.fillRect(panelX, panelY + bandH * 0.5, panelW, bandH * 0.5);

  const bandLabel = Math.round(width * 0.036);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${bandLabel}px ${FONT_HEADLINE}`;
  ctx.fillStyle = BRAND.cream;
  ctx.fillText('TAKEOUT', cx, panelY + bandH / 2);

  let y = panelY + bandH + gap;

  const logoH = width * 0.065;
  const logoDrawn = drawContainedImage(ctx, assets.wordmark, contentX, y, contentW, logoH);
  y += logoDrawn + gap;

  const branchSize = fitFontSize(
    ctx,
    data.title,
    contentW * 0.92,
    Math.round(width * 0.048),
    Math.round(width * 0.032),
    '800',
    FONT_HEADLINE,
  );
  drawCenteredText(ctx, data.title, cx, y, branchSize, BRAND.dark, '800', FONT_HEADLINE);
  y += branchSize + gap * 0.55;

  if (data.subtitle) {
    const subSize = fitFontSize(
      ctx,
      data.subtitle.toUpperCase(),
      contentW * 0.95,
      Math.round(width * 0.024),
      Math.round(width * 0.017),
      '600',
      FONT_BODY,
    );
    drawCenteredText(ctx, data.subtitle.toUpperCase(), cx, y, subSize, BRAND.muted, '600', FONT_BODY);
    y += subSize + gap;
  }

  drawThinRule(ctx, contentX + contentW * 0.1, contentX + contentW * 0.9, y, width);
  y += gap;

  const bottomReserve = height * 0.14;
  const qrMax = Math.min(contentW * 0.78, panelY + panelH - innerPad - bottomReserve - y);
  const qrSize = Math.max(qrMax, contentW * 0.55);
  const qrX = contentX + (contentW - qrSize) / 2;
  drawQrBlock(ctx, assets.qr, assets.mark, qrX, y, qrSize, width * 0.022);
  y += qrSize + gap;

  const pillH = drawScanPill(ctx, cx, y, 'SCAN TO ORDER', width);
  y += pillH + gap * 0.7;

  const tagSize = Math.round(width * 0.022);
  drawCenteredText(ctx, data.tagline!.toUpperCase(), cx, y, tagSize, BRAND.muted, '500', FONT_BODY);

  const urlSize = Math.round(width * 0.017);
  ctx.font = `500 ${urlSize}px ${FONT_MONO}`;
  ctx.fillStyle = `${BRAND.muted}99`;
  ctx.fillText(scanUrlForDisplay(data.scanUrl), cx, panelY + panelH - innerPad * 0.55);
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

  const qrPixels = data.layout === 'table' ? 768 : 840;
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
