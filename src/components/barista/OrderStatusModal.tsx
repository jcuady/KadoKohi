import { useMemo, useState } from 'react';
import type { Order, OrderStatus, PaymentStatus } from '../../types/domain';
import { formatPhp } from '../../lib/money';
import {
  ALL_ORDER_STATUSES,
  ALL_PAYMENT_STATUSES,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABELS,
  fulfillmentFlowForOrder,
  isGcashOrder,
} from '../../lib/orderStatus';
import OrderPaymentProofPreview from '../admin/OrderPaymentProofPreview';
import OrderTableBadge from '../OrderTableBadge';

type Props = {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onApply: (patch: { status?: OrderStatus; paymentStatus?: PaymentStatus }) => void;
  allowCancel?: boolean;
};

export default function OrderStatusModal({ order, open, onClose, onApply, allowCancel = true }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | null>(null);

  const currentStatus = useMemo(() => order?.status ?? null, [order?.status]);
  const currentPaymentStatus = useMemo(() => order?.paymentStatus ?? null, [order?.paymentStatus]);
  const fulfillmentFlow = useMemo(() => (order ? fulfillmentFlowForOrder(order) : []), [order]);
  const statusValue = selectedStatus ?? currentStatus ?? fulfillmentFlow[0] ?? 'pending';
  const paymentValue = selectedPaymentStatus ?? currentPaymentStatus ?? 'unpaid';
  const gcash = order ? isGcashOrder(order) : false;

  // Prevent completing a GCash order that has not been paid yet.
  const unpaidGcashCompletion =
    gcash && statusValue === 'completed' && paymentValue !== 'paid';

  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/45 p-4 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-[1.75rem] border border-kado-dark/10 bg-white shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-kado-dark/10">
          <h3 className="font-display text-xl font-bold text-kado-dark">Update order</h3>
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

          {gcash && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">
                Payment status
              </label>
              <select
                value={paymentValue}
                onChange={(e) => setSelectedPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white focus:outline-none focus:ring-2 focus:ring-kado-red/20"
              >
                {ALL_PAYMENT_STATUSES.map((ps) => (
                  <option key={ps} value={ps}>
                    {PAYMENT_STATUS_LABELS[ps]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">
              Order status
            </label>
            <select
              value={statusValue}
              onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
              className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white focus:outline-none focus:ring-2 focus:ring-kado-red/20"
            >
              {fulfillmentFlow.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </option>
              ))}
              <option value="cancelled">{ORDER_STATUS_LABELS.cancelled}</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
            <span className={`px-2.5 py-1 rounded-full border ${PAYMENT_STATUS_BADGE[order.paymentStatus]}`}>
              Pay: {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </span>
            <span className={`px-2.5 py-1 rounded-full border ${ORDER_STATUS_BADGE[order.status]}`}>
              Order: {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>

          {unpaidGcashCompletion && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-semibold text-amber-800">
              ⚠ Payment must be verified (set to <strong>Paid</strong>) before marking this order as Completed.
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-kado-dark/10 flex items-center justify-between gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-kado-dark/15 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-kado-dark/60">
            Close
          </button>
          <div className="flex items-center gap-2">
            {allowCancel && order.status !== 'cancelled' && (
              <button
                type="button"
                onClick={() => onApply({ status: 'cancelled' })}
                className="rounded-xl border border-red-200 text-red-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-red-50"
              >
                Cancel order
              </button>
            )}
            <button
              type="button"
              disabled={unpaidGcashCompletion}
              onClick={() =>
                onApply({
                  status: statusValue,
                  ...(gcash ? { paymentStatus: paymentValue } : {}),
                })
              }
              className="rounded-xl bg-kado-red text-kado-cream px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
