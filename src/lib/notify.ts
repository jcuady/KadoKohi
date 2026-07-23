import type { BoothBooking, BoothBookingStatus, Order, OrderStatus } from '../types/domain';
import { orderNeedsCustomerPayment } from './orderStatus';
import { pushRepo, type PushTarget } from './supabase/repositories/push';

export type OrderNotifyFamily = 'merch' | 'food';

export type NotifyKind = 'order' | 'payment' | 'marketing' | 'system';

export type NotifyPayload = {
  targets: PushTarget[];
  title: string;
  body: string;
  url: string;
  tag: string;
  kind?: NotifyKind;
};

/** Merch-only carts vs drinks/pastries/food service. */
export function orderNotifyFamily(order: Pick<Order, 'channel' | 'items'>): OrderNotifyFamily {
  if (order.channel === 'merch') return 'merch';
  const items = order.items ?? [];
  if (items.length > 0 && items.every((i) => i.itemType === 'merch')) return 'merch';
  return 'food';
}

export function staffOrderDeepLink(order: Pick<Order, 'channel'>): string {
  return order.channel === 'merch' ? '/staff/merch' : '/barista';
}

type StatusCopy = { title: string; body: (o: Order) => string };

const FOOD_STATUS_COPY: Record<OrderStatus, StatusCopy | null> = {
  pending: {
    title: 'Order received',
    body: (o) => `We've got your order ${o.shortCode}. Hang tight while we confirm it.`,
  },
  accepted: {
    title: 'Order confirmed',
    body: (o) => `Order ${o.shortCode} is confirmed and queued. We'll start preparing shortly.`,
  },
  preparing: {
    title: 'Preparing your order',
    body: (o) => `We're preparing order ${o.shortCode} now — drinks, pastries, the works.`,
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

const MERCH_STATUS_COPY: Record<OrderStatus, StatusCopy | null> = {
  pending: {
    title: 'Merch order received',
    body: (o) => `We've got merch order ${o.shortCode}. Hang tight while we confirm it.`,
  },
  accepted: {
    title: 'Merch order confirmed',
    body: (o) => `Merch order ${o.shortCode} is confirmed. We'll pack it shortly.`,
  },
  preparing: {
    title: 'Packing your merch',
    body: (o) => `We're packing merch order ${o.shortCode} now.`,
  },
  ready: {
    title: 'Merch ready for pickup',
    body: (o) => `Merch order ${o.shortCode} is ready for pickup at the counter.`,
  },
  served: {
    title: 'Merch handed over',
    body: (o) => `Merch order ${o.shortCode} has been collected. Thank you!`,
  },
  completed: {
    title: 'Merch order complete',
    body: (o) => `Merch order ${o.shortCode} is complete. Enjoy!`,
  },
  cancelled: {
    title: 'Merch order cancelled',
    body: (o) => `Merch order ${o.shortCode} was cancelled. Reach out to staff if this was unexpected.`,
  },
};

function statusCopyFor(order: Order, status: OrderStatus): StatusCopy | null {
  const table = orderNotifyFamily(order) === 'merch' ? MERCH_STATUS_COPY : FOOD_STATUS_COPY;
  return table[status];
}

function send(payload: NotifyPayload): void {
  void pushRepo.send(payload);
}

export function buildCustomerOrderStatusPayload(
  order: Order,
  status: OrderStatus,
): NotifyPayload | null {
  if (!order.customerId) return null;
  const copy = statusCopyFor(order, status);
  if (!copy) return null;
  const needsPay = orderNeedsCustomerPayment(order);
  return {
    targets: [{ userId: order.customerId }],
    title: copy.title,
    body: copy.body(order),
    url: needsPay ? `/checkout/${order.id}` : '/account/orders',
    tag: `order-${order.id}`,
    kind: 'order',
  };
}

export function notifyCustomerOrderStatus(order: Order, status: OrderStatus): void {
  const payload = buildCustomerOrderStatusPayload(order, status);
  if (payload) send(payload);
}

export function buildCustomerProofPayload(order: Order): NotifyPayload | null {
  if (!order.customerId) return null;
  if (order.paymentMethod !== 'gcash-qr') return null;
  return {
    targets: [{ userId: order.customerId }],
    title: 'Payment proof received',
    body: `We received your GCash proof for order ${order.shortCode}. We'll verify it shortly.`,
    url: `/checkout/${order.id}`,
    tag: `proof-customer-${order.id}`,
    kind: 'payment',
  };
}

export function notifyCustomerProofSubmitted(order: Order): void {
  const payload = buildCustomerProofPayload(order);
  if (payload) send(payload);
}

export function buildCustomerPendingPaymentPayload(order: Order): NotifyPayload | null {
  if (!order.customerId) return null;
  if (order.paymentMethod !== 'paymongo' && order.paymentMethod !== 'gcash-qr') return null;
  if (order.paymentStatus !== 'unpaid') return null;
  const method = order.paymentMethod === 'paymongo' ? 'QR Ph' : 'GCash';
  return {
    targets: [{ userId: order.customerId }],
    title: `Complete ${method} payment`,
    body: `Order ${order.shortCode} is waiting — pay ₱${order.total.toFixed(2)} to confirm your order.`,
    url: `/checkout/${order.id}`,
    tag: `pay-${order.id}`,
    kind: 'payment',
  };
}

export function notifyCustomerPendingPayment(order: Order): void {
  const payload = buildCustomerPendingPaymentPayload(order);
  if (payload) send(payload);
}

function staffOrderTargets(order: Pick<Order, 'branchId'>): PushTarget[] {
  const targets: PushTarget[] = [{ roles: ['admin'] }];
  if (order.branchId) {
    targets.unshift({ branchId: order.branchId, roles: ['barista', 'staff'] });
  }
  return targets;
}

export function buildBaristaNewOrderPayload(order: Order): NotifyPayload {
  const family = orderNotifyFamily(order);
  const channelLabel = family === 'merch' ? 'merch' : order.channel;
  return {
    targets: staffOrderTargets(order),
    title: family === 'merch' ? 'New merch order' : 'New order',
    body: `${order.shortCode} · ${channelLabel} · ₱${order.total.toFixed(2)} just came in.`,
    url: staffOrderDeepLink(order),
    tag: `new-order-${order.id}`,
  };
}

export function notifyBaristasNewOrder(order: Order): void {
  send(buildBaristaNewOrderPayload(order));
}

export function buildBaristaProofPayload(order: Order): NotifyPayload {
  return {
    targets: staffOrderTargets(order),
    title: 'Payment proof submitted',
    body: `${order.shortCode} uploaded GCash proof. Please verify to proceed.`,
    url: staffOrderDeepLink(order),
    tag: `proof-${order.id}`,
  };
}

export function notifyBaristasProofSubmitted(order: Order): void {
  send(buildBaristaProofPayload(order));
}

/** PayMongo / server mark-paid → customer “accepted” (or current status). */
export function buildCustomerPaymongoPaidPayload(order: Order): NotifyPayload | null {
  if (!order.customerId) return null;
  const status: OrderStatus = order.status === 'pending' ? 'accepted' : order.status;
  return buildCustomerOrderStatusPayload({ ...order, status, paymentStatus: 'paid' }, status);
}

const BOOTH_STATUS_COPY: Partial<
  Record<BoothBookingStatus, { title: string; body: (b: BoothBooking) => string }>
> = {
  under_review: {
    title: 'Booking under review',
    body: (b) => `We're reviewing ${b.shortCode} (${b.eventName}). We'll update you soon.`,
  },
  quoted: {
    title: 'Your event quote is ready',
    body: (b) => `Quote ready for ${b.shortCode} — ${b.eventName}. Open your booth bookings to review.`,
  },
  awaiting_confirmation: {
    title: 'Confirm your event booking',
    body: (b) => `${b.shortCode} needs your confirmation for ${b.eventName}.`,
  },
  confirmed: {
    title: 'Event booking confirmed',
    body: (b) => `${b.shortCode} is confirmed for ${b.eventName}. See you there!`,
  },
  declined: {
    title: 'Event booking declined',
    body: (b) => `${b.shortCode} (${b.eventName}) was declined. Contact us if you have questions.`,
  },
  cancelled: {
    title: 'Event booking cancelled',
    body: (b) => `${b.shortCode} (${b.eventName}) was cancelled.`,
  },
  completed: {
    title: 'Event complete',
    body: (b) => `Thanks for celebrating with us — ${b.shortCode} (${b.eventName}) is complete.`,
  },
};

export function buildBoothStatusPayload(
  booking: BoothBooking,
  status: BoothBookingStatus,
): NotifyPayload | null {
  if (!booking.customerId) return null;
  const copy = BOOTH_STATUS_COPY[status];
  if (!copy) return null;
  return {
    targets: [{ userId: booking.customerId }],
    title: copy.title,
    body: copy.body(booking),
    url: '/account/booth',
    tag: `booth-${booking.id}-${status}`,
    kind: 'system',
  };
}

export function notifyCustomerBoothStatus(booking: BoothBooking, status: BoothBookingStatus): void {
  const payload = buildBoothStatusPayload(booking, status);
  if (payload) send(payload);
}

function boothStaffTargets(booking: Pick<BoothBooking, 'branchId'>): PushTarget[] {
  const targets: PushTarget[] = [{ roles: ['admin'] }];
  if (booking.branchId) {
    targets.unshift({ branchId: booking.branchId, roles: ['staff', 'barista'] });
  } else {
    targets.unshift({ roles: ['staff'] });
  }
  return targets;
}

export function buildBoothStaffNewPayload(booking: BoothBooking): NotifyPayload {
  return {
    targets: boothStaffTargets(booking),
    title: 'New event booking',
    body: `${booking.shortCode} · ${booking.eventName} · ${booking.guestCount} guests.`,
    url: '/admin/booth-bookings',
    tag: `booth-new-${booking.id}`,
  };
}

export function notifyStaffNewBoothBooking(booking: BoothBooking): void {
  send(buildBoothStaffNewPayload(booking));
}

export function buildBoothStaffProofPayload(booking: BoothBooking): NotifyPayload {
  return {
    targets: boothStaffTargets(booking),
    title: 'Booth payment proof',
    body: `${booking.shortCode} uploaded payment proof for ${booking.eventName}.`,
    url: '/admin/booth-bookings',
    tag: `booth-proof-${booking.id}`,
  };
}

export function notifyStaffBoothProofSubmitted(booking: BoothBooking): void {
  send(buildBoothStaffProofPayload(booking));
}

export function buildEventRegistrationCustomerPayload(input: {
  customerId: string;
  eventId: string;
  eventTitle: string;
}): NotifyPayload {
  return {
    targets: [{ userId: input.customerId }],
    title: "You're registered",
    body: `Your spot for ${input.eventTitle} is saved. See you there!`,
    url: '/events',
    tag: `event-reg-${input.eventId}-${input.customerId}`,
    kind: 'system',
  };
}

export function buildEventRegistrationStaffPayload(input: {
  eventId: string;
  eventTitle: string;
  contactName: string;
}): NotifyPayload {
  return {
    targets: [{ roles: ['admin', 'staff'] }],
    title: 'New event registration',
    body: `${input.contactName} registered for ${input.eventTitle}.`,
    url: '/admin/events',
    tag: `event-reg-staff-${input.eventId}-${Date.now()}`,
  };
}

export function notifyEventRegistration(input: {
  customerId: string;
  eventId: string;
  eventTitle: string;
  contactName: string;
}): void {
  send(buildEventRegistrationCustomerPayload(input));
  send(
    buildEventRegistrationStaffPayload({
      eventId: input.eventId,
      eventTitle: input.eventTitle,
      contactName: input.contactName,
    }),
  );
}
