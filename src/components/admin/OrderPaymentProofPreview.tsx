import type { Order } from '../../types/domain';
import { isGcashOrder } from '../../lib/orderStatus';
import { usePaymentProofDisplayUrl } from '../../hooks/usePaymentProofDisplayUrl';

type Props = {
  order: Order;
  className?: string;
};

export default function OrderPaymentProofPreview({ order, className = '' }: Props) {
  const { url, loading, failed } = usePaymentProofDisplayUrl(order.paymentProofImage);

  if (!isGcashOrder(order) || !order.paymentProofImage) return null;

  return (
    <div className={`flex items-start gap-3 mt-2 ${className}`}>
      <div className="shrink-0 w-14 h-14 rounded-lg border border-kado-dark/10 overflow-hidden bg-kado-offwhite flex items-center justify-center">
        {loading ? (
          <span className="text-[8px] font-bold uppercase tracking-widest text-kado-dark/40">…</span>
        ) : url && !failed ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <img
              src={url}
              alt="Payment proof"
              className="w-14 h-14 object-cover hover:ring-2 hover:ring-kado-red/30"
              onError={() => {
                /* hook will not re-run; parent may refresh order */
              }}
            />
          </a>
        ) : (
          <span className="text-[8px] font-bold uppercase tracking-widest text-amber-700 text-center px-1">
            Unavailable
          </span>
        )}
      </div>
      <div className="text-xs dash-muted">
        <p className="font-bold dash-heading">GCash proof</p>
        {order.paymentProofUploadedAt && (
          <p>{new Date(order.paymentProofUploadedAt).toLocaleString('en-PH')}</p>
        )}
        {failed && (
          <p className="text-amber-700 mt-0.5">
            Image missing or expired. Ask the customer to upload proof again.
          </p>
        )}
        {url && !failed && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-kado-red hover:underline mt-0.5 inline-block"
          >
            View full image
          </a>
        )}
      </div>
    </div>
  );
}
