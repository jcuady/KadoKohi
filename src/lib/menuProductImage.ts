const DRIVE_FILE_RE = /drive\.google\.com\/file\/d\/([^/]+)/i;
const DRIVE_OPEN_RE = /drive\.google\.com\/open\?id=([^&]+)/i;
const SUPABASE_MENU_BUCKET_PATH = /\/storage\/v1\/object\/public\/kado-menu-images\//i;

/** Max upload size for menu product photos (matches storage bucket). */
export const MENU_PRODUCT_IMAGE_MAX_BYTES = 5_242_880;

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
