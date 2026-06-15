import { useState, type MouseEvent } from 'react';
import type { Order } from '../../types/domain';
import { isGcashOrder } from '../../lib/orderStatus';
import { usePaymentProofDisplayUrl } from '../../hooks/usePaymentProofDisplayUrl';
import PaymentProofLightbox from '../PaymentProofLightbox';

type Props = {
  order: Order;
  className?: string;
};

export default function OrderPaymentProofPreview({ order, className = '' }: Props) {
  const { url, loading, failed } = usePaymentProofDisplayUrl(order.paymentProofImage);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!isGcashOrder(order) || !order.paymentProofImage) return null;

  const uploadedLabel = order.paymentProofUploadedAt
    ? new Date(order.paymentProofUploadedAt).toLocaleString('en-PH')
    : undefined;

  const openLightbox = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (url && !failed) setLightboxOpen(true);
  };

  return (
    <>
      <div
        className={`flex items-start gap-3 mt-2 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 w-14 h-14 rounded-lg border border-kado-dark/10 overflow-hidden bg-kado-offwhite flex items-center justify-center">
          {loading ? (
            <span className="text-[8px] font-bold uppercase tracking-widest text-kado-dark/40">…</span>
          ) : url && !failed ? (
            <button
              type="button"
              onClick={openLightbox}
              className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red/40"
              title="View payment proof"
            >
              <img
                src={url}
                alt="Payment proof thumbnail"
                className="h-full w-full object-cover hover:opacity-90"
              />
            </button>
          ) : (
            <span className="text-[8px] font-bold uppercase tracking-widest text-amber-700 text-center px-1">
              Unavailable
            </span>
          )}
        </div>
        <div className="text-xs dash-muted">
          <p className="font-bold dash-heading">GCash proof</p>
          {uploadedLabel && <p>{uploadedLabel}</p>}
          {failed && (
            <p className="text-amber-700 mt-0.5">
              Image missing or expired. Ask the customer to upload proof again.
            </p>
          )}
          {url && !failed && (
            <button
              type="button"
              onClick={openLightbox}
              className="text-kado-red hover:underline mt-0.5 inline-block text-left font-semibold"
            >
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
          title={`GCash proof · ${order.shortCode}`}
          subtitle={uploadedLabel}
        />
      )}
    </>
  );
}
