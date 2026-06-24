import { useState, type MouseEvent } from 'react';
import type { BoothBooking } from '../../types/domain';
import { usePaymentProofDisplayUrl } from '../../hooks/usePaymentProofDisplayUrl';
import PaymentProofLightbox from '../PaymentProofLightbox';

type Props = {
  booking: BoothBooking;
  className?: string;
};

export default function BoothPaymentProofPreview({ booking, className = '' }: Props) {
  const { url, loading, failed } = usePaymentProofDisplayUrl(booking.paymentProofImage);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!booking.paymentProofImage) return null;

  const uploadedLabel = booking.paymentProofUploadedAt
    ? new Date(booking.paymentProofUploadedAt).toLocaleString('en-PH')
    : undefined;

  const openLightbox = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (url && !failed) setLightboxOpen(true);
  };

  return (
    <>
      <div className={`flex items-start gap-3 mt-2 ${className}`} onClick={(e) => e.stopPropagation()}>
        <div className="shrink-0 w-14 h-14 rounded-lg border dash-border overflow-hidden bg-kado-offwhite flex items-center justify-center">
          {loading ? (
            <span className="text-[8px] font-bold uppercase tracking-widest dash-muted">…</span>
          ) : url && !failed ? (
            <button type="button" onClick={openLightbox} className="block h-full w-full">
              <img src={url} alt="Payment proof" className="h-full w-full object-cover" />
            </button>
          ) : (
            <span className="text-[8px] font-bold uppercase tracking-widest text-amber-700 text-center px-1">
              Unavailable
            </span>
          )}
        </div>
        <div className="text-xs dash-muted">
          <p className="font-bold dash-heading">Payment proof</p>
          {uploadedLabel && <p>{uploadedLabel}</p>}
          {url && !failed && (
            <button type="button" onClick={openLightbox} className="text-kado-red hover:underline mt-0.5 font-semibold">
              View full image
            </button>
          )}
        </div>
      </div>

      {url && !failed && (
        <PaymentProofLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageUrl={url}
          title={`Payment proof · ${booking.shortCode}`}
          subtitle={uploadedLabel}
        />
      )}
    </>
  );
}
