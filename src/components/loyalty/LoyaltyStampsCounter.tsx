import { useEffect, useMemo, useState } from 'react';
import { Stamp, Search, Plus, Minus, Clock, Users } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { orderScopeForUser } from '../../lib/orderFetchScope';
import {
  buildLoyaltyMemberRows,
  customerOrderedInPeriod,
  filterLoyaltyMembers,
  LOYALTY_STAMP_FILTER_LABELS,
  type LoyaltyStampFilter,
} from '../../lib/adminLoyaltyMembers';
import {
  formatOrderTimestamp,
  formatPeriodRangeLabel,
  ORDER_PERIOD_LABELS,
  type OrderPeriod,
} from '../../lib/orderTime';

type LoyaltyStampsCounterProps = {
  /** Audit log reason when adjusting stamps (+/-). */
  adjustReason: string;
  /** Omit full-page min-height wrapper when rendered inside admin shell. */
  embedded?: boolean;
};

export default function LoyaltyStampsCounter({ adjustReason, embedded = false }: LoyaltyStampsCounterProps) {
  const user = useAuthStore((s) => s.user);
  const users = useUserStore((s) => s.users);
  const hydrateUsers = useUserStore((s) => s.hydrateFromRemote);
  const adjustLoyaltyStamps = useUserStore((s) => s.adjustLoyaltyStamps);
  const hydrateOrders = useOrderStore((s) => s.hydrateFromRemote);
  const orders = useOrderStore((s) => s.orders);

  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<OrderPeriod>('day');
  const [stampFilter, setStampFilter] = useState<LoyaltyStampFilter>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    void hydrateUsers();
    const scope = orderScopeForUser(user);
    if (scope) void hydrateOrders(scope);
  }, [hydrateUsers, hydrateOrders, user?.id, user?.role, user?.branchId]);

  const rows = useMemo(() => buildLoyaltyMemberRows(users, orders, []), [users, orders]);

  const results = useMemo(
    () =>
      filterLoyaltyMembers(rows, {
        search: query,
        period,
        activity: period === 'all' ? 'all' : 'ordered_in_period',
        stampFilter,
        sort: 'recent',
      }),
    [rows, query, period, stampFilter],
  );

  const orderedToday = useMemo(
    () => rows.filter((r) => customerOrderedInPeriod(r, 'day')).length,
    [rows],
  );

  const adjust = (id: string, name: string, delta: number) => {
    adjustLoyaltyStamps(id, delta, adjustReason);
    setFeedback(`${delta > 0 ? 'Added' : 'Removed'} ${Math.abs(delta)} stamp for ${name}.`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const content = (
    <div className={embedded ? 'max-w-2xl' : 'max-w-2xl mx-auto'}>
      <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
        <Stamp className="w-6 h-6 text-kado-red" /> Kado Circle Stamps
      </h1>
      <p className="text-sm opacity-70 mt-1">
        Find customers who ordered recently, then add or correct stamps. Every change is audited.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div
          className="rounded-xl border px-3 py-2.5"
          style={{ background: 'var(--color-dash-surface)', borderColor: 'var(--color-dash-border)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1">
            <Users className="w-3 h-3" /> Ordered today
          </p>
          <p className="font-display text-xl font-bold tabular-nums">{orderedToday}</p>
        </div>
        <div
          className="rounded-xl border px-3 py-2.5"
          style={{ background: 'var(--color-dash-surface)', borderColor: 'var(--color-dash-border)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Showing</p>
          <p className="font-display text-xl font-bold tabular-nums">{results.length}</p>
          <p className="text-[10px] opacity-50 truncate">{formatPeriodRangeLabel(period)}</p>
        </div>
      </div>

      <div
        className="mt-4 flex flex-wrap gap-1.5 rounded-xl border p-1"
        style={{ background: 'var(--color-dash-surface)', borderColor: 'var(--color-dash-border)' }}
        role="tablist"
        aria-label="Order period"
      >
        {(['day', 'week', 'month', 'all'] as OrderPeriod[]).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className={[
              'flex-1 min-w-[4.5rem] rounded-lg px-2 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors',
              period === p
                ? 'bg-kado-red text-white shadow-sm'
                : 'opacity-70 hover:opacity-100 hover:bg-[var(--color-dash-hover)]',
            ].join(' ')}
          >
            {ORDER_PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, or phone…"
          className="w-full rounded-xl border pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
          style={{
            background: 'var(--color-dash-surface)',
            borderColor: 'var(--color-dash-border)',
            color: 'var(--color-dash-text)',
          }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(Object.keys(LOYALTY_STAMP_FILTER_LABELS) as LoyaltyStampFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStampFilter(key)}
            className={[
              'rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors',
              stampFilter === key
                ? 'border-kado-red bg-kado-red/10 text-kado-red'
                : 'opacity-70 hover:opacity-100',
            ].join(' ')}
            style={{ borderColor: stampFilter === key ? undefined : 'var(--color-dash-border)' }}
          >
            {LOYALTY_STAMP_FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      {feedback && <p className="mt-3 text-xs font-semibold text-green-600">{feedback}</p>}

      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider opacity-50">
        {period === 'all' ? 'All members' : 'Recently ordered'} · newest first
      </p>

      <ul className="mt-2 space-y-2">
        {results.length === 0 && (
          <li
            className="rounded-xl border p-6 text-center text-sm opacity-60"
            style={{ borderColor: 'var(--color-dash-border)' }}
          >
            {query.trim()
              ? 'No customers match your search.'
              : period === 'day'
                ? 'No customers have ordered today yet.'
                : 'No customers match these filters.'}
          </li>
        )}
        {results.map((row) => {
          const last = row.lastOrderAt ? formatOrderTimestamp(row.lastOrderAt) : null;
          return (
            <li
              key={row.user.id}
              className="rounded-xl border px-4 py-3"
              style={{ background: 'var(--color-dash-surface)', borderColor: 'var(--color-dash-border)' }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{row.user.name}</p>
                  <p className="text-[11px] opacity-60 truncate">{row.user.email}</p>
                  {row.user.phone ? (
                    <p className="text-[11px] opacity-50 truncate">{row.user.phone}</p>
                  ) : null}
                  {last ? (
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold opacity-55">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>
                        {last.clock}
                        <span className="font-normal opacity-80"> · {last.relative}</span>
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[10px] opacity-45">No orders yet</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <div className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-amber-800">
                    <Stamp className="w-3.5 h-3.5" />
                    <span className="text-sm font-black tabular-nums">{row.stamps}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => adjust(row.user.id, row.user.name, -1)}
                    className="rounded-lg border w-9 h-9 flex items-center justify-center hover:bg-kado-red/10"
                    style={{ borderColor: 'var(--color-dash-border)' }}
                    title="Remove one stamp"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjust(row.user.id, row.user.name, 1)}
                    className="rounded-lg bg-kado-red text-white w-9 h-9 flex items-center justify-center hover:bg-kado-dark"
                    title="Add one stamp"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );

  if (embedded) return content;

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ background: 'var(--color-dash-bg)', color: 'var(--color-dash-text)' }}
    >
      {content}
    </div>
  );
}
