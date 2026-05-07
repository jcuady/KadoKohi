import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Order, OrderStatus } from '../../types/domain';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { formatPhp } from '../../lib/money';
import { Clock, ChevronRight } from 'lucide-react';
import OrderStatusModal from '../../components/barista/OrderStatusModal';

const ALL_CHANNELS = ['online', 'dine-in', 'takeout', 'pos'] as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

export default function BaristaQueue() {
  const user = useAuthStore((s) => s.user);
  const orders = useOrderStore((s) => s.orders);
  const updateOrderStatus = useOrderStore((s) => s.updateOrderStatus);
  const branches = useBranchStore((s) => s.branches);

  const visible = useMemo(() => {
    const filtered = orders.filter((o) => ALL_CHANNELS.includes(o.channel as (typeof ALL_CHANNELS)[number]));
    if (user?.role === 'admin') return filtered;
    if (user?.role === 'barista' && user.branchId) {
      return filtered.filter((o) => o.branchId === user.branchId);
    }
    return [];
  }, [orders, user]);

  const sorted = useMemo(
    () => [...visible].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [visible],
  );
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const branchLabel = (id: string) => branches.find((b) => b.id === id)?.name ?? id;

  const applyStatus = (status: OrderStatus) => {
    if (!editingOrder) return;
    updateOrderStatus(editingOrder.id, status);
    setEditingOrder(null);
  };

  return (
    <div className="dash-page p-4 md:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold dash-heading mb-1">Queue</h1>
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
                <span className="flex items-center gap-1 text-[10px] dash-muted ml-auto shrink-0">
                  <Clock className="w-3 h-3" /> {timeAgo(o.createdAt)}
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
        onClose={() => setEditingOrder(null)}
        onApply={applyStatus}
      />
    </div>
  );
}
