import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBranchStore } from '../../store/branchStore';
import { useOrderStore } from '../../store/orderStore';
import { useMenuStore } from '../../store/menuStore';
import { useEventStore } from '../../store/eventStore';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { usePromoStore } from '../../store/promoStore';
import { useUserStore } from '../../store/userStore';
import { useAuditStore } from '../../store/auditStore';
import { adminOrderScopeFromFilters } from '../../lib/orderFetchScope';
import { formatPhp } from '../../lib/money';
import {
  TrendingUp,
  ShoppingBag,
  MapPin,
  Clock,
  Wallet,
  AlertTriangle,
  Coffee,
  Users,
  Ticket,
  CalendarHeart,
  Package,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  ORDER_PERIOD_LABELS,
  formatPeriodRangeLabel,
  orderInPeriod,
  timeAgo,
  type OrderPeriod,
} from '../../lib/orderTime';
import { formatChannelLabel } from '../../lib/adminOrderStats';
import {
  attentionOrders,
  computeAdminOrderInsights,
  computeBoothSnapshot,
  computeBranchBreakdown,
  computeCatalogHealth,
  computeChannelBreakdown,
  computeEventSnapshot,
  computeGuestReasonBreakdown,
  computeLoyaltySnapshot,
  computeOpsPipeline,
  computePromoSnapshot,
  computeRevenueSeries,
  computeTopProducts,
} from '../../lib/adminDashboardStats';
import {
  DashboardChannelChart,
  DashboardPipelineChart,
  DashboardRevenueChart,
} from '../../components/admin/dashboard/DashboardCharts';
import GuestOrderActionNote from '../../components/order/GuestOrderActionNote';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from '../../lib/orderStatus';

const PERIOD_OPTIONS: OrderPeriod[] = ['day', 'week', 'month', 'all'];

const AUDIT_LABEL: Record<string, string> = {
  'order.created': 'Order placed',
  'order.status_changed': 'Status update',
  'order.payment_status_changed': 'Payment update',
  'order.proof_submitted': 'Payment proof',
  'order.cancelled_by_guest': 'Guest cancel',
  'order.change_requested_by_guest': 'Guest change',
  'order.deleted': 'Order deleted',
};

export default function AdminDashboard() {
  const branches = useBranchStore((s) => s.branches);
  const allOrders = useOrderStore((s) => s.orders);
  const hydrateForAdmin = useOrderStore((s) => s.hydrateForAdmin);
  const setAdminFetchScope = useOrderStore((s) => s.setAdminFetchScope);
  const hydrateError = useOrderStore((s) => s.hydrateError);
  const products = useMenuStore((s) => s.products);
  const events = useEventStore((s) => s.events);
  const bookings = useBoothBookingStore((s) => s.bookings);
  const promoCodes = usePromoStore((s) => s.codes);
  const users = useUserStore((s) => s.users);
  const auditLogs = useAuditStore((s) => s.logs);
  const refreshAudit = useAuditStore((s) => s.refresh);

  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<OrderPeriod>('day');

  useEffect(() => {
    const scope = adminOrderScopeFromFilters({
      branchId: branchFilter,
      period: periodFilter,
    });
    setAdminFetchScope(scope);
    const timer = window.setTimeout(() => {
      void hydrateForAdmin(scope);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [branchFilter, periodFilter, hydrateForAdmin, setAdminFetchScope]);

  useEffect(() => {
    void refreshAudit(80);
  }, [refreshAudit]);

  const branchName = useMemo(() => {
    const m = new Map(branches.map((b) => [b.id, b.name]));
    return (id: string) => m.get(id) ?? id;
  }, [branches]);

  const orders = useMemo(() => {
    let list = allOrders.filter((o) => orderInPeriod(o.createdAt, periodFilter));
    if (branchFilter !== 'all') list = list.filter((o) => o.branchId === branchFilter);
    return list;
  }, [allOrders, branchFilter, periodFilter]);

  const insights = useMemo(() => computeAdminOrderInsights(orders), [orders]);
  const revenueSeries = useMemo(() => computeRevenueSeries(orders, periodFilter), [orders, periodFilter]);
  const channelBreakdown = useMemo(() => computeChannelBreakdown(orders), [orders]);
  const opsPipeline = useMemo(() => computeOpsPipeline(orders), [orders]);
  const topProducts = useMemo(() => computeTopProducts(orders), [orders]);
  const guestReasons = useMemo(() => computeGuestReasonBreakdown(orders), [orders]);
  const branchBreakdown = useMemo(
    () => (branchFilter === 'all' ? computeBranchBreakdown(orders, branchName) : []),
    [orders, branchFilter, branchName],
  );
  const attention = useMemo(() => attentionOrders(orders), [orders]);
  const catalog = useMemo(() => computeCatalogHealth(products), [products]);
  const booth = useMemo(() => computeBoothSnapshot(bookings), [bookings]);
  const promo = useMemo(() => computePromoSnapshot(promoCodes), [promoCodes]);
  const loyalty = useMemo(() => computeLoyaltySnapshot(users), [users]);
  const eventSnap = useMemo(() => computeEventSnapshot(events), [events]);

  const recentAudit = useMemo(
    () =>
      auditLogs
        .filter((l) => l.action.startsWith('order.'))
        .slice(0, 6),
    [auditLogs],
  );

  const branchLabel = branchFilter === 'all' ? 'All branches' : branchName(branchFilter);
  const collectionRate =
    insights.netSales > 0 ? Math.round((insights.collectedRevenue / insights.netSales) * 100) : 0;

  return (
    <div className="dash-page max-w-7xl space-y-6">
      {/* Header + filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-kado-red mb-1">Overview</p>
          <h1 className="font-display text-3xl font-bold dash-heading text-balance md:text-4xl">
            Business pulse
          </h1>
          <p className="mt-1 text-sm dash-muted">
            {formatPeriodRangeLabel(periodFilter)} · {branchLabel}
            <span className="mx-2 opacity-40">·</span>
            Live via order sync
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border dash-border dash-input px-3 py-2">
            <MapPin className="h-4 w-4 shrink-0 text-kado-red" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="min-w-[9rem] bg-transparent text-xs font-bold uppercase tracking-wider outline-none"
              aria-label="Filter by branch"
            >
              <option value="all">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <Tabs value={periodFilter} onValueChange={(v) => setPeriodFilter(v as OrderPeriod)}>
            <TabsList className="h-auto flex-wrap gap-1">
              {PERIOD_OPTIONS.map((p) => (
                <TabsTrigger key={p} value={p} className="text-[10px] font-bold uppercase tracking-wider">
                  {ORDER_PERIOD_LABELS[p]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {hydrateError ? (
        <Card className="border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-sm text-amber-900 dark:text-amber-100">{hydrateError}</p>
        </Card>
      ) : null}

      {/* Hero + secondary KPIs */}
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card className="relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-kado-red/[0.06] via-transparent to-transparent pointer-events-none" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-kado-red" />
              <span className="text-[11px] font-semibold uppercase tracking-widest dash-muted">Net sales</span>
            </div>
            <p className="font-display text-4xl font-bold tabular-nums text-kado-red md:text-5xl">
              {formatPhp(insights.netSales)}
            </p>
            <p className="mt-2 text-sm dash-muted">
              {insights.orderCount} orders · {insights.completedCount} completed · excl. cancelled
            </p>
            {branchFilter === 'all' && branchBreakdown.length > 1 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {branchBreakdown.map((b) => (
                  <Badge key={b.branchId} variant="muted">
                    {b.name} {formatPhp(b.revenue)}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-kado-red" />
              <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Collected</span>
            </div>
            <p className="font-display text-2xl font-bold tabular-nums dash-heading">{formatPhp(insights.collectedRevenue)}</p>
            <p className="mt-1 text-[10px] dash-muted">{collectionRate}% of net sales</p>
          </Card>
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-kado-red" />
              <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Avg ticket</span>
            </div>
            <p className="font-display text-2xl font-bold tabular-nums dash-heading">{formatPhp(insights.avgTicket)}</p>
            <p className="mt-1 text-[10px] dash-muted">{insights.itemCount} items sold</p>
          </Card>
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-kado-red" />
              <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">In progress</span>
            </div>
            <p className="font-display text-2xl font-bold tabular-nums dash-heading">{insights.activeCount}</p>
            <p className="mt-1 text-[10px] dash-muted">Active in ops flow</p>
          </Card>
          <Card className="p-4 border-amber-200/60 dark:border-amber-900/40">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Attention</span>
            </div>
            <p className="font-display text-2xl font-bold tabular-nums dash-heading">{insights.awaitingPaymentCount}</p>
            <p className="mt-1 text-[10px] dash-muted">Unpaid or proof pending</p>
          </Card>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Revenue trend</CardTitle>
            <CardDescription>
              {periodFilter === 'day' ? 'Hourly net sales today' : 'Daily net sales in period'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardRevenueChart data={revenueSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Order pipeline</CardTitle>
            <CardDescription>Live board snapshot</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardPipelineChart data={opsPipeline} />
            <Link
              to="/admin/orders"
              className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline"
            >
              Open kanban <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Channel + products + guest friction */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Channel mix</CardTitle>
            <CardDescription>
              {insights.topChannel
                ? `Top: ${formatChannelLabel(insights.topChannel.channel)} (${insights.topChannel.count})`
                : 'Revenue by order channel'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardChannelChart data={channelBreakdown} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top drinks</CardTitle>
            <CardDescription>By quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm dash-muted">No product sales in this period.</p>
            ) : (
              <ul className="space-y-3">
                {topProducts.map((p, i) => (
                  <li key={p.name} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-kado-red/10 text-[10px] font-bold text-kado-red">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold dash-heading">{p.name}</p>
                      <p className="text-[10px] dash-muted">{p.qty} sold</p>
                    </div>
                    <span className="font-display text-sm font-bold tabular-nums text-kado-red">{formatPhp(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Guest feedback</CardTitle>
            <CardDescription>
              {insights.guestCancelCount + insights.guestChangeCount > 0
                ? `${insights.guestCancelCount} cancels · ${insights.guestChangeCount} changes`
                : 'Cancel & change reasons'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {guestReasons.length === 0 ? (
              <p className="text-sm dash-muted">No guest-initiated cancels or changes in this period.</p>
            ) : (
              <ul className="space-y-2">
                {guestReasons.map((r) => (
                  <li key={r.reason} className="flex items-center justify-between gap-2 text-sm">
                    <span className="dash-heading">{r.label}</span>
                    <Badge variant="muted">{r.count}</Badge>
                  </li>
                ))}
              </ul>
            )}
            {insights.cancelledCount > 0 ? (
              <p className="mt-3 text-[10px] dash-muted">{insights.cancelledCount} total cancelled orders</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Business units */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link to="/admin/booth-bookings" className="group">
          <Card className="h-full p-4 transition-colors group-hover:border-kado-red/30">
            <CalendarHeart className="mb-2 h-4 w-4 text-kado-red" />
            <p className="text-[10px] font-bold uppercase tracking-widest dash-muted">Booth bookings</p>
            <p className="font-display text-2xl font-bold tabular-nums dash-heading">{booth.needsReview}</p>
            <p className="mt-1 text-[10px] dash-muted">
              need review · {booth.confirmedUpcoming} upcoming
            </p>
          </Card>
        </Link>
        <Link to="/admin/loyalty" className="group">
          <Card className="h-full p-4 transition-colors group-hover:border-kado-red/30">
            <Users className="mb-2 h-4 w-4 text-kado-red" />
            <p className="text-[10px] font-bold uppercase tracking-widest dash-muted">Loyalty</p>
            <p className="font-display text-2xl font-bold tabular-nums dash-heading">{loyalty.withStamps}</p>
            <p className="mt-1 text-[10px] dash-muted">
              members with stamps · {loyalty.totalStamps} total
            </p>
          </Card>
        </Link>
        <Link to="/admin/vouchers" className="group">
          <Card className="h-full p-4 transition-colors group-hover:border-kado-red/30">
            <Ticket className="mb-2 h-4 w-4 text-kado-red" />
            <p className="text-[10px] font-bold uppercase tracking-widest dash-muted">Promos</p>
            <p className="font-display text-2xl font-bold tabular-nums dash-heading">{promo.activeCodes}</p>
            <p className="mt-1 text-[10px] dash-muted">{promo.totalUses} total redemptions</p>
          </Card>
        </Link>
        <Link to="/admin/menu" className="group">
          <Card className="h-full p-4 transition-colors group-hover:border-kado-red/30">
            <Coffee className="mb-2 h-4 w-4 text-kado-red" />
            <p className="text-[10px] font-bold uppercase tracking-widest dash-muted">Menu health</p>
            <p className="font-display text-2xl font-bold tabular-nums dash-heading">{catalog.visible}</p>
            <p className="mt-1 text-[10px] dash-muted">
              live items · {catalog.outOfStock} out of stock
            </p>
          </Card>
        </Link>
      </div>

      {/* Attention + activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg">Needs attention</CardTitle>
              <CardDescription>Payment proof, unpaid GCash, active prep</CardDescription>
            </div>
            <Link to="/admin/orders">
              <Button variant="outline" size="sm">
                Orders
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {attention.length === 0 ? (
              <p className="text-sm dash-muted">All clear — no orders waiting on you.</p>
            ) : (
              <ul className="divide-y dash-border">
                {attention.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-2 py-3 first:pt-0">
                    <span className="font-display font-bold dash-heading">{o.shortCode}</span>
                    <Badge variant="outline">{formatChannelLabel(o.channel)}</Badge>
                    <span className="text-[10px] font-semibold uppercase dash-muted">
                      {PAYMENT_STATUS_LABELS[o.paymentStatus]}
                    </span>
                    <span className="text-[10px] dash-muted">{ORDER_STATUS_LABELS[o.status]}</span>
                    <span className="ml-auto font-display text-sm font-bold tabular-nums text-kado-red">
                      {formatPhp(o.total)}
                    </span>
                    <span className="w-full text-[10px] dash-muted">{timeAgo(o.createdAt)}</span>
                    <GuestOrderActionNote order={o} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg">Recent activity</CardTitle>
              <CardDescription>Order events from audit log</CardDescription>
            </div>
            <Link to="/admin/audit">
              <Button
                variant="ghost"
                size="icon"
                title="Refresh audit"
                onClick={() => void refreshAudit(80)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentAudit.length === 0 ? (
              <p className="text-sm dash-muted">No recent order activity logged.</p>
            ) : (
              <ul className="divide-y dash-border">
                {recentAudit.map((log) => (
                  <li key={log.id} className="py-3 first:pt-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold dash-heading">
                        {AUDIT_LABEL[log.action] ?? log.action}
                      </span>
                      <span className="text-[10px] dash-muted">{timeAgo(log.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-xs dash-muted line-clamp-2">{log.summary ?? '—'}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold dash-muted">
              <Badge variant="muted">
                <Package className="mr-1 inline h-3 w-3" />
                {eventSnap.published} events live
              </Badge>
              {booth.pipelineValue > 0 ? (
                <Badge variant="muted">Booth pipeline {formatPhp(booth.pipelineValue)}</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link to="/admin/orders">
          <Button>Open orders</Button>
        </Link>
        <Link to="/admin/pos">
          <Button variant="outline">POS</Button>
        </Link>
        <Link to="/admin/branches">
          <Button variant="outline">Branches</Button>
        </Link>
        <Link to="/admin/events">
          <Button variant="outline">Events</Button>
        </Link>
      </div>
    </div>
  );
}
