import type { Order, OrderStatus, PaymentMethod } from '../types/domain';

/** GCash QR pickup orders — staff advances manually after verifying proof. */
export const GCASH_ORDER_FLOW: OrderStatus[] = [
  'pending_payment',
  'paid',
  'preparing',
  'ready',
  'completed',
];

/** Legacy / POS / dine-in style flow. */
export const LEGACY_ORDER_FLOW: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'served',
  'completed',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending payment',
  paid: 'Paid',
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  served: 'Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function isGcashOrder(order: Pick<Order, 'paymentMethod' | 'status'>): boolean {
  return (
    order.paymentMethod === 'gcash-qr' ||
    order.status === 'pending_payment' ||
    order.status === 'paid'
  );
}

export function statusFlowForOrder(order: Pick<Order, 'paymentMethod' | 'status'>): OrderStatus[] {
  return isGcashOrder(order) ? GCASH_ORDER_FLOW : LEGACY_ORDER_FLOW;
}

export function nextStatusInFlow(order: Pick<Order, 'status' | 'paymentMethod'>): OrderStatus | null {
  const flow = statusFlowForOrder(order);
  const idx = flow.indexOf(order.status);
  if (idx === -1 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

/** Tailwind badge classes for admin/staff tables. */
export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending_payment: 'bg-amber-100 text-amber-900 border-amber-200',
  paid: 'bg-blue-100 text-blue-800 border-blue-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-orange-100 text-orange-800 border-orange-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  served: 'bg-teal-100 text-teal-800 border-teal-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export const ALL_ORDER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'paid',
  'pending',
  'accepted',
  'preparing',
  'ready',
  'served',
  'completed',
  'cancelled',
];

/** Map any status to kiosk column (null = hidden from kiosk). */
export function kioskColumnStatus(status: OrderStatus): OrderStatus | null {
  if (['completed', 'cancelled', 'served'].includes(status)) return null;
  if (status === 'pending' || status === 'pending_payment') return 'pending_payment';
  if (status === 'accepted' || status === 'paid') return 'paid';
  if (status === 'preparing' || status === 'ready') return status;
  return null;
}

export function formatPaymentMethod(method?: PaymentMethod): string {
  switch (method) {
    case 'gcash-qr':
      return 'GCash QR';
    case 'paymongo':
      return 'PayMongo';
    case 'pay-at-store':
      return 'Pay at store';
    default:
      return '—';
  }
}
