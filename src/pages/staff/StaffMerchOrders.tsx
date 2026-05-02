import { useMemo, useState } from 'react';
import type { OrderStatus } from '../../types/domain';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { useAuthStore } from '../../store/authStore';
import { formatPhp } from '../../lib/money';

const ALL_STATUSES: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-orange-100 text-orange-800 border-orange-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  served: 'bg-teal-100 text-teal-800 border-teal-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function StaffMerchOrders() {
  const orders = useOrderStore((s) => s.orders);
  const updateOrderStatus = useOrderStore((s) => s.updateOrderStatus);
  const branches = useBranchStore((s) => s.branches);
  const user = useAuthStore((s) => s.user);

  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const branchName = useMemo(() => {
    const m = new Map(branches.map((b) => [b.id, b.name]));
    return (id: string) => m.get(id) ?? id;
  }, [branches]);

  const filtered = useMemo(() => {
    let list = orders.filter((o) => o.channel === 'merch');
    if (user?.branchId) list = list.filter((o) => o.branchId === user.branchId);
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter);
    return list;
  }, [orders, user?.branchId, statusFilter]);

  const nextStatus = (current: OrderStatus): OrderStatus | null => {
    const flow: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'completed'];
    const idx = flow.indexOf(current);
    if (idx === -1 || idx >= flow.length - 1) return null;
    return flow[idx + 1];
  };

  return (
    <div className="max-w-5xl dash-page">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Merch Orders</h1>
      <p className="dash-muted mb-6">Orders from the merch store{user?.branchId ? ` · ${branchName(user.branchId)}` : ''}.</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="rounded-xl dash-input border px-4 py-2 text-sm font-semibold"
        >
          <option value="all">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="self-center text-xs dash-muted font-semibold">
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl dash-card border p-12 text-center">
          <p className="text-sm dash-muted">No merch orders yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => {
            const next = nextStatus(o.status);
            return (
              <li key={o.id} className="rounded-2xl dash-card border p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-display font-bold dash-heading text-lg">{o.shortCode}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_COLORS[o.status]}`}>
                        {o.status}
                      </span>
                      <span className="text-xs dash-muted">{branchName(o.branchId)}</span>
                      <span className="text-xs dash-muted">{timeAgo(o.createdAt)}</span>
                    </div>
                    <p className="text-sm dash-muted">
                      {o.items.map((i) => {
                        const variants = i.merchVariants?.map((v) => `${v.groupName}: ${v.optionLabel}`).join(', ');
                        return `${i.qty}× ${i.productNameSnapshot}${variants ? ` (${variants})` : ''}`;
                      }).join(' · ')}
                    </p>
                    {o.guestName && <p className="text-xs dash-muted mt-1">Customer: {o.guestName}</p>}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="font-display font-bold text-kado-red text-lg">{formatPhp(o.total)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider dash-muted">
                        {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {next && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(o.id, next)}
                        className="rounded-xl bg-kado-dark text-kado-cream px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-kado-red transition-colors"
                      >
                        → {next}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
