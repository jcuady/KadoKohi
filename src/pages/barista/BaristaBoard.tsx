import { useMemo, useState, useEffect, type MouseEvent } from 'react';
import type { Order, OrderStatus, PaymentStatus } from '../../types/domain';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { formatPhp } from '../../lib/money';
import { compareOrdersNewestFirst, formatOrderTimestamp } from '../../lib/orderTime';
import {
  awaitsGatewayPayment,
  kioskColumnKey,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_BADGE,
} from '../../lib/orderStatus';
import { Clock, ChefHat, CheckCircle2, Wallet, AlertCircle, Loader2, ArrowRight, type LucideIcon } from 'lucide-react';
import OrderStatusModal from '../../components/barista/OrderStatusModal';
import OrderPaymentProofPreview from '../../components/admin/OrderPaymentProofPreview';
import OrderTableBadge from '../../components/OrderTableBadge';

const ALL_CHANNELS = ['online', 'dine-in', 'takeout', 'pos', 'merch'] as const;

type ColumnId = NonNullable<ReturnType<typeof kioskColumnKey>>;

type BoardColumn = {
  id: ColumnId;
  label: string;
  short: string;
  hint: string;
  icon: LucideIcon;
  color: string;
  bgCard: string;
};

const COLUMNS: BoardColumn[] = [
  { id: 'awaiting_payment', label: 'Awaiting payment', short: 'To pay', hint: 'Check payment, then confirm.', icon: Wallet, color: 'text-amber-500', bgCard: 'border-amber-500/30' },
  { id: 'paid_queue', label: 'Paid · queue', short: 'Paid', hint: 'Paid and waiting. Start when you begin making it.', icon: Clock, color: 'text-sky-500', bgCard: 'border-sky-500/30' },
  { id: 'preparing', label: ORDER_STATUS_LABELS.preparing, short: 'Preparing', hint: 'Being made. Mark ready when it is on the counter.', icon: ChefHat, color: 'text-orange-500', bgCard: 'border-orange-500/30' },
  { id: 'ready', label: ORDER_STATUS_LABELS.ready, short: 'Ready', hint: 'Waiting for pickup. Complete once handed over.', icon: CheckCircle2, color: 'text-green-600', bgCard: 'border-green-500/30' },
];

type QuickAction = { label: string; patch: { status?: OrderStatus; paymentStatus?: PaymentStatus } };

/** The single next step for a card, or null when only the full editor makes sense. */
function quickActionFor(order: Order, column: ColumnId): QuickAction | null {
  switch (column) {
    case 'awaiting_payment':
      if (order.paymentStatus === 'proof_submitted') return { label: 'Confirm payment', patch: { paymentStatus: 'paid' } };
      if (!awaitsGatewayPayment(order)) return { label: 'Mark paid', patch: { paymentStatus: 'paid' } };
      return null;
    case 'paid_queue':
      return { label: 'Start preparing', patch: { status: 'preparing' } };
    case 'preparing':
      return { label: 'Mark ready', patch: { status: 'ready' } };
    case 'ready':
      return { label: 'Complete', patch: { status: 'completed' } };
  }
}

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

  const byColumn = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c.id, [] as Order[]])) as Record<ColumnId, Order[]>;
    for (const o of visible) {
      const key = kioskColumnKey(o);
      if (key) map[key].push(o);
    }
    for (const c of COLUMNS) map[c.id].sort(compareOrdersNewestFirst);
    return map;
  }, [visible]);

  const branchLabel = (id: string) => branches.find((b) => b.id === id)?.name ?? id;
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<ColumnId | null>(null);
  const activeTab = tab ?? COLUMNS.find((c) => byColumn[c.id].length > 0)?.id ?? 'awaiting_payment';

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

  const runQuick = async (e: MouseEvent, order: Order, action: QuickAction) => {
    e.stopPropagation();
    if (busyId) return;
    setBusyId(order.id);
    setPatchError(null);
    const err = await updateOrderFields(order.id, action.patch);
    setBusyId(null);
    if (err) setPatchError(`${order.shortCode}: ${err}`);
  };

  return (
    <div className="dash-page flex h-full min-h-0 flex-col p-3 sm:p-4 md:p-6">
      <div className="mb-3 flex items-start justify-between gap-3 md:mb-5 md:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold dash-heading sm:text-2xl md:text-3xl">Order Board</h1>
          <p className="dash-muted text-xs mt-1">
            {user?.role === 'admin'
              ? 'All branches · all channels'
              : `Branch: ${user?.branchId ? branchLabel(user.branchId) : '—'}`}
            {' · '}Tap the button on a card for the next step, or the card for details.
          </p>
        </div>
      </div>

      {hydrateError && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{hydrateError}</span>
        </div>
      )}

      {/* Phones + tablets: one stage at a time so Paid / Making / Ready are never buried below Awaiting payment. */}
      <div
        role="tablist"
        aria-label="Order stage"
        className="sticky top-0 z-10 -mx-3 mb-3 grid grid-cols-4 gap-1 border-b dash-border bg-[var(--color-dash-bg)] px-3 pb-2 pt-1 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 lg:hidden"
      >
        {COLUMNS.map((col) => {
          const Icon = col.icon;
          const active = activeTab === col.id;
          const count = byColumn[col.id].length;
          return (
            <button
              key={col.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`board-col-${col.id}`}
              onClick={() => setTab(col.id)}
              className={[
                'flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-bold transition-colors touch-manipulation sm:flex-row sm:gap-2 sm:text-xs',
                active
                  ? 'bg-kado-red text-white shadow-sm shadow-kado-red/20'
                  : 'dash-card-alt text-[var(--color-dash-text-muted)] hover:text-[var(--color-dash-text)]',
              ].join(' ')}
            >
              <span className="flex items-center gap-1">
                <Icon className={`h-4 w-4 ${active ? 'text-white' : col.color}`} aria-hidden />
                <span className="tabular-nums">{count}</span>
              </span>
              <span className="max-w-full truncate">{col.short}</span>
            </button>
          );
        })}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const colOrders = byColumn[col.id];
          const Icon = col.icon;
          return (
            <div
              key={col.id}
              id={`board-col-${col.id}`}
              role="tabpanel"
              className={`min-h-0 flex-col ${activeTab === col.id ? 'flex' : 'hidden'} lg:flex`}
            >
              <div className="mb-3 hidden items-center gap-2 px-1 lg:flex">
                <Icon className={`w-5 h-5 ${col.color}`} />
                <span className="font-bold text-sm uppercase tracking-wider dash-muted">{col.label}</span>
                <span className="ml-auto text-xs font-bold dash-card-alt dash-muted px-2 py-0.5 rounded-full">
                  {colOrders.length}
                </span>
              </div>
              <p className="mb-2 px-1 text-xs dash-muted lg:hidden">{col.hint}</p>
              <div className="grid flex-1 content-start gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1">
                {colOrders.length === 0 ? (
                  <div className="rounded-xl border dash-card-alt dash-border p-6 text-center dash-muted text-xs sm:col-span-2 lg:col-span-1">
                    No orders here right now.
                  </div>
                ) : (
                  colOrders.map((o) => {
                    const placed = formatOrderTimestamp(o.createdAt);
                    const action = quickActionFor(o, col.id);
                    const busy = busyId === o.id;
                    return (
                    <div
                      key={o.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setEditingOrder(o)}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setEditingOrder(o);
                        }
                      }}
                      aria-label={`Order ${o.shortCode}, open details`}
                      className={`flex w-full flex-col text-left rounded-xl border dash-card ${col.bgCard} p-4 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red/40`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-display font-bold dash-heading text-lg">{o.shortCode}</span>
                        <div className="text-right shrink-0">
                          <span className="block text-[11px] font-semibold dash-heading tabular-nums leading-tight">
                            {placed.clock}
                          </span>
                          <span className="block text-[10px] dash-muted leading-tight">{placed.relative}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-kado-red bg-kado-red/15 px-2 py-0.5 rounded">
                          {o.channel}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${PAYMENT_STATUS_BADGE[o.paymentStatus]}`}>
                          {PAYMENT_STATUS_LABELS[o.paymentStatus]}
                        </span>
                        <OrderTableBadge order={o} variant="dash" />
                        {o.guestName && (
                          <span className="text-[10px] font-bold dash-muted dash-card-alt px-2 py-0.5 rounded">
                            {o.guestName}
                          </span>
                        )}
                        {user?.role === 'admin' && (
                          <span className="text-[10px] dash-muted">{branchLabel(o.branchId)}</span>
                        )}
                      </div>
                      <ul className="text-sm dash-heading space-y-0.5">
                        {o.items.slice(0, 4).map((item) => (
                          <li key={item.id}>
                            <span className="font-bold tabular-nums">{item.qty}×</span> {item.productNameSnapshot}
                          </li>
                        ))}
                        {o.items.length > 4 && (
                          <li className="text-xs dash-muted">+{o.items.length - 4} more · tap card</li>
                        )}
                      </ul>
                      <OrderPaymentProofPreview order={o} />
                      <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                        <span className="font-display font-bold text-kado-red text-base">{formatPhp(o.total)}</span>
                        {action ? (
                          <button
                            type="button"
                            disabled={!!busyId}
                            onClick={(e) => void runQuick(e, o, action)}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-kado-red px-4 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-kado-red/25 transition-colors hover:bg-kado-red-hover disabled:opacity-60 touch-manipulation"
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {action.label}
                            {!busy && <ArrowRight className="h-4 w-4" aria-hidden />}
                          </button>
                        ) : (
                          <span className="text-right text-[11px] dash-muted">Waiting for GCash proof</span>
                        )}
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
        <div className="dash-toast-bottom fixed z-[200] flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-xl sm:px-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {patchError}
          <button
            onClick={() => setPatchError(null)}
            className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:text-white"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
