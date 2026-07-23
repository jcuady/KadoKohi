/**
 * Supabase Storage image transform (render endpoint).
 * Falls back to the original URL when the path isn't a public storage object.
 */
const OBJECT_PUBLIC = '/storage/v1/object/public/';
const RENDER_PUBLIC = '/storage/v1/render/image/public/';

export type SizedImageOpts = {
  width: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
};

export function supabaseSizedImage(src: string, opts: SizedImageOpts): string {
  const value = src.trim();
  if (!value || !value.includes(OBJECT_PUBLIC)) return value;

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

/** Prefer a display-sized Supabase transform; leave local / data URLs alone. */
export function displaySizedImage(src: string, width: number, quality = 75): string {
  return supabaseSizedImage(src, { width, quality });
}
