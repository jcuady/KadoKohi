import { useEffect, useState } from 'react';

type Props = {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
};

/** Hides broken images instead of showing the browser broken-icon glyph. */
export default function ResilientImage({ src, alt, className, fallbackSrc }: Props) {
  const primary = src.trim();
  const [activeSrc, setActiveSrc] = useState(primary);
  const [failed, setFailed] = useState(!primary);

  useEffect(() => {
    setActiveSrc(primary);
    setFailed(!primary);
  }, [primary]);

  if (failed) return null;

  return (
    <img
      src={activeSrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (fallbackSrc && activeSrc !== fallbackSrc) {
          setActiveSrc(fallbackSrc);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
