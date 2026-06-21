import { useMemo, useState, useEffect } from 'react';
import type { Order, OrderStatus, PaymentStatus } from '../../types/domain';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { formatPhp } from '../../lib/money';
import { compareOrdersNewestFirst, formatOrderTimestamp } from '../../lib/orderTime';
import { kioskColumnKey, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_BADGE } from '../../lib/orderStatus';
import { Clock, ChefHat, CheckCircle2, Wallet, AlertCircle } from 'lucide-react';
import OrderStatusModal from '../../components/barista/OrderStatusModal';
import OrderPaymentProofPreview from '../../components/admin/OrderPaymentProofPreview';
import OrderTableBadge from '../../components/OrderTableBadge';

const ALL_CHANNELS = ['online', 'dine-in', 'takeout', 'pos', 'merch'] as const;

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

export default function BaristaBoard() {
  const user = useAuthStore((s) => s.user);
  const orders = useOrderStore((s) => s.orders);
  const hydrateError = useOrderStore((s) => s.hydrateError);
  const hydrateForBarista = useOrderStore((s) => s.hydrateForBarista);
  const updateOrderFields = useOrderStore((s) => s.updateOrderFields);
  const branches = useBranchStore((s) => s.branches);

  useEffect(() => {
    if (user?.role === 'barista' && user.branchId) {
      void hydrateForBarista(user.branchId);
    }
  }, [user?.role, user?.branchId, hydrateForBarista]);

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
    const err = await updateOrderFields(editingOrder.id, patch);
    if (err) {
      setPatchError(err);
      return;
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
            {' · '}Newest orders appear at the top of each column.
          </p>
        </div>
      </div>

      {hydrateError && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{hydrateError}</span>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 min-h-0">
        {COLUMNS.map((col) => {
          const colOrders = visible
            .filter((o) => kioskColumnKey(o) === col.id)
            .sort(compareOrdersNewestFirst);
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
                  colOrders.map((o) => {
                    const placed = formatOrderTimestamp(o.createdAt);
                    return (
                    <div
                      key={o.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setEditingOrder(o)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setEditingOrder(o);
                        }
                      }}
                      className={`w-full text-left rounded-xl border dash-card ${col.bgCard} p-4 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red/40`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-display font-bold dash-heading text-lg">{o.shortCode}</span>
                        <div className="text-right shrink-0">
                          <span className="block text-[10px] font-semibold dash-heading tabular-nums leading-tight">
                            {placed.clock}
                          </span>
                          <span className="block text-[9px] dash-muted leading-tight">{placed.relative}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-kado-red bg-kado-red/15 px-2 py-0.5 rounded">
                          {o.channel}
                        </span>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${PAYMENT_STATUS_BADGE[o.paymentStatus]}`}>
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
                    </div>
                    );
                  })
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
