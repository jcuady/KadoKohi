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
  Trophy,
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
  computeGuestActionStats,
  computeCategorySales,
  computePaymentMethodBreakdown,
  computeLoyaltySnapshot,
  computeOpsPipeline,
  computePromoSnapshot,
  computeRevenueSeries,
  computeTopProducts,
  type SalesCategory,
} from '../../lib/adminDashboardStats';
import {
  DashboardBranchChart,
  DashboardCategorySalesChart,
  DashboardChannelChart,
  DashboardPipelineChart,
  DashboardRevenueChart,
} from '../../components/admin/dashboard/DashboardCharts';
import DashboardBestSellers from '../../components/admin/dashboard/DashboardBestSellers';
import DashboardKpi from '../../components/admin/dashboard/DashboardKpi';
import DashboardSection from '../../components/admin/dashboard/DashboardSection';
import GuestOrderActionNote from '../../components/order/GuestOrderActionNote';
import { PAYMENT_STATUS_LABELS } from '../../lib/orderStatus';

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
  const categories = useMenuStore((s) => s.categories);
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
  const categorySales = useMemo(
    () => computeCategorySales(orders, categories, products),
    [orders, categories, products],
  );
  const opsPipeline = useMemo(() => computeOpsPipeline(orders), [orders]);
  const guestStats = useMemo(() => computeGuestActionStats(orders), [orders]);
  const paymentMethods = useMemo(() => computePaymentMethodBreakdown(orders), [orders]);
  const branchBreakdown = useMemo(
    () => computeBranchBreakdown(orders, branchName),
    [orders, branchName],
  );
  const bestBranch = branchBreakdown[0] ?? null;
  const bestSellersByCategory = useMemo(() => {
    const tabs: Record<'all' | SalesCategory, ReturnType<typeof computeTopProducts>> = {
      all: computeTopProducts(orders, categories, products, { limit: 8 }),
      coffee: computeTopProducts(orders, categories, products, { limit: 6, category: 'coffee' }),
      pastries: computeTopProducts(orders, categories, products, { limit: 6, category: 'pastries' }),
      merch: computeTopProducts(orders, categories, products, { limit: 6, category: 'merch' }),
      'mix-match': computeTopProducts(orders, categories, products, { limit: 6, category: 'mix-match' }),
    };
    return tabs;
  }, [orders, categories, products]);
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
    <div className="dash-page max-w-7xl space-y-5">
      {/* Filters */}
      <Card>
        <CardHeader className="gap-3 p-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-xl md:text-2xl">Overview</CardTitle>
            <CardDescription className="text-xs">
              {formatPeriodRangeLabel(periodFilter)} · {branchLabel} · Live order sync
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border dash-border dash-input px-3 py-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-kado-red" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="min-w-[8.5rem] bg-transparent text-[10px] font-bold uppercase tracking-wider outline-none"
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
        </CardHeader>
      </Card>

      {hydrateError ? (
        <Card className="border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-sm text-amber-900 dark:text-amber-100">{hydrateError}</p>
        </Card>
      ) : null}

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <DashboardKpi
          label="Net sales"
          value={formatPhp(insights.netSales)}
          hint={`${insights.orderCount} orders · excl. cancelled`}
          icon={TrendingUp}
          highlight
        />
        <DashboardKpi
          label="Collected"
          value={formatPhp(insights.collectedRevenue)}
          hint={`${collectionRate}% of net sales`}
          icon={Wallet}
        />
        <DashboardKpi
          label="Completed"
          value={String(insights.completedCount)}
          hint={`${insights.activeCount} in progress`}
          icon={ShoppingBag}
        />
        <DashboardKpi
          label="Avg ticket"
          value={formatPhp(insights.avgTicket)}
          hint={`${insights.itemCount} items sold`}
          icon={Coffee}
        />
        <DashboardKpi
          label="In progress"
          value={String(insights.activeCount)}
          hint="Active in ops flow"
          icon={Clock}
        />
        <DashboardKpi
          label="Attention"
          value={String(insights.awaitingPaymentCount)}
          hint="Unpaid or proof pending"
          icon={AlertTriangle}
          alert={insights.awaitingPaymentCount > 0}
        />
      </div>

      {bestBranch && branchFilter === 'all' ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-kado-red/15 bg-kado-red/[0.04] px-3 py-2 text-xs">
          <Trophy className="h-4 w-4 shrink-0 text-kado-red" />
          <span className="font-semibold dash-heading">
            Top branch: <span className="text-kado-red">{bestBranch.name}</span>
          </span>
          <span className="dash-muted tabular-nums">
            {formatPhp(bestBranch.revenue)} · {bestBranch.sharePct}% of sales · {bestBranch.orders} orders · avg{' '}
            {formatPhp(bestBranch.avgTicket)}
          </span>
        </div>
      ) : null}

      <DashboardSection title="Sales & revenue" description="Trends, categories, branches, and best sellers">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">Revenue trend</CardTitle>
              <CardDescription className="text-xs">
                {periodFilter === 'day' ? 'Hourly net sales today' : 'Daily net sales in period'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <DashboardRevenueChart data={revenueSeries} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">Order pipeline</CardTitle>
              <CardDescription className="text-xs">Live board snapshot</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <DashboardPipelineChart data={opsPipeline} />
              <Link
                to="/admin/orders"
                className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline"
              >
                Open kanban <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Coffee className="h-4 w-4 text-kado-red" />
                Sales by category
              </CardTitle>
              <CardDescription className="text-xs">Coffee, pastries, merch, and mix & match</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <DashboardCategorySalesChart data={categorySales} />
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {categorySales.map((row) => (
                  <div key={row.key} className="rounded-lg border dash-border px-2 py-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider dash-muted">{row.label}</p>
                    <p className="font-display text-sm font-bold tabular-nums text-kado-red">{formatPhp(row.revenue)}</p>
                    <p className="text-[10px] dash-muted">{row.qty} units</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-kado-red" />
                Branch performance
              </CardTitle>
              <CardDescription className="text-xs">
                {bestBranch
                  ? `${bestBranch.name} leads · ${bestBranch.sharePct}% of net sales`
                  : 'Net sales by branch'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <DashboardBranchChart data={branchBreakdown} />
              {branchBreakdown.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {branchBreakdown.map((b, i) => (
                    <li key={b.branchId} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-1.5 dash-heading">
                        {i === 0 ? <Trophy className="h-3 w-3 shrink-0 text-kado-red" /> : null}
                        <span className="truncate font-semibold">{b.name}</span>
                      </span>
                      <span className="shrink-0 tabular-nums dash-muted">
                        {formatPhp(b.revenue)} · {b.orders} ord.
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Best sellers</CardTitle>
            <CardDescription className="text-xs">
              Top items by quantity — coffee, pastries, merch, or mix & match
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <DashboardBestSellers byCategory={bestSellersByCategory} />
          </CardContent>
        </Card>
      </DashboardSection>

      <DashboardSection title="Channels & payments" description="How orders arrive and how they are paid">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">Channel mix</CardTitle>
              <CardDescription className="text-xs">
                {insights.topChannel
                  ? `Top: ${formatChannelLabel(insights.topChannel.channel)} (${insights.topChannel.count})`
                  : 'Revenue by order channel'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <DashboardChannelChart data={channelBreakdown} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">Payment methods</CardTitle>
              <CardDescription className="text-xs">Revenue by payment type</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {paymentMethods.length === 0 ? (
                <p className="text-sm dash-muted">No payment data in this period.</p>
              ) : (
                <ul className="space-y-2">
                  {paymentMethods.map((pm) => (
                    <li key={pm.method} className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium dash-heading">{pm.label}</span>
                      <span className="text-right">
                        <span className="font-display font-bold tabular-nums text-kado-red">{formatPhp(pm.revenue)}</span>
                        <span className="ml-2 text-[10px] dash-muted">{pm.count} orders</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Guest experience"
        description="Cancellations and change-order requests with reasons"
      >
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Guest cancels & changes</CardTitle>
            <CardDescription className="text-xs">
              {guestStats.cancelCount + guestStats.changeCount > 0
                ? `${guestStats.cancelCount} guest cancels · ${guestStats.changeCount} change requests · ${guestStats.guestFrictionPct}% of orders`
                : 'No guest-initiated actions in this period'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0">
            <div className="grid grid-cols-3 gap-2 max-w-lg">
              <div className="rounded-lg border dash-border px-2 py-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider dash-muted">Cancelled</p>
                <p className="font-display text-lg font-bold tabular-nums dash-heading">{guestStats.totalCancelled}</p>
                <p className="text-[10px] dash-muted">{guestStats.cancelRatePct}% of orders</p>
              </div>
              <div className="rounded-lg border dash-border px-2 py-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider dash-muted">Guest cancel</p>
                <p className="font-display text-lg font-bold tabular-nums dash-heading">{guestStats.cancelCount}</p>
              </div>
              <div className="rounded-lg border dash-border px-2 py-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider dash-muted">Change order</p>
                <p className="font-display text-lg font-bold tabular-nums dash-heading">{guestStats.changeCount}</p>
              </div>
            </div>

            {guestStats.allReasons.length === 0 ? (
              <p className="text-sm dash-muted">No reason data yet — guests pick a reason when they cancel or change.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider dash-muted">Cancel reasons</p>
                  {guestStats.cancelReasons.length === 0 ? (
                    <p className="text-xs dash-muted">None recorded</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {guestStats.cancelReasons.map((r) => (
                        <li key={`c-${r.reason}`} className="flex items-center justify-between gap-2 text-sm">
                          <span className="dash-heading">{r.label}</span>
                          <Badge variant="muted">{r.count}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider dash-muted">Change reasons</p>
                  {guestStats.changeReasons.length === 0 ? (
                    <p className="text-xs dash-muted">None recorded</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {guestStats.changeReasons.map((r) => (
                        <li key={`ch-${r.reason}`} className="flex items-center justify-between gap-2 text-sm">
                          <span className="dash-heading">{r.label}</span>
                          <Badge variant="muted">{r.count}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </DashboardSection>

      <DashboardSection title="Business units" description="Booth, loyalty, promos, and menu health">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Link to="/admin/booth-bookings" className="group">
            <Card className="h-full p-3 transition-colors group-hover:border-kado-red/30 md:p-4">
              <CalendarHeart className="mb-1.5 h-4 w-4 text-kado-red" />
              <p className="text-[9px] font-bold uppercase tracking-widest dash-muted">Booth bookings</p>
              <p className="font-display text-xl font-bold tabular-nums dash-heading">{booth.needsReview}</p>
              <p className="mt-0.5 text-[10px] dash-muted">review · {booth.confirmedUpcoming} upcoming</p>
            </Card>
          </Link>
          <Link to="/admin/loyalty" className="group">
            <Card className="h-full p-3 transition-colors group-hover:border-kado-red/30 md:p-4">
              <Users className="mb-1.5 h-4 w-4 text-kado-red" />
              <p className="text-[9px] font-bold uppercase tracking-widest dash-muted">Loyalty</p>
              <p className="font-display text-xl font-bold tabular-nums dash-heading">{loyalty.withStamps}</p>
              <p className="mt-0.5 text-[10px] dash-muted">{loyalty.totalStamps} stamps total</p>
            </Card>
          </Link>
          <Link to="/admin/vouchers" className="group">
            <Card className="h-full p-3 transition-colors group-hover:border-kado-red/30 md:p-4">
              <Ticket className="mb-1.5 h-4 w-4 text-kado-red" />
              <p className="text-[9px] font-bold uppercase tracking-widest dash-muted">Promos</p>
              <p className="font-display text-xl font-bold tabular-nums dash-heading">{promo.activeCodes}</p>
              <p className="mt-0.5 text-[10px] dash-muted">{promo.totalUses} redemptions</p>
            </Card>
          </Link>
          <Link to="/admin/menu" className="group">
            <Card className="h-full p-3 transition-colors group-hover:border-kado-red/30 md:p-4">
              <Coffee className="mb-1.5 h-4 w-4 text-kado-red" />
              <p className="text-[9px] font-bold uppercase tracking-widest dash-muted">Menu health</p>
              <p className="font-display text-xl font-bold tabular-nums dash-heading">{catalog.visible}</p>
              <p className="mt-0.5 text-[10px] dash-muted">{catalog.outOfStock} out of stock</p>
            </Card>
          </Link>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Operations"
        description="Orders needing action and recent audit activity"
        action={
          <Link to="/admin/orders">
            <Button variant="outline" size="sm">
              All orders
            </Button>
          </Link>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">Needs attention</CardTitle>
              <CardDescription className="text-xs">Payment proof, unpaid GCash, active prep</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {attention.length === 0 ? (
                <p className="text-sm dash-muted">All clear — no orders waiting on you.</p>
              ) : (
                <ul className="divide-y dash-border">
                  {attention.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center gap-2 py-2.5 first:pt-0">
                      <span className="font-display text-sm font-bold dash-heading">{o.shortCode}</span>
                      <Badge variant="outline">{formatChannelLabel(o.channel)}</Badge>
                      <span className="text-[10px] font-semibold uppercase dash-muted">
                        {PAYMENT_STATUS_LABELS[o.paymentStatus]}
                      </span>
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
            <CardHeader className="flex-row items-start justify-between space-y-0 p-4 pb-2">
              <div>
                <CardTitle className="text-base">Recent activity</CardTitle>
                <CardDescription className="text-xs">Order events from audit log</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                title="Refresh audit"
                onClick={() => void refreshAudit(80)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {recentAudit.length === 0 ? (
                <p className="text-sm dash-muted">No recent order activity logged.</p>
              ) : (
                <ul className="divide-y dash-border">
                  {recentAudit.map((log) => (
                    <li key={log.id} className="py-2.5 first:pt-0">
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
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="muted" className="text-[10px]">
                  <Package className="mr-1 inline h-3 w-3" />
                  {eventSnap.published} events live
                </Badge>
                {booth.pipelineValue > 0 ? (
                  <Badge variant="muted" className="text-[10px]">
                    Booth pipeline {formatPhp(booth.pipelineValue)}
                  </Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardSection>

      <div className="flex flex-wrap gap-2 border-t dash-border pt-4">
        <Link to="/admin/orders">
          <Button size="sm">Orders</Button>
        </Link>
        <Link to="/admin/pos">
          <Button variant="outline" size="sm">
            POS
          </Button>
        </Link>
        <Link to="/admin/branches">
          <Button variant="outline" size="sm">
            Branches
          </Button>
        </Link>
        <Link to="/admin/audit">
          <Button variant="outline" size="sm">
            Audit log
          </Button>
        </Link>
      </div>
    </div>
  );
}
