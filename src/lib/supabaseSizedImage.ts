/**
 * Supabase Storage image helpers.
 *
 * Image Transformation (`/storage/v1/render/image/...`) is NOT enabled on the
 * Kado production project (403 FeatureNotEnabled). Rewriting object URLs to
 * the render endpoint breaks every thumbnail/preview. Until transforms are
 * enabled in the dashboard, always return the original public object URL.
 *
 * Opt-in later via `VITE_SUPABASE_IMAGE_TRANSFORM=true` once the feature is on.
 */

const OBJECT_PUBLIC = '/storage/v1/object/public/';
const RENDER_PUBLIC = '/storage/v1/render/image/public/';

export type SizedImageOpts = {
  width: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
};

function transformsEnabled(): boolean {
  try {
    return import.meta.env.VITE_SUPABASE_IMAGE_TRANSFORM === 'true';
  } catch {
    return false;
  }
}

export function supabaseSizedImage(src: string, opts: SizedImageOpts): string {
  const value = src.trim();
  if (!value || !value.includes(OBJECT_PUBLIC)) return value;
  if (!transformsEnabled()) return value;

  try {
    const rendered = value.replace(OBJECT_PUBLIC, RENDER_PUBLIC);
    const url = new URL(rendered);
    url.searchParams.set('width', String(opts.width));
    if (opts.height) url.searchParams.set('height', String(opts.height));
    url.searchParams.set('quality', String(opts.quality ?? 75));
    url.searchParams.set('resize', opts.resize ?? 'contain');
    return url.toString();
  } catch {
    return value;
  }
}

/** Prefer a display-sized Supabase transform when enabled; otherwise original URL. */
export function displaySizedImage(src: string, width: number, quality = 75): string {
  return supabaseSizedImage(src, { width, quality });
}
