import { useEffect, useState } from 'react';
import { resolveDisplayImageUrl, toWebpSrc } from '../../lib/toWebpSrc';
import { displaySizedImage } from '../../lib/supabaseSizedImage';

type Props = {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  width?: number;
  height?: number;
  sizes?: string;
  srcSet?: string;
  /** When set, Supabase storage URLs are rewritten to the render/transform endpoint. */
  displayWidth?: number;
};

function resolveSrc(raw: string, preferWebp: boolean, displayWidth?: number): string {
  const local = resolveDisplayImageUrl(raw);
  const candidate = preferWebp ? toWebpSrc(local) || local : local;
  return displayWidth ? displaySizedImage(candidate, displayWidth) : candidate;
}

/** Hides broken images instead of showing the browser broken-icon glyph. Prefers local WebP. */
export default function ResilientImage({
  src,
  alt,
  className,
  fallbackSrc,
  loading = 'lazy',
  fetchPriority = 'auto',
  width,
  height,
  sizes,
  srcSet,
  displayWidth,
}: Props) {
  const primary = src.trim();
  const [activeSrc, setActiveSrc] = useState(primary);
  const [preferWebp, setPreferWebp] = useState(true);
  const [failed, setFailed] = useState(!primary);

  useEffect(() => {
    setActiveSrc(primary);
    setPreferWebp(true);
    setFailed(!primary);
  }, [primary]);

  if (failed) return null;

  const displaySrc = resolveSrc(activeSrc, preferWebp, displayWidth);

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      width={width}
      height={height}
      sizes={sizes}
      srcSet={srcSet}
      onError={() => {
        if (preferWebp) {
          setPreferWebp(false);
          return;
        }
        if (fallbackSrc && activeSrc !== fallbackSrc) {
          setActiveSrc(fallbackSrc);
          setPreferWebp(true);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
