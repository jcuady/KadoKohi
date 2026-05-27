import { BRAND } from './brandTokens';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read print image'));
    };
    reader.onerror = () => reject(new Error('Could not read print image'));
    reader.readAsDataURL(blob);
  });
}

function buildPrintDocument(dataUrl: string, title: string): string {
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Kado Kohi — ${safeTitle}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 12mm;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: ${BRAND.cream};
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .sheet {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 10mm;
        gap: 6mm;
      }
      img#print-card {
        width: 100%;
        max-width: 92mm;
        height: auto;
        display: block;
        border-radius: 4mm;
      }
      .print-hint {
        font-family: "M PLUS 1", system-ui, sans-serif;
        font-size: 9pt;
        color: ${BRAND.muted};
        text-align: center;
        max-width: 92mm;
      }
      @media print {
        html, body { background: ${BRAND.offwhite}; }
        .sheet { padding: 0; min-height: auto; gap: 0; }
        img#print-card { max-width: 100%; border-radius: 0; }
        .print-hint { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <img id="print-card" src="${dataUrl}" alt="Kado Kohi — ${safeTitle}" />
      <p class="print-hint">Kado Kohi · Cut along card edge · Place on table</p>
    </div>
  </body>
</html>`;
}

function waitForPrintImage(win: Window): Promise<void> {
  const img = win.document.getElementById('print-card') as HTMLImageElement | null;
  if (!img) return Promise.reject(new Error('Print layout failed'));

  if (img.complete && img.naturalWidth > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Print image failed to load'));
  });
}

function triggerPrint(win: Window): void {
  win.focus();
  win.print();
}

/** Print via hidden iframe (avoids most pop-up blockers). */
export async function printHtmlDocument(html: string): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Kado Kohi QR print');
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: 'none',
    opacity: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  if (!win) {
    iframe.remove();
    throw new Error('Print frame unavailable');
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  try {
    await waitForPrintImage(win);
    await new Promise((r) => setTimeout(r, 200));
    triggerPrint(win);
  } finally {
    setTimeout(() => iframe.remove(), 1500);
  }
}

/** Fallback when iframe print is blocked. */
export async function printHtmlDocumentInWindow(html: string): Promise<void> {
  const printWin = window.open('', '_blank');
  if (!printWin) {
    throw new Error('Pop-up blocked — allow pop-ups to print, or use Download.');
  }

  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();

  await waitForPrintImage(printWin);
  await new Promise((r) => setTimeout(r, 200));
  triggerPrint(printWin);

  printWin.addEventListener('afterprint', () => printWin.close());
  setTimeout(() => {
    if (!printWin.closed) printWin.close();
  }, 60_000);
}

export async function printImageDataUrl(dataUrl: string, title: string): Promise<void> {
  const html = buildPrintDocument(dataUrl, title);
  try {
    await printHtmlDocument(html);
  } catch {
    await printHtmlDocumentInWindow(html);
  }
}
