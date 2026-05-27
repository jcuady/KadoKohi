import type { Order } from '../../types/domain';
import { isGcashOrder } from '../../lib/orderStatus';

type Props = {
  order: Order;
  className?: string;
};

export default function OrderPaymentProofPreview({ order, className = '' }: Props) {
  if (!isGcashOrder(order) || !order.paymentProofImage) return null;

  return (
    <div className={`flex items-start gap-3 mt-2 ${className}`}>
      <a href={order.paymentProofImage} target="_blank" rel="noopener noreferrer" className="shrink-0">
        <img
          src={order.paymentProofImage}
          alt="Payment proof"
          className="w-14 h-14 rounded-lg object-cover border border-kado-dark/10 hover:ring-2 hover:ring-kado-red/30"
        />
      </a>
      <div className="text-xs dash-muted">
        <p className="font-bold dash-heading">GCash proof</p>
        {order.paymentProofUploadedAt && (
          <p>{new Date(order.paymentProofUploadedAt).toLocaleString('en-PH')}</p>
        )}
        <a
          href={order.paymentProofImage}
          target="_blank"
          rel="noopener noreferrer"
          className="text-kado-red hover:underline mt-0.5 inline-block"
        >
          View full image
        </a>
      </div>
    </div>
  );
}
