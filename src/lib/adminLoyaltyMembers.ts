import type { Order, User } from '../types/domain';
import type { LoyaltyVoucher } from '../types/domain';
import { matchesUserSearch } from './roles';
import { orderInPeriod, type OrderPeriod } from './orderTime';

export type LoyaltyMemberRow = {
  user: User;
  stamps: number;
  lastOrderAt: string | null;
  orderCount: number;
  completedCount: number;
  stampsEarned: number;
  activeVouchers: number;
};

export type LoyaltyStampFilter = 'all' | 'has' | 'zero' | '5plus';
export type LoyaltyActivityFilter = 'all' | 'ordered_in_period' | 'never';
export type LoyaltyMemberSort = 'recent' | 'stamps_desc' | 'stamps_asc' | 'name';

export function buildLoyaltyMemberRows(
  users: User[],
  orders: Order[],
  vouchers: LoyaltyVoucher[],
): LoyaltyMemberRow[] {
  const ordersByCustomer = new Map<string, Order[]>();
  for (const order of orders) {
    if (!order.customerId) continue;
    const list = ordersByCustomer.get(order.customerId) ?? [];
    list.push(order);
    ordersByCustomer.set(order.customerId, list);
  }

  const vouchersByCustomer = new Map<string, LoyaltyVoucher[]>();
  for (const voucher of vouchers) {
    const list = vouchersByCustomer.get(voucher.customerId) ?? [];
    list.push(voucher);
    vouchersByCustomer.set(voucher.customerId, list);
  }

  return users
    .filter((u) => u.role === 'customer')
    .map((user) => {
      const customerOrders = ordersByCustomer.get(user.id) ?? [];
      const sorted = [...customerOrders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const completed = customerOrders.filter((o) => o.status === 'completed');
      const stampsEarned = completed.reduce((sum, o) => sum + (o.loyaltyStampsAwarded ?? 0), 0);
      const customerVouchers = vouchersByCustomer.get(user.id) ?? [];
      const activeVouchers = customerVouchers.filter((v) => v.status === 'active').length;

      return {
        user,
        stamps: user.loyaltyStamps ?? 0,
        lastOrderAt: sorted[0]?.createdAt ?? null,
        orderCount: customerOrders.length,
        completedCount: completed.length,
        stampsEarned,
        activeVouchers,
      };
    });
}

export function customerOrderedInPeriod(row: LoyaltyMemberRow, period: OrderPeriod): boolean {
  if (period === 'all') return row.orderCount > 0;
  return row.lastOrderAt != null && orderInPeriod(row.lastOrderAt, period);
}

export function filterLoyaltyMembers(
  rows: LoyaltyMemberRow[],
  opts: {
    search: string;
    period: OrderPeriod;
    activity: LoyaltyActivityFilter;
    stampFilter: LoyaltyStampFilter;
    sort: LoyaltyMemberSort;
  },
): LoyaltyMemberRow[] {
  const q = opts.search.trim();
  let list = rows;

  if (q) {
    list = list.filter((row) => matchesUserSearch(row.user, q));
  }

  if (opts.activity === 'never') {
    list = list.filter((row) => row.orderCount === 0);
  } else if (opts.activity === 'ordered_in_period') {
    list = list.filter((row) => customerOrderedInPeriod(row, opts.period));
  }

  if (opts.stampFilter === 'has') {
    list = list.filter((row) => row.stamps > 0);
  } else if (opts.stampFilter === 'zero') {
    list = list.filter((row) => row.stamps === 0);
  } else if (opts.stampFilter === '5plus') {
    list = list.filter((row) => row.stamps >= 5);
  }

  return [...list].sort((a, b) => {
    switch (opts.sort) {
      case 'stamps_desc':
        return b.stamps - a.stamps || a.user.name.localeCompare(b.user.name);
      case 'stamps_asc':
        return a.stamps - b.stamps || a.user.name.localeCompare(b.user.name);
      case 'name':
        return a.user.name.localeCompare(b.user.name);
      case 'recent':
      default: {
        const aTs = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0;
        const bTs = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0;
        if (bTs !== aTs) return bTs - aTs;
        return b.stamps - a.stamps;
      }
    }
  });
}

export const LOYALTY_STAMP_FILTER_LABELS: Record<LoyaltyStampFilter, string> = {
  all: 'All balances',
  has: 'Has stamps',
  zero: 'Zero stamps',
  '5plus': '5+ stamps',
};

export const LOYALTY_ACTIVITY_FILTER_LABELS: Record<LoyaltyActivityFilter, string> = {
  all: 'All members',
  ordered_in_period: 'Ordered in period',
  never: 'Never ordered',
};

export const LOYALTY_MEMBER_SORT_LABELS: Record<LoyaltyMemberSort, string> = {
  recent: 'Recently ordered',
  stamps_desc: 'Most stamps',
  stamps_asc: 'Fewest stamps',
  name: 'Name A–Z',
};
