import type { Order, OrderStatus } from '../types/domain';
import { pushRepo } from './supabase/repositories/push';

/** Customer-facing copy for each fulfillment status. Professional + on-brand. */
const CUSTOMER_STATUS_COPY: Record<OrderStatus, { title: string; body: (o: Order) => string } | null> = {
  pending: {
    title: 'Order received',
    body: (o) => `We've got your order ${o.shortCode}. Hang tight while we confirm it.`,
  },
  accepted: {
    title: 'Order confirmed',
    body: (o) => `Order ${o.shortCode} is confirmed and queued. We'll start brewing shortly.`,
  },
  preparing: {
    title: 'Now brewing',
    body: (o) => `Our baristas are preparing order ${o.shortCode}. Almost there!`,
  },
  ready: {
    title: 'Ready for pickup',
    body: (o) => `Order ${o.shortCode} is ready. Please proceed to the counter to collect it.`,
  },
  served: {
    title: 'Enjoy your order',
    body: (o) => `Order ${o.shortCode} has been served. Thank you for choosing Kado Kohi!`,
  },
  completed: {
    title: 'Order complete',
    body: (o) =>
      o.loyaltyStampsAwarded && o.loyaltyStampsAwarded > 0
        ? `Order ${o.shortCode} is complete — you earned ${o.loyaltyStampsAwarded} Kado Circle stamp${o.loyaltyStampsAwarded > 1 ? 's' : ''}!`
        : `Order ${o.shortCode} is complete. See you again soon!`,
  },
  cancelled: {
    title: 'Order cancelled',
    body: (o) => `Order ${o.shortCode} was cancelled. Reach out to staff if this was unexpected.`,
  },
};

/** Notify the customer who owns an order that its status changed. */
export function notifyCustomerOrderStatus(order: Order, status: OrderStatus): void {
  if (!order.customerId) return;
  const copy = CUSTOMER_STATUS_COPY[status];
  if (!copy) return;
  void pushRepo.send({
    targets: [{ userId: order.customerId }],
    title: copy.title,
    body: copy.body(order),
    url: '/account/orders',
    tag: `order-${order.id}`,
  });
}

/** Notify branch baristas (+ admins) that a new order needs attention. */
export function notifyBaristasNewOrder(order: Order): void {
  void pushRepo.send({
    targets: [
      { branchId: order.branchId, roles: ['barista', 'staff'] },
      { roles: ['admin'] },
    ],
    title: 'New order',
    body: `${order.shortCode} · ${order.channel} · ₱${order.total.toFixed(2)} just came in.`,
    url: '/barista',
    tag: `new-order-${order.id}`,
  });
}

/** Notify branch baristas that a customer submitted GCash payment proof. */
export function notifyBaristasProofSubmitted(order: Order): void {
  void pushRepo.send({
    targets: [
      { branchId: order.branchId, roles: ['barista', 'staff'] },
      { roles: ['admin'] },
    ],
    title: 'Payment proof submitted',
    body: `${order.shortCode} uploaded GCash proof. Please verify to proceed.`,
    url: '/barista',
    tag: `proof-${order.id}`,
  });
}
