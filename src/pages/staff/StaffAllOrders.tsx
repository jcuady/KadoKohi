import { useMemo, useState, useEffect } from 'react';
import type { OrderChannel, OrderStatus } from '../../types/domain';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { useAuthStore } from '../../store/authStore';
import { formatPhp } from '../../lib/money';
import { ALL_ORDER_STATUSES, ORDER_STATUS_BADGE, ORDER_STATUS_LABELS } from '../../lib/orderStatus';
import OrderTableBadge from '../../components/OrderTableBadge';
import OrderPlacedAt from '../../components/OrderPlacedAt';
import { compareOrdersNewestFirst } from '../../lib/orderTime';

const ALL_CHANNELS: OrderChannel[] = ['online', 'dine-in', 'takeout', 'pos', 'merch'];

export default function StaffAllOrders() {
  const orders = useOrderStore((s) => s.orders);
  const hydrateFromRemote = useOrderStore((s) => s.hydrateFromRemote);
  const branches = useBranchStore((s) => s.branches);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.role !== 'staff') return;
    if (user.branchId) {
      void hydrateFromRemote({ branchId: user.branchId, limit: 500 });
      return;
    }
    void hydrateFromRemote({ limit: 500 });
  }, [user?.role, user?.branchId, hydrateFromRemote]);

  const [channelFilter, setChannelFilter] = useState<OrderChannel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const branchName = useMemo(() => {
    const m = new Map(branches.map((b) => [b.id, b.name]));
    return (id: string) => m.get(id) ?? id;
  }, [branches]);

  const filtered = useMemo(() => {
    let list = orders;
    if (user?.branchId) list = list.filter((o) => o.branchId === user.branchId);
    if (channelFilter !== 'all') list = list.filter((o) => o.channel === channelFilter);
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter);
    return [...list].sort(compareOrdersNewestFirst);
  }, [orders, user?.branchId, channelFilter, statusFilter]);

  return (
    <div className="max-w-6xl dash-page">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">All Orders</h1>
      <p className="dash-muted mb-6">Read-only view of all orders{user?.branchId ? ` · ${branchName(user.branchId)}` : ''}.</p>

      <div className="flex flex-wrap gap-3 mb-6">
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
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <span className="self-center text-xs dash-muted font-semibold">
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl dash-card border p-12 text-center">
          <p className="text-sm dash-muted">No orders match your filters.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id} className="rounded-2xl dash-card border p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-display font-bold dash-heading text-lg">{o.shortCode}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full dash-card-alt dash-heading border dash-border">
                      {o.channel}
                    </span>
                    <OrderTableBadge order={o} variant="dash" />
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${ORDER_STATUS_BADGE[o.status]}`}>
                      {ORDER_STATUS_LABELS[o.status]}
                    </span>
                    <span className="text-xs dash-muted">{branchName(o.branchId)}</span>
                  </div>
                  <p className="text-sm dash-muted">
                    {o.items.map((i) => `${i.qty}× ${i.productNameSnapshot}`).join(' · ')}
                  </p>
                  {o.guestName && <p className="text-xs dash-muted mt-1">Customer: {o.guestName}</p>}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <OrderPlacedAt createdAt={o.createdAt} updatedAt={o.updatedAt} showDb />
                  <div className="text-right">
                  <p className="font-display font-bold text-kado-red text-lg">{formatPhp(o.total)}</p>
                  {(o.tax ?? 0) > 0 && (
                    <p className="text-[10px] dash-muted">incl. tax {formatPhp(o.tax!)}</p>
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-wider dash-muted">
                    {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                  </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
