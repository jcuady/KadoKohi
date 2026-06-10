/** Barista-facing order timestamps (en-PH). */

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatOrderTimestamp(iso: string): { clock: string; relative: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { clock: '—', relative: '' };
  }
  const isToday = d.toDateString() === new Date().toDateString();
  const clock = d.toLocaleString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(isToday ? {} : { month: 'short', day: 'numeric' }),
  });
  return { clock, relative: timeAgo(iso) };
}

export function compareOrdersNewestFirst(a: { createdAt: string }, b: { createdAt: string }): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export type OrderPeriod = 'all' | 'day' | 'week' | 'month';

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Monday-start week in local time. */
function startOfLocalWeek(d: Date): Date {
  const x = startOfLocalDay(d);
  const diff = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfLocalMonth(d: Date): Date {
  const x = startOfLocalDay(d);
  x.setDate(1);
  return x;
}

export function periodRangeStart(period: Exclude<OrderPeriod, 'all'>, now = new Date()): Date {
  if (period === 'day') return startOfLocalDay(now);
  if (period === 'week') return startOfLocalWeek(now);
  return startOfLocalMonth(now);
}

export function orderInPeriod(createdAt: string, period: OrderPeriod, now = new Date()): boolean {
  if (period === 'all') return true;
  const ts = new Date(createdAt).getTime();
  if (Number.isNaN(ts)) return false;
  return ts >= periodRangeStart(period, now).getTime();
}

export const ORDER_PERIOD_LABELS: Record<OrderPeriod, string> = {
  all: 'All time',
  day: 'Today',
  week: 'This week',
  month: 'This month',
};

/** Full locale label aligned with Supabase `created_at` / `updated_at` in Table Editor. */
export function formatOrderDbLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
}
