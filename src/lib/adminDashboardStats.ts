import type {
  BoothBooking,
  Event,
  MenuCategory,
  Order,
  OrderChannel,
  OrderItem,
  Product,
  PromoCode,
  User,
} from '../types/domain';
import { computeAdminOrderInsights, formatChannelLabel } from './adminOrderStats';
import { guestActionReasonLabel } from './guestOrderActions';
import { findPastriesCategory } from './pastriesCategory';
import {
  KANBAN_COLUMNS,
  kanbanColumnForOrder,
  type KanbanColumnId,
} from './orderStatus';
import { compareOrdersNewestFirst, periodRangeStart, type OrderPeriod } from './orderTime';

export type RevenuePoint = { key: string; label: string; revenue: number; orders: number };

export type ChannelPoint = {
  channel: OrderChannel;
  label: string;
  count: number;
  revenue: number;
};

export type PipelinePoint = { id: KanbanColumnId; label: string; count: number };

export type SalesCategory = 'coffee' | 'merch' | 'pastries' | 'mix-match';

export type ProductPoint = {
  name: string;
  qty: number;
  revenue: number;
  category: SalesCategory;
};

export type CategorySalesPoint = {
  key: SalesCategory;
  label: string;
  revenue: number;
  qty: number;
};

export type GuestReasonPoint = {
  reason: string;
  label: string;
  count: number;
  action: 'cancel' | 'change_order';
};

export type GuestActionStats = {
  cancelCount: number;
  changeCount: number;
  totalCancelled: number;
  cancelRatePct: number;
  guestFrictionPct: number;
  cancelReasons: GuestReasonPoint[];
  changeReasons: GuestReasonPoint[];
  allReasons: GuestReasonPoint[];
};

export type BranchPoint = {
  branchId: string;
  name: string;
  revenue: number;
  orders: number;
  avgTicket: number;
  sharePct: number;
};

export type PaymentMethodPoint = {
  method: string;
  label: string;
  count: number;
  revenue: number;
};

export type CatalogHealth = {
  total: number;
  visible: number;
  outOfStock: number;
  hidden: number;
};

export type BoothSnapshot = {
  total: number;
  needsReview: number;
  awaitingPayment: number;
  confirmedUpcoming: number;
  pipelineValue: number;
};

export type PromoSnapshot = {
  activeCodes: number;
  totalUses: number;
};

export type LoyaltySnapshot = {
  memberCount: number;
  withStamps: number;
  totalStamps: number;
};

export type EventSnapshot = {
  published: number;
  signupEnabled: number;
};

export { computeAdminOrderInsights };

export const SALES_CATEGORY_LABELS: Record<SalesCategory, string> = {
  coffee: 'Coffee & drinks',
  merch: 'Merch',
  pastries: 'Pastries',
  'mix-match': 'Mix & Match',
};

const CATEGORY_ORDER: SalesCategory[] = ['coffee', 'pastries', 'merch', 'mix-match'];

export function pastryProductIds(categories: MenuCategory[], products: Product[]): Set<string> {
  const cat = findPastriesCategory(categories);
  if (!cat) return new Set();
  return new Set(products.filter((p) => p.categoryId === cat.id).map((p) => p.id));
}

export function classifyOrderItem(
  item: OrderItem,
  order: Order,
  pastriesIds: Set<string>,
): SalesCategory {
  if (item.itemType === 'mix-match') return 'mix-match';
  if (item.itemType === 'merch' || order.channel === 'merch') return 'merch';
  if (pastriesIds.has(item.productId)) return 'pastries';
  return 'coffee';
}

export function computeCategorySales(
  orders: Order[],
  categories: MenuCategory[],
  products: Product[],
): CategorySalesPoint[] {
  const valid = orders.filter((o) => o.status !== 'cancelled');
  const pastriesIds = pastryProductIds(categories, products);
  const map = new Map<SalesCategory, { revenue: number; qty: number }>();
  for (const key of CATEGORY_ORDER) map.set(key, { revenue: 0, qty: 0 });

  for (const o of valid) {
    for (const item of o.items) {
      const cat = classifyOrderItem(item, o, pastriesIds);
      const cur = map.get(cat)!;
      cur.qty += item.qty;
      cur.revenue += item.lineTotal;
    }
  }

  return CATEGORY_ORDER.map((key) => ({
    key,
    label: SALES_CATEGORY_LABELS[key],
    revenue: map.get(key)?.revenue ?? 0,
    qty: map.get(key)?.qty ?? 0,
  }));
}

export function computeRevenueSeries(orders: Order[], period: OrderPeriod): RevenuePoint[] {
  const valid = orders.filter((o) => o.status !== 'cancelled');
  const now = new Date();

  if (period === 'day') {
    const start = periodRangeStart('day', now);
    const points: RevenuePoint[] = [];
    for (let h = 0; h < 24; h += 1) {
      const bucketStart = new Date(start);
      bucketStart.setHours(h, 0, 0, 0);
      const bucketEnd = new Date(start);
      bucketEnd.setHours(h + 1, 0, 0, 0);
      const inBucket = valid.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= bucketStart.getTime() && t < bucketEnd.getTime();
      });
      points.push({
        key: String(h),
        label: bucketStart.toLocaleTimeString('en-PH', { hour: 'numeric', hour12: true }),
        revenue: inBucket.reduce((s, o) => s + o.total, 0),
        orders: inBucket.length,
      });
    }
    return points;
  }

  let start: Date;
  if (period === 'week') start = periodRangeStart('week', now);
  else if (period === 'month') start = periodRangeStart('month', now);
  else {
    const timestamps = valid
      .map((o) => new Date(o.createdAt).getTime())
      .filter((t) => !Number.isNaN(t));
    if (!timestamps.length) return [];
    start = new Date(Math.min(...timestamps));
    start.setHours(0, 0, 0, 0);
    const cap = new Date(now);
    cap.setDate(cap.getDate() - 89);
    if (start < cap) start = cap;
  }

  const points: RevenuePoint[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= now) {
    const dayStart = new Date(cursor);
    const dayEnd = new Date(cursor);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const inBucket = valid.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    });
    points.push({
      key: dayStart.toISOString().slice(0, 10),
      label: dayStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      revenue: inBucket.reduce((s, o) => s + o.total, 0),
      orders: inBucket.length,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return points;
}

export function computeChannelBreakdown(orders: Order[]): ChannelPoint[] {
  const valid = orders.filter((o) => o.status !== 'cancelled');
  const map = new Map<OrderChannel, { count: number; revenue: number }>();
  for (const o of valid) {
    const cur = map.get(o.channel) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += o.total;
    map.set(o.channel, cur);
  }
  return [...map.entries()]
    .map(([channel, { count, revenue }]) => ({
      channel,
      label: formatChannelLabel(channel),
      count,
      revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function computeOpsPipeline(orders: Order[]): PipelinePoint[] {
  const counts = new Map<KanbanColumnId, number>();
  for (const col of KANBAN_COLUMNS) counts.set(col.id, 0);
  for (const o of orders) {
    const col = kanbanColumnForOrder(o);
    counts.set(col, (counts.get(col) ?? 0) + 1);
  }
  return KANBAN_COLUMNS.map((col) => ({
    id: col.id,
    label: col.label,
    count: counts.get(col.id) ?? 0,
  }));
}

export function computeTopProducts(
  orders: Order[],
  categories: MenuCategory[],
  products: Product[],
  options?: { limit?: number; category?: SalesCategory | 'all' },
): ProductPoint[] {
  const limit = options?.limit ?? 8;
  const filter = options?.category ?? 'all';
  const valid = orders.filter((o) => o.status !== 'cancelled');
  const pastriesIds = pastryProductIds(categories, products);
  const map = new Map<string, ProductPoint>();

  for (const o of valid) {
    for (const item of o.items) {
      const category = classifyOrderItem(item, o, pastriesIds);
      if (filter !== 'all' && category !== filter) continue;
      const name = item.productNameSnapshot;
      const cur = map.get(name) ?? { name, qty: 0, revenue: 0, category };
      cur.qty += item.qty;
      cur.revenue += item.lineTotal;
      map.set(name, cur);
    }
  }

  return [...map.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, limit);
}

export function computeGuestReasonBreakdown(
  orders: Order[],
  action?: 'cancel' | 'change_order',
): GuestReasonPoint[] {
  const map = new Map<string, GuestReasonPoint>();
  for (const o of orders) {
    if (!o.guestActionReason || !o.guestAction) continue;
    if (action && o.guestAction !== action) continue;
    const key = `${o.guestAction}:${o.guestActionReason}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        reason: o.guestActionReason,
        label: guestActionReasonLabel(o.guestActionReason),
        count: 1,
        action: o.guestAction,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function computeGuestActionStats(orders: Order[]): GuestActionStats {
  const cancelCount = orders.filter((o) => o.guestAction === 'cancel').length;
  const changeCount = orders.filter((o) => o.guestAction === 'change_order').length;
  const totalCancelled = orders.filter((o) => o.status === 'cancelled').length;
  const cancelRatePct = orders.length ? Math.round((totalCancelled / orders.length) * 100) : 0;
  const guestFrictionPct = orders.length
    ? Math.round(((cancelCount + changeCount) / orders.length) * 100)
    : 0;

  return {
    cancelCount,
    changeCount,
    totalCancelled,
    cancelRatePct,
    guestFrictionPct,
    cancelReasons: computeGuestReasonBreakdown(orders, 'cancel'),
    changeReasons: computeGuestReasonBreakdown(orders, 'change_order'),
    allReasons: computeGuestReasonBreakdown(orders),
  };
}

export function computeBranchBreakdown(
  orders: Order[],
  branchName: (id: string) => string,
): BranchPoint[] {
  const valid = orders.filter((o) => o.status !== 'cancelled');
  const netSales = valid.reduce((s, o) => s + o.total, 0);
  const map = new Map<string, { revenue: number; orders: number }>();
  for (const o of valid) {
    const cur = map.get(o.branchId) ?? { revenue: 0, orders: 0 };
    cur.revenue += o.total;
    cur.orders += 1;
    map.set(o.branchId, cur);
  }
  return [...map.entries()]
    .map(([branchId, { revenue, orders: count }]) => ({
      branchId,
      name: branchName(branchId),
      revenue,
      orders: count,
      avgTicket: count ? revenue / count : 0,
      sharePct: netSales > 0 ? Math.round((revenue / netSales) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function computePaymentMethodBreakdown(orders: Order[]): PaymentMethodPoint[] {
  const valid = orders.filter((o) => o.status !== 'cancelled');
  const labels: Record<string, string> = {
    'gcash-qr': 'GCash QR',
    paymongo: 'PayMongo',
    'pay-at-store': 'Pay at store',
  };
  const map = new Map<string, { count: number; revenue: number }>();
  for (const o of valid) {
    const method = o.paymentMethod ?? 'unknown';
    const cur = map.get(method) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += o.total;
    map.set(method, cur);
  }
  return [...map.entries()]
    .map(([method, { count, revenue }]) => ({
      method,
      label: labels[method] ?? (method === 'unknown' ? 'Unspecified' : method),
      count,
      revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function attentionOrders(orders: Order[], limit = 8): Order[] {
  const score = (o: Order): number => {
    if (o.status === 'cancelled' || o.status === 'completed') return 99;
    if (o.paymentStatus === 'proof_submitted') return 0;
    if (o.paymentStatus === 'unpaid') return 1;
    if (o.status === 'ready' || o.status === 'served') return 2;
    if (o.status === 'preparing') return 3;
    return 4;
  };
  return [...orders]
    .filter((o) => score(o) < 99)
    .sort((a, b) => score(a) - score(b) || compareOrdersNewestFirst(a, b))
    .slice(0, limit);
}

export function computeCatalogHealth(products: Product[]): CatalogHealth {
  const visible = products.filter((p) => p.visible);
  return {
    total: products.length,
    visible: visible.length,
    outOfStock: visible.filter((p) => !p.inStock).length,
    hidden: products.length - visible.length,
  };
}

export function computeBoothSnapshot(bookings: BoothBooking[]): BoothSnapshot {
  const now = Date.now();
  const needsReview = bookings.filter((b) =>
    ['submitted', 'under_review'].includes(b.status),
  ).length;
  const awaitingPayment = bookings.filter(
    (b) =>
      ['quoted', 'awaiting_confirmation'].includes(b.status) &&
      b.paymentStatus !== 'paid',
  ).length;
  const confirmedUpcoming = bookings.filter((b) => {
    if (b.status !== 'confirmed') return false;
    const t = new Date(b.eventDate).getTime();
    return !Number.isNaN(t) && t >= now;
  }).length;
  const pipelineValue = bookings
    .filter((b) => !['declined', 'cancelled', 'completed'].includes(b.status))
    .reduce((s, b) => s + (b.finalQuote?.total ?? b.estimateSnapshot?.total ?? 0), 0);

  return {
    total: bookings.length,
    needsReview,
    awaitingPayment,
    confirmedUpcoming,
    pipelineValue,
  };
}

export function computePromoSnapshot(codes: PromoCode[]): PromoSnapshot {
  return {
    activeCodes: codes.filter((c) => c.active).length,
    totalUses: codes.reduce((s, c) => s + (c.uses ?? 0), 0),
  };
}

export function computeLoyaltySnapshot(users: User[]): LoyaltySnapshot {
  const customers = users.filter((u) => u.role === 'customer');
  const withStamps = customers.filter((u) => (u.loyaltyStamps ?? 0) > 0);
  return {
    memberCount: customers.length,
    withStamps: withStamps.length,
    totalStamps: customers.reduce((s, u) => s + (u.loyaltyStamps ?? 0), 0),
  };
}

export function computeEventSnapshot(events: Event[]): EventSnapshot {
  const published = events.filter((e) => e.visible);
  return {
    published: published.length,
    signupEnabled: published.filter((e) => e.signupEnabled).length,
  };
}
