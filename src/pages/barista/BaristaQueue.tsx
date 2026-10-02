import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Order, OrderStatus, PaymentStatus } from '../../types/domain';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { formatPhp } from '../../lib/money';
import { ChevronRight, AlertCircle } from 'lucide-react';
import OrderStatusModal from '../../components/barista/OrderStatusModal';
import OrderPlacedAt from '../../components/OrderPlacedAt';
import { compareOrdersNewestFirst } from '../../lib/orderTime';
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABELS,
} from '../../lib/orderStatus';
import { dashChipClass } from '../../lib/overlayTheme';

const ALL_CHANNELS = ['online', 'dine-in', 'takeout', 'pos', 'merch'] as const;

type QueueFilter = 'active' | 'completed' | 'cancelled' | 'all';

const FILTERS: { id: QueueFilter; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all', label: 'All' },
];

function queueBucket(o: Order): Exclude<QueueFilter, 'all'> {
  if (o.status === 'cancelled') return 'cancelled';
  if (o.status === 'completed' || o.status === 'served') return 'completed';
  return 'active';
}

export default function BaristaQueue() {
  const user = useAuthStore((s) => s.user);
  const orders = useOrderStore((s) => s.orders);
  const hydrateForBarista = useOrderStore((s) => s.hydrateForBarista);
  const updateOrderStatus = useOrderStore((s) => s.updateOrderStatus);
  const updatePaymentStatus = useOrderStore((s) => s.updatePaymentStatus);
  const branches = useBranchStore((s) => s.branches);

  useEffect(() => {
    if (user?.role === 'barista' && user.branchId) {
      void hydrateForBarista(user.branchId);
    }
  }, [user?.role, user?.branchId, hydrateForBarista]);

  const visible = useMemo(() => {
    const filtered = orders.filter((o) => ALL_CHANNELS.includes(o.channel as (typeof ALL_CHANNELS)[number]));
    if (user?.role === 'admin') return filtered;
    if (user?.role === 'barista' && user.branchId) {
      return filtered.filter((o) => o.branchId === user.branchId);
    }
    return [];
  }, [orders, user]);

  const [filter, setFilter] = useState<QueueFilter>('active');
  const counts = useMemo(() => {
    const c = { active: 0, completed: 0, cancelled: 0, all: visible.length } as Record<QueueFilter, number>;
    for (const o of visible) c[queueBucket(o)] += 1;
    return c;
  }, [visible]);
  const sorted = useMemo(
    () =>
      visible
        .filter((o) => filter === 'all' || queueBucket(o) === filter)
        .sort(compareOrdersNewestFirst),
    [visible, filter],
  );
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [patchError, setPatchError] = useState<string | null>(null);

  const branchLabel = (id: string) => branches.find((b) => b.id === id)?.name ?? id;

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
    <div className="dash-page max-w-4xl p-3 sm:p-4 md:p-8">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold dash-heading mb-1 sm:text-3xl">Queue</h1>
          <p className="dash-muted text-xs">Newest first. Tap an order to change its status or cancel it.</p>
        </div>
        <Link
          to="/barista"
          className="inline-flex min-h-[44px] items-center gap-1 self-start rounded-full border-2 dash-border px-4 text-xs font-bold uppercase tracking-wider text-kado-red transition-colors hover:border-kado-red/40 sm:self-auto"
        >
          Board view <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="tablist" aria-label="Filter orders">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`${dashChipClass(filter === f.id)} whitespace-nowrap`}
          >
            {f.label}
            <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${filter === f.id ? 'bg-white/20' : 'dash-card'}`}>
              {counts[f.id]}
            </span>
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border dash-card p-10 text-center dash-muted text-sm">
          {filter === 'active' ? 'No active orders. New ones appear here automatically.' : 'No orders here.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => setEditingOrder(o)}
                className="w-full space-y-2 rounded-xl border dash-card px-4 py-3.5 text-left transition-colors hover:border-kado-red/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red/40"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-display font-bold dash-heading text-lg">{o.shortCode}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-kado-red bg-kado-red/15 px-2 py-0.5 rounded">
                      {o.channel}
                    </span>
                  </span>
                  <span className="shrink-0">
                    <OrderPlacedAt createdAt={o.createdAt} />
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${ORDER_STATUS_BADGE[o.status]}`}>
                    {ORDER_STATUS_LABELS[o.status]}
                  </span>
                  {o.paymentStatus !== 'paid' && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${PAYMENT_STATUS_BADGE[o.paymentStatus]}`}>
                      {PAYMENT_STATUS_LABELS[o.paymentStatus]}
                    </span>
                  )}
                  {user?.role === 'admin' && (
                    <span className="text-[10px] dash-muted truncate max-w-[140px]">{branchLabel(o.branchId)}</span>
                  )}
                  {o.guestName && <span className="text-[11px] dash-muted">{o.guestName}</span>}
                </span>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-xs dash-muted">
                    {o.items.map((i) => `${i.qty}× ${i.productNameSnapshot}`).join(' · ')}
                  </span>
                  <span className="shrink-0 font-display font-bold text-kado-red text-sm">{formatPhp(o.total)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <OrderStatusModal
        open={!!editingOrder}
        order={editingOrder}
        onClose={() => { setEditingOrder(null); setPatchError(null); }}
        onApply={applyPatch}
      />
      {patchError && (
        <div className="dash-toast-bottom fixed z-[200] flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-xl sm:px-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {patchError}
          <button onClick={() => setPatchError(null)} className="ml-2 text-white/70 hover:text-white text-xs">✕</button>
        </div>
      )}
    </div>
  );
}
