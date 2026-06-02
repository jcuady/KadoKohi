import { useEffect, useState } from 'react';
import { createBrandedQrPreviewUrl, type BrandedQrCardInput } from '../../lib/brandedQrCard';
import { qrImageUrl } from '../../lib/qr';

type Props = BrandedQrCardInput & {
  className?: string;
};

/** Live branded QR card preview (falls back to plain QR while loading). */
export default function BrandedQrPreview({ className = '', layout = 'table', ...input }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const cardInput: BrandedQrCardInput = { layout, ...input };

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    setFailed(false);
    setPreviewUrl(null);

    void createBrandedQrPreviewUrl(cardInput)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        revoked = url;
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [layout, input.title, input.subtitle, input.scanUrl, input.tagline]);

  const fallback = qrImageUrl(input.scanUrl, layout === 'takeout' ? 240 : 280);
  const aspectClass = layout === 'takeout' ? 'aspect-[2/3]' : 'aspect-square';

  return (
    <img
      src={previewUrl ?? fallback}
      alt={`Branded QR for ${input.title}`}
      className={`${className} ${aspectClass} w-full object-contain ${
        !previewUrl && !failed ? 'opacity-60 animate-pulse' : ''
      }`}
    />
  );
}
