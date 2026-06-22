import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBranchStore } from '../../store/branchStore';
import { useOrderStore } from '../../store/orderStore';
import { useMenuStore } from '../../store/menuStore';
import { useEventStore } from '../../store/eventStore';
import { formatPhp } from '../../lib/money';
import {
  TrendingUp,
  ShoppingBag,
  MapPin,
  CalendarDays,
  Clock,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  ORDER_PERIOD_LABELS,
  formatPeriodRangeLabel,
  orderInPeriod,
  type OrderPeriod,
} from '../../lib/orderTime';
import { computeAdminOrderInsights, formatChannelLabel } from '../../lib/adminOrderStats';
import { compareOrdersNewestFirst } from '../../lib/orderTime';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const PERIOD_OPTIONS: OrderPeriod[] = ['day', 'week', 'month', 'all'];

export default function AdminDashboard() {
  const branches = useBranchStore((s) => s.branches);
  const allOrders = useOrderStore((s) => s.orders);
  const products = useMenuStore((s) => s.products);
  const events = useEventStore((s) => s.events);

  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<OrderPeriod>('day');

  const orders = useMemo(() => {
    let list = allOrders.filter((o) => orderInPeriod(o.createdAt, periodFilter));
    if (branchFilter !== 'all') list = list.filter((o) => o.branchId === branchFilter);
    return list;
  }, [allOrders, branchFilter, periodFilter]);

  const insights = useMemo(() => computeAdminOrderInsights(orders), [orders]);

  const branchName = useMemo(() => {
    const m = new Map(branches.map((b) => [b.id, b.name]));
    return (id: string) => m.get(id) ?? id;
  }, [branches]);

  const branchLabel = branchFilter === 'all' ? 'All branches' : branchName(branchFilter);
  const recentOrders = useMemo(() => [...orders].sort(compareOrdersNewestFirst).slice(0, 6), [orders]);

  return (
    <div className="dash-page max-w-6xl space-y-6">
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-2xl md:text-3xl">Dashboard</CardTitle>
            <CardDescription>
              {formatPeriodRangeLabel(periodFilter)} · {branchLabel}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-xl border dash-border dash-input px-3 py-2">
            <MapPin className="h-4 w-4 shrink-0 text-kado-red" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full min-w-0 bg-transparent text-xs font-bold uppercase tracking-wider outline-none sm:min-w-[10rem]"
              aria-label="Filter by branch"
            >
              <option value="all">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={periodFilter} onValueChange={(v) => setPeriodFilter(v as OrderPeriod)}>
            <TabsList className="w-full flex-wrap h-auto gap-1">
              {PERIOD_OPTIONS.map((p) => (
                <TabsTrigger key={p} value={p} className="flex-1 sm:flex-none">
                  {ORDER_PERIOD_LABELS[p]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-kado-red" />
            <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Net sales</span>
          </div>
          <p className="font-display text-2xl font-bold text-kado-red md:text-3xl">{formatPhp(insights.netSales)}</p>
          <p className="mt-1 text-[10px] dash-muted">Excl. cancelled</p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-kado-red" />
            <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Collected</span>
          </div>
          <p className="font-display text-2xl font-bold dash-heading md:text-3xl">{formatPhp(insights.collectedRevenue)}</p>
          <p className="mt-1 text-[10px] dash-muted">Paid orders</p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-kado-red" />
            <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Orders</span>
          </div>
          <p className="font-display text-2xl font-bold dash-heading md:text-3xl">{insights.orderCount}</p>
          <p className="mt-1 text-[10px] dash-muted">{insights.activeCount} active now</p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Attention</span>
          </div>
          <p className="font-display text-2xl font-bold dash-heading md:text-3xl">{insights.awaitingPaymentCount}</p>
          <p className="mt-1 text-[10px] dash-muted">Unpaid / proof pending</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-kado-red" />
              Period snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest dash-muted">Avg ticket</p>
              <p className="font-display text-xl font-bold dash-heading">{formatPhp(insights.avgTicket)}</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest dash-muted">Items sold</p>
              <p className="font-display text-xl font-bold dash-heading">{insights.itemCount}</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest dash-muted">Completed</p>
              <p className="font-display text-xl font-bold dash-heading">{insights.completedCount}</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest dash-muted">Catalog</p>
              <p className="font-display text-xl font-bold dash-heading">{products.length} drinks</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-kado-red" />
              Kado Events
            </CardTitle>
            <CardDescription>{events.filter((e) => e.visible).length} published events</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/admin/events"
              className="inline-flex h-8 items-center rounded-xl border dash-border px-3 text-[10px] font-bold uppercase tracking-wider dash-heading hover:border-kado-red/40 hover:text-kado-red"
            >
              Manage events →
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Recent orders</CardTitle>
          <Link
            to="/admin/orders"
            className="text-xs font-bold uppercase tracking-wider text-kado-red hover:underline"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm dash-muted">No orders in this period{branchFilter !== 'all' ? ' for this branch' : ''}.</p>
          ) : (
            <ul className="divide-y dash-border">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-3">
                  <span className="font-display font-bold dash-heading">{o.shortCode}</span>
                  <Badge variant="outline">{formatChannelLabel(o.channel)}</Badge>
                  {branchFilter === 'all' ? (
                    <span className="hidden text-[10px] font-semibold uppercase tracking-wide dash-muted sm:inline">
                      {branchName(o.branchId)}
                    </span>
                  ) : null}
                  <span className="flex-1 text-xs dash-muted">{timeAgo(o.createdAt)}</span>
                  <span className="font-display text-sm font-bold text-kado-red">{formatPhp(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/orders">
          <Button>Open orders</Button>
        </Link>
        <Link to="/admin/pos">
          <Button variant="outline">POS</Button>
        </Link>
        <Link to="/admin/branches">
          <Button variant="outline">Branches</Button>
        </Link>
        <Link to="/admin/menu">
          <Button variant="outline">Menu</Button>
        </Link>
      </div>
    </div>
  );
}
