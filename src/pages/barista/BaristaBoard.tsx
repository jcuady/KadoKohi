import { useMemo, useState } from 'react';
import type { Order, OrderStatus, PaymentStatus } from '../../types/domain';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { formatPhp } from '../../lib/money';
import { kioskColumnKey, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '../../lib/orderStatus';
import { Clock, ChefHat, CheckCircle2, Wallet, AlertCircle } from 'lucide-react';
import OrderStatusModal from '../../components/barista/OrderStatusModal';
import OrderPaymentProofPreview from '../../components/admin/OrderPaymentProofPreview';
import OrderTableBadge from '../../components/OrderTableBadge';

const ALL_CHANNELS = ['online', 'dine-in', 'takeout', 'pos'] as const;

type BoardColumn = {
  id: NonNullable<ReturnType<typeof kioskColumnKey>>;
  label: string;
  icon: typeof Clock;
  color: string;
  bgCard: string;
};

const COLUMNS: BoardColumn[] = [
  { id: 'awaiting_payment', label: 'Awaiting payment', icon: Wallet, color: 'text-amber-400', bgCard: 'border-amber-500/30' },
  { id: 'paid_queue', label: 'Paid · queue', icon: Clock, color: 'text-sky-400', bgCard: 'border-sky-500/30' },
  { id: 'preparing', label: ORDER_STATUS_LABELS.preparing, icon: ChefHat, color: 'text-orange-400', bgCard: 'border-orange-500/30' },
  { id: 'ready', label: ORDER_STATUS_LABELS.ready, icon: CheckCircle2, color: 'text-green-400', bgCard: 'border-green-500/30' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

export default function BaristaBoard() {
  const user = useAuthStore((s) => s.user);
  const orders = useOrderStore((s) => s.orders);
  const updateOrderStatus = useOrderStore((s) => s.updateOrderStatus);
  const updatePaymentStatus = useOrderStore((s) => s.updatePaymentStatus);
  const branches = useBranchStore((s) => s.branches);

  const visible = useMemo(() => {
    if (user?.role === 'admin') {
      return orders.filter((o) => ALL_CHANNELS.includes(o.channel as (typeof ALL_CHANNELS)[number]));
    }
    if (user?.role === 'barista' && user.branchId) {
      return orders.filter(
        (o) => o.branchId === user.branchId && ALL_CHANNELS.includes(o.channel as (typeof ALL_CHANNELS)[number]),
      );
    }
    return [];
  }, [orders, user]);

  const branchLabel = (id: string) => branches.find((b) => b.id === id)?.name ?? id;
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [patchError, setPatchError] = useState<string | null>(null);

  const applyPatch = async (patch: { status?: OrderStatus; paymentStatus?: PaymentStatus }) => {
    if (!editingOrder) return;
    setPatchError(null);
    if (patch.status) {
      const err = await updateOrderStatus(editingOrder.id, patch.status);
      if (err) { setPatchError(err); return; }
    }
    if (patch.paymentStatus) {
      const payErr = await updatePaymentStatus(editingOrder.id, patch.paymentStatus);
      if (payErr) { setPatchError(payErr); return; }
    }
    setEditingOrder(null);
  };

  return (
    <div className="dash-page p-4 md:p-6 h-full flex flex-col">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold dash-heading">Order Board</h1>
          <p className="dash-muted text-xs mt-1">
            {user?.role === 'admin'
              ? 'All branches · all channels'
              : `Branch: ${user?.branchId ? branchLabel(user.branchId) : '—'}`}
            {' · '}Payment and order status are updated separately.
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 min-h-0">
        {COLUMNS.map((col) => {
          const colOrders = visible.filter((o) => kioskColumnKey(o) === col.id);
          const Icon = col.icon;
          return (
            <div key={col.id} className="flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Icon className={`w-5 h-5 ${col.color}`} />
                <span className="font-bold text-sm uppercase tracking-wider dash-muted">{col.label}</span>
                <span className="ml-auto text-xs font-bold dash-card-alt dash-muted px-2 py-0.5 rounded-full">
                  {colOrders.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {colOrders.length === 0 ? (
                  <div className="rounded-xl border dash-card-alt dash-border p-6 text-center dash-muted text-xs">
                    Empty
                  </div>
                ) : (
                  colOrders.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setEditingOrder(o)}
                      className={`w-full text-left rounded-xl border dash-card ${col.bgCard} p-4 transition-colors`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display font-bold dash-heading text-lg">{o.shortCode}</span>
                        <span className="text-[10px] dash-muted">{timeAgo(o.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-kado-red bg-kado-red/15 px-2 py-0.5 rounded">
                          {o.channel}
                        </span>
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/10">
                          {PAYMENT_STATUS_LABELS[o.paymentStatus]}
                        </span>
                        <OrderTableBadge order={o} variant="dash" />
                        {o.guestName && (
                          <span className="text-[9px] font-bold dash-muted dash-card-alt px-2 py-0.5 rounded">
                            {o.guestName}
                          </span>
                        )}
                        {user?.role === 'admin' && (
                          <span className="text-[9px] dash-muted">{branchLabel(o.branchId)}</span>
                        )}
                      </div>
                      <ul className="text-xs dash-muted space-y-0.5">
                        {o.items.slice(0, 4).map((item) => (
                          <li key={item.id}>
                            {item.qty}× {item.productNameSnapshot}
                          </li>
                        ))}
                      </ul>
                      <OrderPaymentProofPreview order={o} />
                      <div className="mt-2 text-right">
                        <span className="font-display font-bold text-kado-red text-sm">{formatPhp(o.total)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <OrderStatusModal
        open={!!editingOrder}
        order={editingOrder}
        onClose={() => { setEditingOrder(null); setPatchError(null); }}
        onApply={applyPatch}
      />
      {patchError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 rounded-xl bg-red-600 text-white px-5 py-3 text-sm font-semibold shadow-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {patchError}
          <button onClick={() => setPatchError(null)} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
        </div>
      )}
    </div>
  );
}
