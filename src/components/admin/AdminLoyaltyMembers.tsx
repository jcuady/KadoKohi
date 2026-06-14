import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Pencil,
  Search,
  Stamp,
  Trash2,
  Users,
} from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useOrderStore } from '../../store/orderStore';
import {
  buildLoyaltyMemberRows,
  customerOrderedInPeriod,
  filterLoyaltyMembers,
  LOYALTY_ACTIVITY_FILTER_LABELS,
  LOYALTY_MEMBER_SORT_LABELS,
  LOYALTY_STAMP_FILTER_LABELS,
  type LoyaltyActivityFilter,
  type LoyaltyMemberRow,
  type LoyaltyMemberSort,
  type LoyaltyStampFilter,
} from '../../lib/adminLoyaltyMembers';
import {
  formatOrderTimestamp,
  formatPeriodRangeLabel,
  ORDER_PERIOD_LABELS,
  type OrderPeriod,
} from '../../lib/orderTime';
import { loyaltyRepo } from '../../lib/supabase/repositories/loyalty';
import type { LoyaltyVoucher } from '../../types/domain';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

export default function AdminLoyaltyMembers() {
  const users = useUserStore((s) => s.users);
  const hydrateUsers = useUserStore((s) => s.hydrateFromRemote);
  const adjustLoyaltyStamps = useUserStore((s) => s.adjustLoyaltyStamps);
  const setLoyaltyStamps = useUserStore((s) => s.setLoyaltyStamps);
  const removeUser = useUserStore((s) => s.removeUser);
  const orders = useOrderStore((s) => s.orders);
  const hydrateOrders = useOrderStore((s) => s.hydrateFromRemote);

  const [vouchers, setVouchers] = useState<LoyaltyVoucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<OrderPeriod>('all');
  const [activity, setActivity] = useState<LoyaltyActivityFilter>('all');
  const [stampFilter, setStampFilter] = useState<LoyaltyStampFilter>('all');
  const [sort, setSort] = useState<LoyaltyMemberSort>('recent');

  const [editRow, setEditRow] = useState<LoyaltyMemberRow | null>(null);
  const [editStamps, setEditStamps] = useState(0);
  const [editReason, setEditReason] = useState('');
  const [editError, setEditError] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LoyaltyMemberRow | null>(null);
  const [deleteMode, setDeleteMode] = useState<'reset' | 'account'>('reset');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    void hydrateUsers();
    void hydrateOrders();
  }, [hydrateUsers, hydrateOrders]);

  useEffect(() => {
    let cancelled = false;
    setVouchersLoading(true);
    void loyaltyRepo
      .fetchAllVouchers()
      .then((rows) => {
        if (!cancelled) setVouchers(rows);
      })
      .catch(() => {
        if (!cancelled) setVouchers([]);
      })
      .finally(() => {
        if (!cancelled) setVouchersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(
    () => buildLoyaltyMemberRows(users, orders, vouchers),
    [users, orders, vouchers],
  );

  const filtered = useMemo(
    () =>
      filterLoyaltyMembers(rows, {
        search,
        period,
        activity,
        stampFilter,
        sort,
      }),
    [rows, search, period, activity, stampFilter, sort],
  );

  const stats = useMemo(() => {
    const withStamps = rows.filter((r) => r.stamps > 0).length;
    const totalStamps = rows.reduce((sum, r) => sum + r.stamps, 0);
    const orderedToday = rows.filter((r) => customerOrderedInPeriod(r, 'day')).length;
    return { members: rows.length, withStamps, totalStamps, orderedToday };
  }, [rows]);

  const openEdit = (row: LoyaltyMemberRow) => {
    setEditRow(row);
    setEditStamps(row.stamps);
    setEditReason('');
    setEditError('');
  };

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editRow) return;
    setEditBusy(true);
    setEditError('');
    try {
      setLoyaltyStamps(editRow.user.id, editStamps, editReason.trim() || undefined);
      setEditRow(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Could not update stamps.');
    } finally {
      setEditBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      if (deleteMode === 'account') {
        await removeUser(deleteTarget.user.id);
      } else {
        setLoyaltyStamps(deleteTarget.user.id, 0, 'Admin reset balance');
      }
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const renderLastOrder = (row: LoyaltyMemberRow) => {
    if (!row.lastOrderAt) return <span className="dash-muted">Never</span>;
    const { clock, relative } = formatOrderTimestamp(row.lastOrderAt);
    return (
      <div>
        <p className="text-xs font-semibold dash-heading">{clock}</p>
        <p className="text-[10px] dash-muted">{relative}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-kado-red" />
            <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">Members</span>
          </div>
          <p className="font-display text-2xl font-bold dash-heading">{stats.members}</p>
          <p className="mt-1 text-[10px] dash-muted">Customer accounts</p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Stamp className="h-4 w-4 text-kado-red" />
            <span className="text-[10px] font-bold uppercase tracking-widest dash-muted">With stamps</span>
          </div>
          <p className="font-display text-2xl font-bold text-kado-red">{stats.withStamps}</p>
          <p className="mt-1 text-[10px] dash-muted">{stats.totalStamps} total balance</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest dash-muted mb-2">Ordered today</p>
          <p className="font-display text-2xl font-bold dash-heading">{stats.orderedToday}</p>
          <p className="mt-1 text-[10px] dash-muted">Active members</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest dash-muted mb-2">Showing</p>
          <p className="font-display text-2xl font-bold dash-heading">{filtered.length}</p>
          <p className="mt-1 text-[10px] dash-muted">{formatPeriodRangeLabel(period)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">Kado Circle members</CardTitle>
            <CardDescription>
              Stamp balances, order activity, and voucher counts — edit or reset from here.
            </CardDescription>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as OrderPeriod)}>
            <TabsList className="h-auto w-full flex-wrap gap-1">
              {(['day', 'week', 'month', 'all'] as OrderPeriod[]).map((p) => (
                <TabsTrigger key={p} value={p} className="flex-1 sm:flex-none">
                  {ORDER_PERIOD_LABELS[p]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 dash-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, phone…"
                className="w-full rounded-xl dash-input border py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as LoyaltyActivityFilter)}
              className="rounded-xl dash-input border px-3 py-2 text-xs font-bold uppercase tracking-wider"
            >
              {(Object.keys(LOYALTY_ACTIVITY_FILTER_LABELS) as LoyaltyActivityFilter[]).map((key) => (
                <option key={key} value={key}>
                  {LOYALTY_ACTIVITY_FILTER_LABELS[key]}
                </option>
              ))}
            </select>
            <select
              value={stampFilter}
              onChange={(e) => setStampFilter(e.target.value as LoyaltyStampFilter)}
              className="rounded-xl dash-input border px-3 py-2 text-xs font-bold uppercase tracking-wider"
            >
              {(Object.keys(LOYALTY_STAMP_FILTER_LABELS) as LoyaltyStampFilter[]).map((key) => (
                <option key={key} value={key}>
                  {LOYALTY_STAMP_FILTER_LABELS[key]}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as LoyaltyMemberSort)}
              className="rounded-xl dash-input border px-3 py-2 text-xs font-bold uppercase tracking-wider"
            >
              {(Object.keys(LOYALTY_MEMBER_SORT_LABELS) as LoyaltyMemberSort[]).map((key) => (
                <option key={key} value={key}>
                  {LOYALTY_MEMBER_SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          {vouchersLoading ? (
            <p className="text-sm dash-muted py-8 text-center">Loading voucher data…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm dash-muted py-8 text-center">No members match your filters.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border dash-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Stamps</TableHead>
                    <TableHead>Last order</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Earned</TableHead>
                    <TableHead>Vouchers</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.user.id}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-display font-bold dash-heading">{row.user.name}</p>
                          <p className="text-xs dash-muted">{row.user.email}</p>
                          {row.user.phone ? (
                            <p className="text-[10px] dash-muted">{row.user.phone}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1 font-bold">
                          <Stamp className="h-3 w-3 text-kado-red" />
                          {row.stamps}
                        </Badge>
                      </TableCell>
                      <TableCell>{renderLastOrder(row)}</TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold dash-heading">{row.orderCount}</p>
                        <p className="text-[10px] dash-muted">{row.completedCount} completed</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold text-kado-red">{row.stampsEarned}</p>
                        <p className="text-[10px] dash-muted">lifetime</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold dash-heading">{row.activeVouchers}</p>
                        <p className="text-[10px] dash-muted">active</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Adjust stamps"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Quick +1 stamp"
                            onClick={() => adjustLoyaltyStamps(row.user.id, 1, 'Admin quick add')}
                          >
                            +1
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Reset stamps or delete account"
                            onClick={() => {
                              setDeleteTarget(row);
                              setDeleteMode('reset');
                              setDeleteError('');
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editRow ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
          <form onSubmit={submitEdit} className="w-full max-w-md rounded-2xl border dash-card p-6 shadow-2xl">
            <h2 className="font-display text-xl font-bold dash-heading mb-1 flex items-center gap-2">
              <Stamp className="h-5 w-5 text-kado-red" />
              Edit stamp balance
            </h2>
            <p className="text-xs dash-muted mb-4">
              {editRow.user.name} · current {editRow.stamps} stamps
            </p>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
              New balance
            </label>
            <input
              type="number"
              min={0}
              required
              value={editStamps}
              onChange={(e) => setEditStamps(Number(e.target.value))}
              className="mb-4 w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
            />
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
              Reason (optional)
            </label>
            <input
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="e.g. service recovery, promo correction"
              className="mb-4 w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
            />
            {editError ? <p className="mb-3 text-xs text-red-600">{editError}</p> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={editBusy} onClick={() => setEditRow(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editBusy}>
                {editBusy ? 'Saving…' : 'Save balance'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <CardTitle>Remove member data?</CardTitle>
            <CardDescription className="mt-2">
              Choose what to do for <strong className="dash-heading">{deleteTarget.user.name}</strong>.
            </CardDescription>
            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-start gap-2 rounded-xl border dash-border p-3">
                <input
                  type="radio"
                  name="delete-mode"
                  checked={deleteMode === 'reset'}
                  onChange={() => setDeleteMode('reset')}
                  className="mt-1 accent-kado-red"
                />
                <span className="text-sm">
                  <strong className="dash-heading">Reset stamps to zero</strong>
                  <span className="block text-xs dash-muted">Keeps the customer account and order history.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 rounded-xl border dash-border p-3">
                <input
                  type="radio"
                  name="delete-mode"
                  checked={deleteMode === 'account'}
                  onChange={() => setDeleteMode('account')}
                  className="mt-1 accent-kado-red"
                />
                <span className="text-sm">
                  <strong className="dash-heading">Delete customer account</strong>
                  <span className="block text-xs dash-muted">Removes login and profile permanently.</span>
                </span>
              </label>
            </div>
            {deleteError ? (
              <div className="mt-3 flex items-start gap-2 text-xs text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {deleteError}
              </div>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" disabled={deleteBusy} onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={deleteBusy} onClick={() => void confirmDelete()}>
                {deleteBusy ? 'Working…' : deleteMode === 'account' ? 'Delete account' : 'Reset stamps'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
