/** Max encoded length accepted by kk_submit_guest_payment_proof (DB allows ~900k; stay under). */
export const GUEST_PROOF_MAX_DATA_URL_CHARS = 750_000;

export type PrepareGuestProofResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}

function canvasToJpegDataUrl(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Resize and compress a phone screenshot so it fits the guest proof RPC limit.
 * Works for anonymous QR / takeout customers (no Storage sign-in required).
 */
export async function prepareGuestPaymentProof(file: File): Promise<PrepareGuestProofResult> {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  const isImage =
    type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(name);
  if (!isImage) {
    return { ok: false, error: 'Please choose a photo (PNG, JPG, or screenshot).' };
  }

  if (file.size > 12_000_000) {
    return { ok: false, error: 'Image is too large. Try a smaller screenshot or crop the receipt.' };
  }

  try {
    const img = await loadImageFromFile(file);
    const maxSide = 1400;
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight, 1));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { ok: false, error: 'Could not process this image on your device.' };
    }
    ctx.drawImage(img, 0, 0, w, h);

    for (let q = 0.88; q >= 0.45; q -= 0.08) {
      const dataUrl = canvasToJpegDataUrl(canvas, q);
      if (dataUrl.length <= GUEST_PROOF_MAX_DATA_URL_CHARS) {
        return { ok: true, dataUrl };
      }
    }

    // Last resort: smaller dimensions
    canvas.width = Math.round(w * 0.7);
    canvas.height = Math.round(h * 0.7);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const fallback = canvasToJpegDataUrl(canvas, 0.75);
    if (fallback.length <= GUEST_PROOF_MAX_DATA_URL_CHARS) {
      return { ok: true, dataUrl: fallback };
    }

    return {
      ok: false,
      error: 'Screenshot is still too large after compression. Crop to the receipt only and try again.',
    };
  } catch {
    return {
      ok: false,
      error:
        'Could not process this photo. Try saving as JPG from your gallery, or use a smaller screenshot.',
    };
  }
}
