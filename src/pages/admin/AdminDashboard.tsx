import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBranchStore } from '../../store/branchStore';
import { useOrderStore } from '../../store/orderStore';
import { useMenuStore } from '../../store/menuStore';
import { useEventStore } from '../../store/eventStore';
import { formatPhp } from '../../lib/money';
import { TrendingUp, ShoppingBag, Coffee, MapPin, CalendarDays, Clock, Filter } from 'lucide-react';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminDashboard() {
  const branches = useBranchStore((s) => s.branches);
  const allOrders = useOrderStore((s) => s.orders);
  const products = useMenuStore((s) => s.products);
  const events = useEventStore((s) => s.events);

  const [branchFilter, setBranchFilter] = useState<string>('all');

  const orders = useMemo(() => {
    if (branchFilter === 'all') return allOrders;
    return allOrders.filter((o) => o.branchId === branchFilter);
  }, [allOrders, branchFilter]);

  const branchName = useMemo(() => {
    const m = new Map(branches.map((b) => [b.id, b.name]));
    return (id: string) => m.get(id) ?? id;
  }, [branches]);

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    const pending = orders.filter((o) => o.status === 'pending').length;
    const today = new Date().toDateString();
    const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
    return { revenue, pending, todayOrders: todayOrders.length, todayRevenue: todayOrders.reduce((s, o) => s + o.total, 0) };
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="max-w-5xl dash-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-1">Dashboard</h1>
          <p className="dash-muted text-sm">
            {branchFilter === 'all' ? 'All branches' : branchName(branchFilter)} — overview of operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 dash-muted shrink-0" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-xl dash-input border px-3 py-2 text-sm font-semibold min-w-[180px]"
          >
            <option value="all">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="rounded-2xl dash-card border p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-kado-red" />
            <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Revenue</span>
          </div>
          <p className="font-display text-2xl md:text-3xl font-bold dash-heading">{formatPhp(stats.revenue)}</p>
        </div>
        <div className="rounded-2xl dash-card border p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-4 h-4 text-kado-red" />
            <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Orders</span>
          </div>
          <p className="font-display text-2xl md:text-3xl font-bold dash-heading">{orders.length}</p>
          <p className="text-[10px] dash-muted mt-1">{stats.pending} pending</p>
        </div>
        <div className="rounded-2xl dash-card border p-5">
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="w-4 h-4 text-kado-red" />
            <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Products</span>
          </div>
          <p className="font-display text-2xl md:text-3xl font-bold dash-heading">{products.length}</p>
        </div>
        <div className="rounded-2xl dash-card border p-5">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-kado-red" />
            <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Branches</span>
          </div>
          <p className="font-display text-2xl md:text-3xl font-bold dash-heading">{branches.length}</p>
        </div>
      </div>

      {/* Today stats + quick actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="rounded-2xl dash-card border p-6">
          <h2 className="font-display font-bold text-lg dash-heading mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-kado-red" /> Today
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest dash-muted mb-1">Orders</p>
              <p className="font-display text-2xl font-bold dash-heading">{stats.todayOrders}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest dash-muted mb-1">Revenue</p>
              <p className="font-display text-2xl font-bold dash-heading">{formatPhp(stats.todayRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl dash-card border p-6">
          <h2 className="font-display font-bold text-lg dash-heading mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-kado-red" /> Kado Booth
          </h2>
          <p className="text-sm dash-muted mb-3">{events.filter((e) => e.visible).length} published events</p>
          <Link
            to="/admin/events"
            className="text-xs font-bold text-kado-red hover:underline uppercase tracking-wider"
          >
            Manage Kado Booth →
          </Link>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl dash-card border p-6 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg dash-heading">Recent orders</h2>
          <Link to="/admin/orders" className="text-xs font-bold text-kado-red hover:underline uppercase tracking-wider">
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm dash-muted">No orders yet{branchFilter !== 'all' ? ' for this branch' : ''}. Use POS to place one.</p>
        ) : (
          <ul className="divide-y dash-border">
            {recentOrders.map((o) => (
              <li key={o.id} className="py-3 flex items-center gap-4">
                <span className="font-display font-bold dash-heading">{o.shortCode}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full dash-card-alt dash-muted border dash-border">
                  {o.channel}
                </span>
                {branchFilter === 'all' && (
                  <span className="text-[9px] font-semibold uppercase tracking-wide dash-muted hidden sm:inline">
                    {branchName(o.branchId)}
                  </span>
                )}
                <span className="text-xs dash-muted flex-1">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</span>
                <span className="text-xs dash-muted">{timeAgo(o.createdAt)}</span>
                <span className="font-display font-bold text-kado-red text-sm">{formatPhp(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin/branches"
          className="inline-flex rounded-full bg-kado-red text-kado-cream px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors"
        >
          Manage branches
        </Link>
        <Link
          to="/admin/pos"
          className="inline-flex rounded-full border-2 dash-border px-6 py-3 text-xs font-bold uppercase tracking-wider dash-heading hover:border-kado-red hover:text-kado-red transition-colors"
        >
          Open POS
        </Link>
        <Link
          to="/admin/menu"
          className="inline-flex rounded-full border-2 dash-border px-6 py-3 text-xs font-bold uppercase tracking-wider dash-heading hover:border-kado-red hover:text-kado-red transition-colors"
        >
          Menu editor
        </Link>
      </div>
    </div>
  );
}
