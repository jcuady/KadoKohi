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

const ALL_CHANNELS = ['online', 'dine-in', 'takeout', 'pos', 'merch'] as const;

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

  const sorted = useMemo(
    () => [...visible].sort(compareOrdersNewestFirst),
    [visible],
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
          <p className="dash-muted text-xs">All orders (newest first). Open a row to set status or cancel.</p>
        </div>
        <Link
          to="/barista"
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-kado-red hover:text-kado-cream transition-colors"
        >
          Board view <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border dash-card p-10 text-center dash-muted text-sm">
          No orders yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => setEditingOrder(o)}
                className="w-full text-left rounded-xl border dash-card px-4 py-3.5 flex flex-wrap items-center gap-3 transition-colors"
              >
                <span className="font-display font-bold dash-heading text-lg shrink-0">{o.shortCode}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-kado-red bg-kado-red/15 px-2 py-0.5 rounded shrink-0">
                  {o.channel}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shrink-0 ${
                  o.status === 'completed' ? 'dash-card-alt dash-muted' : 'dash-card-alt dash-heading'
                }`}>
                  {o.status}
                </span>
                {user?.role === 'admin' && (
                  <span className="text-[10px] dash-muted truncate max-w-[140px]">{branchLabel(o.branchId)}</span>
                )}
                {o.guestName && (
                  <span className="text-[10px] dash-muted">{o.guestName}</span>
                )}
                <span className="ml-auto shrink-0">
                  <OrderPlacedAt createdAt={o.createdAt} />
                </span>
                <span className="w-full sm:w-auto sm:ml-auto font-display font-bold text-kado-red text-sm">{formatPhp(o.total)}</span>
                <p className="w-full text-xs dash-muted truncate">
                  {o.items.map((i) => `${i.qty}× ${i.productNameSnapshot}`).join(' · ')}
                </p>
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
