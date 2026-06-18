const DRIVE_FILE_RE = /drive\.google\.com\/file\/d\/([^/]+)/i;
const DRIVE_OPEN_RE = /drive\.google\.com\/open\?id=([^&]+)/i;
const SUPABASE_MENU_BUCKET_PATH = /\/storage\/v1\/object\/public\/kado-menu-images\//i;

/** Max upload size for menu product photos (matches storage bucket). */
export const MENU_PRODUCT_IMAGE_MAX_BYTES = 5_242_880;
export const MENU_PRODUCT_IMAGE_MAX_LABEL = '5 MB';

/** Reject raw picks far above what compression can reasonably handle. */
const MENU_PRODUCT_IMAGE_MAX_INPUT_BYTES = 20_971_520; // 20 MB

export type PrepareMenuProductImageResult =
  | { ok: true; file: File }
  | { ok: false; error: string };

export type MenuImageSource = 'none' | 'url' | 'upload';

export type ResolveMenuImageInput = {
  source: MenuImageSource;
  urlInput: string;
  hasPendingFile: boolean;
  existingImage?: string;
  isEditing: boolean;
};

export type ResolveMenuImageResult =
  | { ok: true; action: 'clear' }
  | { ok: true; action: 'use_url'; url: string }
  | { ok: true; action: 'keep_existing'; url: string }
  | { ok: true; action: 'needs_upload' }
  | { ok: false; error: string };

export function isSupabaseMenuImageUrl(url: string): boolean {
  return SUPABASE_MENU_BUCKET_PATH.test(url.trim());
}

/** Pick the default image source when opening the product form. */
export function inferMenuImageSource(image?: string | null): MenuImageSource {
  const trimmed = image?.trim() ?? '';
  if (!trimmed) return 'none';
  if (isSupabaseMenuImageUrl(trimmed)) return 'upload';
  return 'url';
}

/** Human-readable label for the admin form — what guests will see after save. */
export function describeMenuImageOnSave(input: ResolveMenuImageInput): string {
  const intent = resolveMenuImageSaveIntent(input);
  if (intent.ok === false) return intent.error;
  switch (intent.action) {
    case 'clear':
      return 'Guests will see the category fallback image on the menu.';
    case 'use_url':
      return 'Guests will see your image link on the menu.';
    case 'keep_existing':
      return 'Guests will keep seeing the current uploaded photo.';
    case 'needs_upload':
      return 'Guests will see the new file you selected after upload.';
  }
}

export function previewUrlForMenuImageSource(
  source: MenuImageSource,
  urlInput: string,
  originalImage: string,
  pendingFilePreviewUrl: string | null,
): string {
  if (source === 'none') return '';
  if (source === 'url') {
    return urlInput.trim() ? normalizeExternalMenuImageUrl(urlInput) : '';
  }
  if (pendingFilePreviewUrl) return pendingFilePreviewUrl;
  const original = originalImage.trim();
  if (isSupabaseMenuImageUrl(original)) return original;
  return '';
}

/** Decide what to persist based on the admin's chosen source (not implicit upload-wins). */
export function resolveMenuImageSaveIntent(input: ResolveMenuImageInput): ResolveMenuImageResult {
  switch (input.source) {
    case 'none':
      return { ok: true, action: 'clear' };
    case 'url': {
      const trimmed = input.urlInput.trim();
      if (!trimmed) {
        return { ok: false, error: 'Enter an image URL or choose another image source.' };
      }
      if (!isValidMenuImageUrl(trimmed)) {
        return { ok: false, error: 'Enter a valid image URL (https://… or /public/…).' };
      }
      return { ok: true, action: 'use_url', url: normalizeExternalMenuImageUrl(trimmed) };
    }
    case 'upload': {
      if (input.hasPendingFile) return { ok: true, action: 'needs_upload' };
      const existing = input.existingImage?.trim() ?? '';
      if (input.isEditing && existing && isSupabaseMenuImageUrl(existing)) {
        return { ok: true, action: 'keep_existing', url: existing };
      }
      if (input.isEditing && existing && !isSupabaseMenuImageUrl(existing)) {
        return {
          ok: false,
          error:
            'Choose a file to upload, or switch to Image link to keep the current external URL.',
        };
      }
      return { ok: false, error: 'Choose an image file to upload.' };
    }
  }
}

/**
 * Converts common Google Drive share links to a direct-view URL for previews and storage.
 * The file must still be shared as "Anyone with the link" on Drive.
 */
export function normalizeExternalMenuImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  const fileMatch = trimmed.match(DRIVE_FILE_RE);
  if (fileMatch?.[1]) return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;

  const openMatch = trimmed.match(DRIVE_OPEN_RE);
  if (openMatch?.[1]) return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;

  return trimmed;
}

export function isGoogleDriveUrl(url: string): boolean {
  return /drive\.google\.com/i.test(url.trim());
}

export function isValidMenuImageUrl(url: string): boolean {
  const normalized = normalizeExternalMenuImageUrl(url);
  if (!normalized) return false;
  if (normalized.startsWith('data:image/')) return true;
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return normalized.startsWith('/');
  }
}

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

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

function menuImageTooLargeError(sizeBytes: number): string {
  const shown =
    sizeBytes >= 1_048_576
      ? `${(sizeBytes / 1_048_576).toFixed(1)} MB`
      : `${Math.round(sizeBytes / 1024)} KB`;
  return `Image is too large (${shown}). Maximum is ${MENU_PRODUCT_IMAGE_MAX_LABEL}.`;
}

function isMenuImageFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(name);
}

/**
 * Ensure a menu product image fits the 5 MB storage limit.
 * Compresses oversized phone photos client-side before upload.
 */
export async function prepareMenuProductImage(file: File): Promise<PrepareMenuProductImageResult> {
  if (!isMenuImageFile(file)) {
    return { ok: false, error: 'Please choose an image file (PNG, JPG, WebP, etc.).' };
  }
  if (file.size > MENU_PRODUCT_IMAGE_MAX_INPUT_BYTES) {
    return {
      ok: false,
      error: `Image is too large to process. Choose a file under 20 MB or crop it first.`,
    };
  }
  if (file.size <= MENU_PRODUCT_IMAGE_MAX_BYTES) {
    return { ok: true, file };
  }

  try {
    const img = await loadImageFromFile(file);
    const maxSide = 2400;
    const baseScale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight, 1));
    const baseW = Math.max(1, Math.round(img.naturalWidth * baseScale));
    const baseH = Math.max(1, Math.round(img.naturalHeight * baseScale));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { ok: false, error: 'Could not process this image on your device.' };
    }

    for (let dimScale = 1; dimScale >= 0.45; dimScale -= 0.15) {
      canvas.width = Math.max(1, Math.round(baseW * dimScale));
      canvas.height = Math.max(1, Math.round(baseH * dimScale));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      for (let q = 0.92; q >= 0.5; q -= 0.06) {
        const blob = await canvasToJpegBlob(canvas, q);
        if (!blob) continue;
        if (blob.size <= MENU_PRODUCT_IMAGE_MAX_BYTES) {
          const baseName = file.name.replace(/\.[^.]+$/, '') || 'menu-product';
          return {
            ok: true,
            file: new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' }),
          };
        }
      }
    }

    return { ok: false, error: menuImageTooLargeError(file.size) };
  } catch {
    return {
      ok: false,
      error: 'Could not process this photo. Try saving as JPG from your gallery.',
    };
  }
}

export function menuImageUploadSizeError(sizeBytes?: number): string {
  if (sizeBytes != null && sizeBytes > 0) return menuImageTooLargeError(sizeBytes);
  return `Image must be ${MENU_PRODUCT_IMAGE_MAX_LABEL} or smaller.`;
}
