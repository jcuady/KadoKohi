/** Max bytes for images stored in localStorage via landing content (data URLs). */
export const LANDING_IMAGE_DATA_URL_MAX_BYTES = 1_200_000;

export type ReadImageDataUrlResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

export function readImageDataUrl(file: File, maxBytes = LANDING_IMAGE_DATA_URL_MAX_BYTES): Promise<ReadImageDataUrlResult> {
  if (!file.type.startsWith('image/')) {
    return Promise.resolve({ ok: false, error: 'Please choose an image file (PNG, JPG, WebP, etc.).' });
  }
  if (file.size > maxBytes) {
    return Promise.resolve({
      ok: false,
      error: `Image is too large (${Math.round(file.size / 1024)} KB). Max about ${Math.round(maxBytes / 1024)} KB so it fits in browser storage.`,
    });
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        resolve({ ok: false, error: 'Could not read that file.' });
        return;
      }
      resolve({ ok: true, dataUrl });
    };
    reader.onerror = () => resolve({ ok: false, error: 'Could not read that file.' });
    reader.readAsDataURL(file);
  });
}
