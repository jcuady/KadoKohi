import { useEffect, useState } from 'react';
import { toWebpSrc } from '../../lib/toWebpSrc';

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
};

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

  const webp = toWebpSrc(activeSrc);
  const displaySrc = preferWebp ? webp : activeSrc;

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
      onError={() => {
        if (preferWebp && webp !== activeSrc) {
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
