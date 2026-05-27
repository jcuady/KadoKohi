import { useMemo, useState } from 'react';
import type { Order, OrderStatus } from '../../types/domain';
import { formatPhp } from '../../lib/money';
import { ORDER_STATUS_LABELS, statusFlowForOrder } from '../../lib/orderStatus';
import OrderPaymentProofPreview from '../admin/OrderPaymentProofPreview';
import OrderTableBadge from '../OrderTableBadge';

type Props = {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onApply: (status: OrderStatus) => void;
  allowCancel?: boolean;
};

export default function OrderStatusModal({ order, open, onClose, onApply, allowCancel = true }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);

  const currentStatus = useMemo(() => order?.status ?? null, [order?.status]);
  const flow = useMemo(() => (order ? statusFlowForOrder(order) : []), [order]);
  const statusValue = selectedStatus ?? currentStatus ?? flow[0] ?? 'pending';
  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/45 p-4 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-[1.75rem] border border-kado-dark/10 bg-white shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-kado-dark/10">
          <h3 className="font-display text-xl font-bold text-kado-dark">Update Order Status</h3>
          <p className="text-xs text-kado-dark/60 mt-1 flex flex-wrap items-center gap-2">
            <span>{order.shortCode} · {order.items.length} item(s)</span>
            <OrderTableBadge order={order} />
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="rounded-xl border border-kado-dark/10 px-4 py-3 text-sm">
            <p className="font-semibold text-kado-dark">{order.items.map((item) => `${item.qty}× ${item.productNameSnapshot}`).join(' · ')}</p>
            <p className="text-kado-dark/60 mt-1">Total: {formatPhp(order.total)}</p>
            <OrderPaymentProofPreview order={order} />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">Status</label>
            <select
              value={statusValue}
              onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
              className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white focus:outline-none focus:ring-2 focus:ring-kado-red/20"
            >
              {flow.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </option>
              ))}
              <option value="cancelled">{ORDER_STATUS_LABELS.cancelled}</option>
            </select>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-kado-dark/10 flex items-center justify-between gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-kado-dark/15 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-kado-dark/60">
            Close
          </button>
          <div className="flex items-center gap-2">
            {allowCancel && order.status !== 'cancelled' && (
              <button
                type="button"
                onClick={() => onApply('cancelled')}
                className="rounded-xl border border-red-200 text-red-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-red-50"
              >
                Cancel order
              </button>
            )}
            <button
              type="button"
              onClick={() => onApply(statusValue)}
              className="rounded-xl bg-kado-red text-kado-cream px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
