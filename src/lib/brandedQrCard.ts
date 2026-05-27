/**
 * Print-ready Kado Kohi table QR card — brand tokens, logo, balanced typography.
 * @see BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md
 */
import { BRAND, FONT_BODY, FONT_HEADLINE, FONT_MONO, LOGO, QR_CARD_EXPORT_WIDTH } from './brandTokens';
import { ensureBrandFontsLoaded } from './canvasFonts';
import { blobToDataUrl, printImageDataUrl } from './qrPrint';
import { canonicalScanUrl, scanUrlForDisplay } from './siteUrl';
import { qrImageUrl } from './qr';

export type BrandedQrCardInput = {
  title: string;
  subtitle?: string;
  scanUrl: string;
  /** Footer line under QR (default: dine-in helper). */
  tagline?: string;
};

/** Logo paths load from the current app origin (works in local dev). */
function assetUrl(path: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kado-kohi.vercel.app';
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
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
): void {
  const scale = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, x + (maxW - w) / 2, y + (maxH - h) / 2, w, h);
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  label: string,
  fontSize: number,
  padX: number,
  padY: number,
): number {
  ctx.font = `700 ${fontSize}px ${FONT_HEADLINE}`;
  const textW = ctx.measureText(label).width;
  const pillW = textW + padX * 2;
  const pillH = fontSize + padY * 2;
  const pillX = cx - pillW / 2;

  ctx.fillStyle = BRAND.red;
  roundRect(ctx, pillX, y, pillW, pillH, pillH / 2);
  ctx.fill();

  ctx.fillStyle = BRAND.cream;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${fontSize * 0.12}px`;
  ctx.fillText(label, cx, y + pillH / 2);
  ctx.letterSpacing = '0px';

  return pillH;
}

function drawDivider(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number): void {
  ctx.strokeStyle = `${BRAND.red}55`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

function normalizeInput(input: BrandedQrCardInput): BrandedQrCardInput {
  const scanUrl = canonicalScanUrl(input.scanUrl);
  return {
    ...input,
    scanUrl,
    title: input.title.trim(),
    subtitle: input.subtitle?.trim().toUpperCase(),
    tagline: input.tagline ?? 'Dine-in menu · Order from your phone',
  };
}

/** Render branded QR card to PNG blob (high-res for print). */
export async function renderBrandedQrCardBlob(
  input: BrandedQrCardInput,
  width = QR_CARD_EXPORT_WIDTH,
): Promise<Blob> {
  await ensureBrandFontsLoaded();

  const data = normalizeInput(input);
  const height = Math.round(width * 1.42);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const cx = width / 2;
  const margin = width * 0.065;
  const panelX = margin;
  const panelY = margin;
  const panelW = width - margin * 2;

  const [wordmark, mark, qrImg] = await Promise.all([
    loadImage(assetUrl(LOGO.wordmark)),
    loadImage(assetUrl(LOGO.hybridMark)),
    loadQrImage(data.scanUrl, 760),
  ]);

  // Outer cream field + double border (brand contrast: cream / paper / red)
  ctx.fillStyle = BRAND.cream;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = BRAND.cream;
  ctx.lineWidth = width * 0.014;
  roundRect(ctx, margin * 0.45, margin * 0.45, width - margin * 0.9, height - margin * 0.9, width * 0.045);
  ctx.stroke();

  ctx.fillStyle = BRAND.offwhite;
  roundRect(ctx, panelX, panelY, panelW, height - margin * 2, width * 0.032);
  ctx.fill();

  ctx.strokeStyle = BRAND.red;
  ctx.lineWidth = Math.max(2, width * 0.0025);
  roundRect(
    ctx,
    panelX + width * 0.012,
    panelY + width * 0.012,
    panelW - width * 0.024,
    height - margin * 2 - width * 0.024,
    width * 0.028,
  );
  ctx.stroke();

  let y = panelY + width * 0.055;

  const logoMaxH = width * 0.085;
  drawContainedImage(ctx, wordmark, panelX, y, panelW, logoMaxH);
  y += logoMaxH + width * 0.052;

  const pillH = drawPill(ctx, cx, y, 'SCAN TO ORDER', Math.round(width * 0.022), width * 0.04, width * 0.014);
  y += pillH + width * 0.062;

  const titleSize = Math.round(width * 0.056);
  ctx.fillStyle = BRAND.dark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${titleSize}px ${FONT_HEADLINE}`;
  ctx.letterSpacing = `${titleSize * 0.02}px`;
  ctx.fillText(data.title, cx, y);
  ctx.letterSpacing = '0px';
  y += titleSize * 0.38 + width * 0.028;

  if (data.subtitle) {
    const subSize = Math.round(width * 0.023);
    ctx.font = `600 ${subSize}px ${FONT_BODY}`;
    ctx.fillStyle = BRAND.red;
    ctx.fillText(data.subtitle, cx, y);
    y += subSize + width * 0.04;
  }

  drawDivider(ctx, panelX + panelW * 0.18, panelX + panelW * 0.82, y);
  y += width * 0.048;

  const qrBox = panelW * 0.58;
  const qrX = panelX + (panelW - qrBox) / 2;

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(25,25,25,0.1)';
  ctx.shadowBlur = width * 0.018;
  ctx.shadowOffsetY = width * 0.006;
  roundRect(ctx, qrX, y, qrBox, qrBox, width * 0.018);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  const qrInset = qrBox * 0.075;
  ctx.drawImage(qrImg, qrX + qrInset, y + qrInset, qrBox - qrInset * 2, qrBox - qrInset * 2);

  const markSize = qrBox * 0.19;
  const markX = qrX + (qrBox - markSize) / 2;
  const markY = y + (qrBox - markSize) / 2;
  const markPad = markSize * 0.1;
  ctx.fillStyle = '#ffffff';
  roundRect(
    ctx,
    markX - markPad,
    markY - markPad,
    markSize + markPad * 2,
    markSize + markPad * 2,
    markSize * 0.14,
  );
  ctx.fill();
  drawContainedImage(ctx, mark, markX, markY, markSize, markSize);

  y += qrBox + width * 0.052;

  const tagSize = Math.round(width * 0.023);
  ctx.font = `600 ${tagSize}px ${FONT_BODY}`;
  ctx.fillStyle = BRAND.dark;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(data.tagline!.toUpperCase(), cx, y);
  y += tagSize + width * 0.028;

  const urlSize = Math.round(width * 0.019);
  ctx.font = `500 ${urlSize}px ${FONT_MONO}`;
  ctx.fillStyle = BRAND.muted;
  ctx.fillText(scanUrlForDisplay(data.scanUrl), cx, y);
  y += urlSize + width * 0.032;

  const brandSize = Math.round(width * 0.018);
  ctx.font = `700 ${brandSize}px ${FONT_HEADLINE}`;
  ctx.fillStyle = BRAND.red;
  ctx.letterSpacing = `${brandSize * 0.1}px`;
  ctx.fillText('KADO KOHI · SPECIALTY COFFEE', cx, y);
  ctx.letterSpacing = '0px';

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
  const blob = await renderBrandedQrCardBlob(input, QR_CARD_EXPORT_WIDTH);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Print the same PNG as download — iframe first, pop-up fallback. */
export async function printBrandedQrCard(input: BrandedQrCardInput): Promise<void> {
  const data = normalizeInput(input);
  const blob = await renderBrandedQrCardBlob(data, QR_CARD_EXPORT_WIDTH);
  const dataUrl = await blobToDataUrl(blob);
  await printImageDataUrl(dataUrl, data.title);
}

export async function createBrandedQrPreviewUrl(input: BrandedQrCardInput): Promise<string> {
  const blob = await renderBrandedQrCardBlob(input, 800);
  return URL.createObjectURL(blob);
}
