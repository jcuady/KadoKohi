import type { Order } from '../types/domain';
import { isGcashOrder, orderNeedsCustomerPayment } from './orderStatus';

/** True only when the account orders page should open the manual GCash QR modal. */
export function shouldOpenGcashQrModal(
  order: Pick<Order, 'paymentMethod' | 'paymentStatus' | 'status'> | null | undefined,
): boolean {
  if (!order) return false;
  return isGcashOrder(order) && orderNeedsCustomerPayment(order);
}
