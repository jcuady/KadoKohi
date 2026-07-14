/**
 * Prefer local WebP for known public raster assets (hot-path optimization).
 * Leaves remote/CMS/data-URLs untouched.
 */
const LOCAL_PATH = /^\//;
const RASTER_EXT = /\.(jpe?g|png)$/i;

export function toWebpSrc(src: string | undefined | null): string {
  const value = (src ?? '').trim();
  if (!value || !LOCAL_PATH.test(value)) return value;
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }
  const pathOnly = value.split('?')[0] ?? value;
  if (!RASTER_EXT.test(pathOnly)) return value;
  return value.replace(RASTER_EXT, '.webp');
}

export function webpSrcSet(src: string | undefined | null): string | undefined {
  const webp = toWebpSrc(src);
  if (!webp || webp === src) return undefined;
  return `${webp} 1x`;
}
