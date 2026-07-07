import type { Order, OrderChannel } from '../types/domain';

export type AdminOrderInsights = {
  orderCount: number;
  cancelledCount: number;
  /** Cancelled by guest (with reason captured). */
  guestCancelCount: number;
  /** Guest change-order requests (order cancelled so they can reorder). */
  guestChangeCount: number;
  /** Sum of totals excluding cancelled orders. */
  netSales: number;
  /** Sum where payment is settled (paid) and not cancelled. */
  collectedRevenue: number;
  /** Unpaid or proof awaiting verification. */
  awaitingPaymentCount: number;
  /** Not completed or cancelled — still in ops flow. */
  activeCount: number;
  completedCount: number;
  avgTicket: number;
  itemCount: number;
  topChannel: { channel: OrderChannel; count: number } | null;
};

const TERMINAL = new Set(['completed', 'cancelled']);

export function computeAdminOrderInsights(orders: Order[]): AdminOrderInsights {
  const valid = orders.filter((o) => o.status !== 'cancelled');
  const netSales = valid.reduce((s, o) => s + o.total, 0);
  const collectedRevenue = valid
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((s, o) => s + o.total, 0);
  const awaitingPaymentCount = orders.filter(
    (o) => o.status !== 'cancelled' && (o.paymentStatus === 'unpaid' || o.paymentStatus === 'proof_submitted'),
  ).length;
  const activeCount = orders.filter((o) => !TERMINAL.has(o.status)).length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;
  const guestCancelCount = orders.filter((o) => o.guestAction === 'cancel').length;
  const guestChangeCount = orders.filter((o) => o.guestAction === 'change_order').length;
  const itemCount = orders.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0);

  const channelCounts = new Map<OrderChannel, number>();
  for (const o of valid) {
    channelCounts.set(o.channel, (channelCounts.get(o.channel) ?? 0) + 1);
  }
  let topChannel: AdminOrderInsights['topChannel'] = null;
  for (const [channel, count] of channelCounts) {
    if (!topChannel || count > topChannel.count) topChannel = { channel, count };
  }

  return {
    orderCount: orders.length,
    cancelledCount,
    guestCancelCount,
    guestChangeCount,
    netSales,
    collectedRevenue,
    awaitingPaymentCount,
    activeCount,
    completedCount,
    avgTicket: valid.length ? netSales / valid.length : 0,
    itemCount,
    topChannel,
  };
}

export function formatChannelLabel(channel: OrderChannel): string {
  if (channel === 'dine-in') return 'Dine-in';
  if (channel === 'pos') return 'POS';
  return channel.charAt(0).toUpperCase() + channel.slice(1);
}
