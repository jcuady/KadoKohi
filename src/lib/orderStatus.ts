import type { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../types/domain';

/** Fulfillment / kitchen flow */
export const FULFILLMENT_FLOW: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'served',
  'completed',
];

export const GCASH_FULFILLMENT_FLOW: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'completed'];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Awaiting payment',
  proof_submitted: 'Proof submitted',
  paid: 'Paid',
  refunded: 'Refunded',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  served: 'Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const PAYMENT_STATUS_BADGE: Record<PaymentStatus, string> = {
  unpaid: 'bg-amber-100 text-amber-900 border-amber-200',
  proof_submitted: 'bg-violet-100 text-violet-900 border-violet-200',
  paid: 'bg-blue-100 text-blue-800 border-blue-200',
  refunded: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-orange-100 text-orange-800 border-orange-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  served: 'bg-teal-100 text-teal-800 border-teal-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export const ALL_PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'proof_submitted', 'paid', 'refunded'];
export const ALL_ORDER_STATUSES: OrderStatus[] = [...FULFILLMENT_FLOW, 'cancelled'];

/** Migrate legacy combined status + infer defaults for new orders. */
export function normalizeOrderFields(
  raw: Partial<Order> & { status?: string },
): { status: OrderStatus; paymentStatus: PaymentStatus } {
  const legacyStatus = raw.status as string | undefined;
  let paymentStatus = raw.paymentStatus as PaymentStatus | undefined;
  let status = raw.status as OrderStatus | undefined;

  if (!paymentStatus) {
    if (legacyStatus === 'pending_payment') {
      paymentStatus = raw.paymentProofImage ? 'proof_submitted' : 'unpaid';
    } else if (legacyStatus === 'paid') {
      paymentStatus = 'paid';
    } else if (raw.paymentMethod === 'gcash-qr') {
      paymentStatus = raw.paymentProofImage ? 'proof_submitted' : 'unpaid';
      if (legacyStatus && ['accepted', 'preparing', 'ready', 'served', 'completed'].includes(legacyStatus)) {
        paymentStatus = 'paid';
      }
    } else {
      paymentStatus = 'paid';
    }
  }

  if (!status || legacyStatus === 'pending_payment' || legacyStatus === 'paid') {
    if (legacyStatus === 'paid') {
      status = 'accepted';
    } else if (legacyStatus === 'pending_payment') {
      status = 'pending';
    } else if (
      legacyStatus &&
      ['pending', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled'].includes(legacyStatus)
    ) {
      status = legacyStatus as OrderStatus;
    } else {
      status = paymentStatus === 'paid' ? 'accepted' : 'pending';
    }
  }

  return { status, paymentStatus };
}

export function isGcashOrder(order: Pick<Order, 'paymentMethod'>): boolean {
  return order.paymentMethod === 'gcash-qr';
}

export function fulfillmentFlowForOrder(order: Pick<Order, 'paymentMethod'>): OrderStatus[] {
  return isGcashOrder(order) ? GCASH_FULFILLMENT_FLOW : FULFILLMENT_FLOW;
}

export function nextFulfillmentStatus(order: Pick<Order, 'status' | 'paymentMethod'>): OrderStatus | null {
  const flow = fulfillmentFlowForOrder(order);
  const idx = flow.indexOf(order.status);
  if (idx === -1 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

/** Staff quick-advance: only when payment is settled (except cancelled path). */
export function nextStatusInFlow(order: Order): OrderStatus | null {
  if (order.status === 'cancelled' || order.status === 'completed') return null;
  if (isGcashOrder(order) && order.paymentStatus !== 'paid') return null;
  return nextFulfillmentStatus(order);
}

export type KanbanColumnId =
  | 'awaiting_payment'
  | 'proof_submitted'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export const KANBAN_COLUMNS: {
  id: KanbanColumnId;
  label: string;
}[] = [
  { id: 'awaiting_payment', label: 'Awaiting payment' },
  { id: 'proof_submitted', label: 'Verify payment' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function kanbanColumnForOrder(order: Order): KanbanColumnId {
  if (order.status === 'cancelled') return 'cancelled';
  if (order.status === 'completed') return 'completed';
  if (order.paymentStatus === 'unpaid') return 'awaiting_payment';
  if (order.paymentStatus === 'proof_submitted') return 'proof_submitted';
  if (order.status === 'preparing') return 'preparing';
  if (order.status === 'ready' || order.status === 'served') return 'ready';
  return 'accepted';
}

/** Kiosk display buckets (payment + prep). */
export function kioskColumnKey(order: Order): 'awaiting_payment' | 'paid_queue' | 'preparing' | 'ready' | null {
  if (['completed', 'cancelled', 'served'].includes(order.status)) return null;
  if (order.paymentStatus === 'unpaid' || order.paymentStatus === 'proof_submitted') return 'awaiting_payment';
  if (order.status === 'preparing') return 'preparing';
  if (order.status === 'ready') return 'ready';
  if (order.paymentStatus === 'paid') return 'paid_queue';
  return 'awaiting_payment';
}

export type KioskDisplayColumn = 'preparing' | 'pickup';

/** Customer-facing kiosk: only active prep + ready-for-pickup (paid orders). */
export function kioskDisplayColumnKey(order: Order): KioskDisplayColumn | null {
  if (['completed', 'cancelled', 'served'].includes(order.status)) return null;
  if (order.paymentStatus === 'unpaid' || order.paymentStatus === 'proof_submitted') return null;
  if (isGcashOrder(order) && order.paymentStatus !== 'paid') return null;
  if (order.status === 'preparing') return 'preparing';
  if (order.status === 'ready') return 'pickup';
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

export function defaultFieldsForNewOrder(paymentMethod?: PaymentMethod): {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
} {
  if (paymentMethod === 'gcash-qr') {
    return { status: 'pending', paymentStatus: 'unpaid' };
  }
  return { status: 'pending', paymentStatus: 'paid' };
}

/** Guest QR / takeout may cancel until staff moves the order past pending. */
export function canGuestCancelOrder(order: Pick<Order, 'status' | 'channel'>): boolean {
  return (order.channel === 'dine-in' || order.channel === 'takeout') && order.status === 'pending';
}
