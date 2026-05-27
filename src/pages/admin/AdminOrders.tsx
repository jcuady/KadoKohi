import { useMemo, useState } from 'react';
import type { Order, OrderChannel, OrderStatus } from '../../types/domain';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { formatPhp } from '../../lib/money';
import { List, LayoutGrid, Clock, ChefHat, CheckCircle2, Coffee, CheckSquare, XCircle, ThumbsUp } from 'lucide-react';
import OrderStatusModal from '../../components/barista/OrderStatusModal';
import OrderPaymentProofPreview from '../../components/admin/OrderPaymentProofPreview';
import {
  ALL_ORDER_STATUSES,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  nextStatusInFlow,
} from '../../lib/orderStatus';

const ALL_CHANNELS: OrderChannel[] = ['online', 'dine-in', 'takeout', 'pos', 'merch'];

type Column = {
  status: OrderStatus;
  label: string;
  icon: any;
  color: string;
  bgCard: string;
};

const COLUMNS: Column[] = [
  { status: 'pending_payment', label: ORDER_STATUS_LABELS.pending_payment, icon: Clock, color: 'text-amber-400', bgCard: 'border-amber-500/30' },
  { status: 'paid', label: ORDER_STATUS_LABELS.paid, icon: ThumbsUp, color: 'text-sky-400', bgCard: 'border-sky-500/30' },
  { status: 'preparing', label: ORDER_STATUS_LABELS.preparing, icon: ChefHat, color: 'text-orange-400', bgCard: 'border-orange-500/30' },
  { status: 'ready', label: ORDER_STATUS_LABELS.ready, icon: CheckCircle2, color: 'text-green-400', bgCard: 'border-green-500/30' },
  { status: 'completed', label: ORDER_STATUS_LABELS.completed, icon: CheckSquare, color: 'text-gray-400', bgCard: 'border-gray-500/30' },
  { status: 'cancelled', label: ORDER_STATUS_LABELS.cancelled, icon: XCircle, color: 'text-red-400', bgCard: 'border-red-500/30' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminOrders() {
  const orders = useOrderStore((s) => s.orders);
  const updateOrderStatus = useOrderStore((s) => s.updateOrderStatus);
  const branches = useBranchStore((s) => s.branches);

  const [channelFilter, setChannelFilter] = useState<OrderChannel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const branchName = useMemo(() => {
    const m = new Map(branches.map((b) => [b.id, b.name]));
    return (id: string) => m.get(id) ?? id;
  }, [branches]);

  const filtered = useMemo(() => {
    let list = orders;
    if (channelFilter !== 'all') list = list.filter((o) => o.channel === channelFilter);
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter);
    if (branchFilter !== 'all') list = list.filter((o) => o.branchId === branchFilter);
    return list;
  }, [orders, channelFilter, statusFilter, branchFilter]);

  const nextStatus = (order: Order): OrderStatus | null => nextStatusInFlow(order);

  const applyStatus = (status: OrderStatus) => {
    if (!editingOrder) return;
    updateOrderStatus(editingOrder.id, status);
    setEditingOrder(null);
  };

  return (
    <div className={`dash-page flex flex-col ${viewMode === 'kanban' ? 'h-[calc(100vh-2rem)]' : 'max-w-6xl'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-1">Orders</h1>
          <p className="dash-muted">All channels — filter by channel, status, or branch.</p>
        </div>
        <div className="flex bg-white/50 dark:bg-black/50 backdrop-blur-md p-1 rounded-xl border dash-border shrink-0 self-start">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-kado-dark shadow-sm text-kado-red border border-gray-200 dark:border-gray-800'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
            title="List View"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-kado-dark shadow-sm text-kado-red border border-gray-200 dark:border-gray-800'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
            title="Kanban View"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 shrink-0">
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value as OrderChannel | 'all')}
          className="rounded-xl dash-input border px-4 py-2 text-sm font-semibold"
        >
          <option value="all">All channels</option>
          {ALL_CHANNELS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="rounded-xl dash-input border px-4 py-2 text-sm font-semibold"
        >
          <option value="all">All statuses</option>
          {ALL_ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="rounded-xl dash-input border px-4 py-2 text-sm font-semibold"
        >
          <option value="all">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <span className="text-xs dash-muted font-semibold ml-2">
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Main content */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl dash-card border p-12 text-center mt-6">
          <p className="text-sm dash-muted">No orders match your filters. Try placing one from POS.</p>
        </div>
      ) : viewMode === 'list' ? (
        <ul className="space-y-3">
          {filtered.map((o) => {
            const next = nextStatus(o);
            return (
              <li
                key={o.id}
                className="rounded-2xl dash-card border p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-display font-bold dash-heading text-lg">{o.shortCode}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full dash-card-alt text-kado-dark dash-heading border dash-border">
                        {o.channel}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${ORDER_STATUS_BADGE[o.status]}`}>
                        {ORDER_STATUS_LABELS[o.status]}
                      </span>
                      <span className="text-xs dash-muted">{branchName(o.branchId)}</span>
                      <span className="text-xs dash-muted">{timeAgo(o.createdAt)}</span>
                    </div>
                    <p className="text-sm dash-muted">
                      {o.items.map((i) => `${i.qty}× ${i.productNameSnapshot}`).join(' · ')}
                    </p>
                    {o.guestName && <p className="text-xs dash-muted mt-1">Pickup: {o.guestName}</p>}
                    <OrderPaymentProofPreview order={o} />
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="font-display font-bold text-kado-red text-lg">{formatPhp(o.total)}</p>
                      {(o.tax ?? 0) > 0 && (
                        <p className="text-[10px] dash-muted">incl. tax {formatPhp(o.tax!)}</p>
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-wider dash-muted">
                        {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {next && (
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(o.id, next)}
                          className="rounded-xl bg-kado-dark text-kado-cream px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-kado-red transition-colors"
                        >
                          → {ORDER_STATUS_LABELS[next]}
                        </button>
                      )}
                      {o.status !== 'cancelled' && o.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(o.id, 'cancelled')}
                          className="rounded-xl border border-red-200 text-red-600 px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden min-h-0 pb-4 snap-x">
          <div className="flex gap-4 h-full min-h-[500px] w-max snap-start">
            {COLUMNS.map((col) => {
              const colOrders = filtered.filter((o) => {
                if (col.status === 'cancelled' || col.status === 'completed') return o.status === col.status;
                return o.status === col.status || (col.status === 'pending_payment' && o.status === 'pending') || (col.status === 'paid' && o.status === 'accepted');
              });
              const Icon = col.icon;
              // Skip empty columns in Kanban view if a specific status filter is set
              if (statusFilter !== 'all' && statusFilter !== col.status) return null;
              
              return (
                <div key={col.status} className="flex flex-col h-full w-[280px] shrink-0">
                  <div className="flex items-center gap-2 mb-3 px-1 shrink-0">
                    <Icon className={`w-5 h-5 ${col.color}`} />
                    <span className="font-bold text-sm uppercase tracking-wider dash-muted">{col.label}</span>
                    <span className="ml-auto text-xs font-bold dash-card-alt dash-muted px-2 py-0.5 rounded-full">
                      {colOrders.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
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
                          className={`w-full text-left rounded-xl border dash-card ${col.bgCard} p-4 transition-colors hover:border-kado-red/30`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-display font-bold dash-heading text-lg">{o.shortCode}</span>
                            <span className="text-[10px] dash-muted">{timeAgo(o.createdAt).replace(' ago', '')}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-kado-red bg-kado-red/15 px-2 py-0.5 rounded">
                              {o.channel}
                            </span>
                            {o.guestName && (
                              <span className="text-[9px] font-bold dash-muted dash-card-alt px-2 py-0.5 rounded">
                                {o.guestName}
                              </span>
                            )}
                            <span className="text-[9px] dash-muted">{branchName(o.branchId)}</span>
                          </div>
                          <ul className="text-xs dash-muted space-y-0.5">
                            {o.items.slice(0, 4).map((item) => (
                              <li key={item.id} className="truncate">
                                {item.qty}× {item.productNameSnapshot}
                              </li>
                            ))}
                            {o.items.length > 4 && (
                              <li className="dash-muted">+{o.items.length - 4} more</li>
                            )}
                          </ul>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">
                              {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                            </span>
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
        </div>
      )}

      <OrderStatusModal
        open={!!editingOrder}
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
        onApply={applyStatus}
      />
    </div>
  );
}
