import { useMemo, useState } from 'react';
import type { Order, OrderChannel, OrderStatus, PaymentStatus } from '../../types/domain';
import { useOrderStore } from '../../store/orderStore';
import { useBranchStore } from '../../store/branchStore';
import { formatPhp } from '../../lib/money';
import {
  LayoutGrid,
  List,
  Clock,
  ChefHat,
  CheckCircle2,
  CheckSquare,
  XCircle,
  ThumbsUp,
  AlertCircle,
  Pencil,
  Trash2,
  MapPin,
  TrendingUp,
  Wallet,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';
import OrderStatusModal from '../../components/barista/OrderStatusModal';
import OrderPaymentProofPreview from '../../components/admin/OrderPaymentProofPreview';
import OrderTableBadge from '../../components/OrderTableBadge';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  ALL_ORDER_STATUSES,
  KANBAN_COLUMNS,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABELS,
  formatPaymentMethod,
  kanbanColumnForOrder,
  nextStatusInFlow,
} from '../../lib/orderStatus';
import {
  ORDER_PERIOD_LABELS,
  compareOrdersNewestFirst,
  formatPeriodRangeLabel,
  orderInPeriod,
  type OrderPeriod,
} from '../../lib/orderTime';
import { computeAdminOrderInsights, formatChannelLabel } from '../../lib/adminOrderStats';
import OrderPlacedAt from '../../components/OrderPlacedAt';

const ALL_CHANNELS: OrderChannel[] = ['online', 'dine-in', 'takeout', 'pos', 'merch'];
const PERIOD_OPTIONS: OrderPeriod[] = ['day', 'week', 'month', 'all'];

const KANBAN_STYLE: Record<string, { icon: typeof Clock; color: string; bgCard: string }> = {
  awaiting_payment: { icon: Clock, color: 'text-amber-400', bgCard: 'border-amber-500/30' },
  proof_submitted: { icon: ThumbsUp, color: 'text-violet-400', bgCard: 'border-violet-500/30' },
  accepted: { icon: ThumbsUp, color: 'text-sky-400', bgCard: 'border-sky-500/30' },
  preparing: { icon: ChefHat, color: 'text-orange-400', bgCard: 'border-orange-500/30' },
  ready: { icon: CheckCircle2, color: 'text-green-400', bgCard: 'border-green-500/30' },
  completed: { icon: CheckSquare, color: 'text-gray-400', bgCard: 'border-gray-500/30' },
  cancelled: { icon: XCircle, color: 'text-red-400', bgCard: 'border-red-500/30' },
};

export default function AdminOrders() {
  const orders = useOrderStore((s) => s.orders);
  const updateOrderStatus = useOrderStore((s) => s.updateOrderStatus);
  const updatePaymentStatus = useOrderStore((s) => s.updatePaymentStatus);
  const deleteOrder = useOrderStore((s) => s.deleteOrder);
  const branches = useBranchStore((s) => s.branches);

  const [channelFilter, setChannelFilter] = useState<OrderChannel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<OrderPeriod>('day');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);

  const branchName = useMemo(() => {
    const m = new Map(branches.map((b) => [b.id, b.name]));
    return (id: string) => m.get(id) ?? id;
  }, [branches]);

  const periodOrders = useMemo(
    () => orders.filter((o) => orderInPeriod(o.createdAt, periodFilter)),
    [orders, periodFilter],
  );

  const filtered = useMemo(() => {
    let list = periodOrders;
    if (branchFilter !== 'all') list = list.filter((o) => o.branchId === branchFilter);
    if (channelFilter !== 'all') list = list.filter((o) => o.channel === channelFilter);
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter);
    return [...list].sort(compareOrdersNewestFirst);
  }, [periodOrders, branchFilter, channelFilter, statusFilter]);

  const insights = useMemo(() => computeAdminOrderInsights(filtered), [filtered]);

  const branchLabel =
    branchFilter === 'all' ? 'All branches' : branchName(branchFilter);

  const applyPatch = async (patch: { status?: OrderStatus; paymentStatus?: PaymentStatus }) => {
    if (!editingOrder) return;
    setPatchError(null);
    if (patch.status) {
      const err = await updateOrderStatus(editingOrder.id, patch.status);
      if (err) {
        setPatchError(err);
        return;
      }
    }
    if (patch.paymentStatus) {
      const payErr = await updatePaymentStatus(editingOrder.id, patch.paymentStatus);
      if (payErr) {
        setPatchError(payErr);
        return;
      }
    }
    setEditingOrder(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setPatchError(null);
    const err = await deleteOrder(deleteTarget.id);
    setDeleteBusy(false);
    if (err) {
      setPatchError(err);
      return;
    }
    if (editingOrder?.id === deleteTarget.id) setEditingOrder(null);
    setDeleteTarget(null);
  };

  return (
    <div className={`dash-page flex min-w-0 flex-col gap-4 md:gap-6 ${viewMode === 'kanban' ? 'h-[calc(100dvh-7rem)] max-w-none' : 'max-w-7xl'}`}>
      {/* Header */}
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl md:text-3xl">Orders</CardTitle>
            <CardDescription>
              {formatPeriodRangeLabel(periodFilter)} · {branchLabel}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border dash-border dash-input px-3 py-2">
              <MapPin className="h-4 w-4 shrink-0 text-kado-red" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="min-w-[10rem] bg-transparent text-xs font-bold uppercase tracking-wider outline-none"
                aria-label="Filter by branch"
              >
                <option value="all">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'kanban')}>
              <TabsList>
                <TabsTrigger value="table">
                  <List className="h-4 w-4" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="kanban">
                  <LayoutGrid className="h-4 w-4" />
                  Board
                </TabsTrigger>
              </TabsList>
            </Tabs>
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

      {/* Owner KPIs — net sales excludes cancelled; collected = paid only */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-kado-red" />
            <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Net sales</span>
          </div>
          <p className="font-display text-2xl font-bold text-kado-red">{formatPhp(insights.netSales)}</p>
          <p className="mt-1 text-[10px] dash-muted">Excl. cancelled orders</p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-kado-red" />
            <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Collected</span>
          </div>
          <p className="font-display text-2xl font-bold dash-heading">{formatPhp(insights.collectedRevenue)}</p>
          <p className="mt-1 text-[10px] dash-muted">Paid orders only</p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-kado-red" />
            <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Orders</span>
          </div>
          <p className="font-display text-2xl font-bold dash-heading">{insights.orderCount}</p>
          <p className="mt-1 text-[10px] dash-muted">
            {insights.activeCount} active · {insights.completedCount} done
          </p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Needs attention</span>
          </div>
          <p className="font-display text-2xl font-bold dash-heading">{insights.awaitingPaymentCount}</p>
          <p className="mt-1 text-[10px] dash-muted">
            Awaiting payment or proof
            {insights.cancelledCount > 0 ? ` · ${insights.cancelledCount} cancelled` : ''}
          </p>
        </Card>
      </div>

      {/* Secondary metrics */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold dash-muted">
        <Badge variant="muted">Avg ticket {formatPhp(insights.avgTicket)}</Badge>
        <Badge variant="muted">{insights.itemCount} items sold</Badge>
        {insights.topChannel ? (
          <Badge variant="outline">
            Top channel {formatChannelLabel(insights.topChannel.channel)} ({insights.topChannel.count})
          </Badge>
        ) : null}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as OrderChannel | 'all')}
            className="rounded-xl dash-input border px-3 py-2 text-xs font-bold uppercase tracking-wider"
          >
            <option value="all">All channels</option>
            {ALL_CHANNELS.map((c) => (
              <option key={c} value={c}>{formatChannelLabel(c)}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="rounded-xl dash-input border px-3 py-2 text-xs font-bold uppercase tracking-wider"
          >
            <option value="all">All statuses</option>
            {ALL_ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <span className="ml-auto text-xs font-bold dash-muted">
            Showing {filtered.length} of {periodOrders.length} in period
          </span>
        </div>
      </Card>

      {/* Content */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm dash-muted">
            No orders match {ORDER_PERIOD_LABELS[periodFilter].toLowerCase()}, {branchLabel.toLowerCase()}, and your filters.
          </p>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => {
                const next = nextStatusInFlow(o);
                return (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-display font-bold dash-heading">{o.shortCode}</p>
                        <p className="max-w-[14rem] truncate text-xs dash-muted">
                          {o.items.map((i) => `${i.qty}× ${i.productNameSnapshot}`).join(' · ')}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <OrderTableBadge order={o} variant="dash" />
                          {o.guestName ? <Badge variant="muted">{o.guestName}</Badge> : null}
                        </div>
                        <OrderPaymentProofPreview order={o} />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold dash-muted">{branchName(o.branchId)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatChannelLabel(o.channel)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${PAYMENT_STATUS_BADGE[o.paymentStatus]}`}>
                          {PAYMENT_STATUS_LABELS[o.paymentStatus]}
                        </span>
                        <p className="text-[10px] dash-muted">{formatPaymentMethod(o.paymentMethod)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${ORDER_STATUS_BADGE[o.status]}`}>
                        {ORDER_STATUS_LABELS[o.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-display font-bold text-kado-red">{formatPhp(o.total)}</p>
                      {o.loyaltyVoucherCode ? (
                        <p className="text-[10px] text-kado-red">−{formatPhp(o.loyaltyDiscountTotal ?? 0)} voucher</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <OrderPlacedAt createdAt={o.createdAt} updatedAt={o.updatedAt} showDb />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingOrder(o)} title="Edit order">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(o)} title="Delete order">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        {next ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              const e = await updateOrderStatus(o.id, next);
                              if (e) setPatchError(e);
                            }}
                          >
                            → {ORDER_STATUS_LABELS[next]}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="admin-orders-kanban min-h-0 min-w-0 flex-1">
          <div className="grid h-full min-h-[min(520px,calc(100dvh-18rem))] auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
            {KANBAN_COLUMNS.map((col) => {
              const colOrders = filtered
                .filter((o) => kanbanColumnForOrder(o) === col.id)
                .sort(compareOrdersNewestFirst);
              const style = KANBAN_STYLE[col.id] ?? KANBAN_STYLE.accepted;
              const Icon = style.icon;

              return (
                <div key={col.id} className="flex min-h-[220px] min-w-0 flex-col md:min-h-[280px]">
                  <div className="mb-2 flex shrink-0 items-center gap-1.5 px-0.5 md:mb-3 md:gap-2">
                    <Icon className={`h-4 w-4 shrink-0 md:h-5 md:w-5 ${style.color}`} />
                    <span className="truncate text-[11px] font-bold uppercase tracking-wider dash-muted md:text-sm">
                      {col.label}
                    </span>
                    <Badge variant="muted" className="ml-auto shrink-0">{colOrders.length}</Badge>
                  </div>
                  <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
                    {colOrders.length === 0 ? (
                      <Card className="p-6 text-center text-xs dash-muted">Empty</Card>
                    ) : (
                      colOrders.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setEditingOrder(o)}
                          className={`w-full min-w-0 rounded-xl border dash-card p-3 text-left transition-colors hover:border-kado-red/30 md:p-4 ${style.bgCard}`}
                        >
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <span className="font-display text-lg font-bold dash-heading">{o.shortCode}</span>
                            <span className="font-display text-sm font-bold text-kado-red">{formatPhp(o.total)}</span>
                          </div>
                          <div className="mb-2 flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline">{formatChannelLabel(o.channel)}</Badge>
                            <OrderTableBadge order={o} variant="dash" />
                            <span className="text-[9px] dash-muted">{branchName(o.branchId)}</span>
                          </div>
                          <ul className="space-y-0.5 text-xs dash-muted">
                            {o.items.slice(0, 3).map((item) => (
                              <li key={item.id} className="truncate">
                                {item.qty}× {item.productNameSnapshot}
                              </li>
                            ))}
                          </ul>
                          <OrderPlacedAt createdAt={o.createdAt} showDb />
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
        onClose={() => { setEditingOrder(null); setPatchError(null); }}
        onApply={applyPatch}
        adminMode
        allowCancel={false}
        onDelete={editingOrder ? () => setDeleteTarget(editingOrder) : undefined}
        deleteBusy={deleteBusy}
      />

      {deleteTarget ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <CardTitle>Delete order?</CardTitle>
            <CardDescription className="mt-2">
              Permanently remove <strong className="dash-heading">{deleteTarget.shortCode}</strong> (
              {formatPhp(deleteTarget.total)}) from {branchName(deleteTarget.branchId)}. This cannot be undone.
            </CardDescription>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" disabled={deleteBusy} onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={deleteBusy} onClick={() => void confirmDelete()}>
                {deleteBusy ? 'Deleting…' : 'Delete order'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {patchError ? (
        <div className="fixed bottom-4 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {patchError}
          <button type="button" onClick={() => setPatchError(null)} className="ml-2 text-xs text-white/70 hover:text-white">
            ✕
          </button>
        </div>
      ) : null}
    </div>
  );
}
