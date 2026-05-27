import type { Order, OrderItem } from '../types/domain';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';

/** True when the line item counts as a drink toward Kado Circle stamps. */
export function isDrinkLineItem(item: OrderItem, orderChannel: Order['channel']): boolean {
  const type = item.itemType ?? (orderChannel === 'merch' ? 'merch' : 'coffee');
  return type !== 'merch';
}

/** Stamps earned = drink quantity only (not merch, not per-order flat rate). */
export function countDrinkStampsForOrder(order: Pick<Order, 'channel' | 'items'>): number {
  if (order.channel === 'merch') return 0;
  return order.items.reduce((sum, item) => {
    if (!isDrinkLineItem(item, order.channel)) return sum;
    return sum + Math.max(0, item.qty);
  }, 0);
}

/**
 * When an order becomes completed, award drink-based stamps to the customer account.
 * Idempotent via `loyaltyStampsAwarded` on the order.
 */
export function applyLoyaltyStampsForCompletedOrder(order: Order): Order {
  if (order.status !== 'completed') return order;
  if (order.loyaltyStampsAwarded !== undefined) return order;
  if (!order.customerId) return order;

  const delta = countDrinkStampsForOrder(order);
  const stampedOrder: Order = { ...order, loyaltyStampsAwarded: delta };

  if (delta <= 0) return stampedOrder;

  const customer = useUserStore.getState().getById(order.customerId);
  if (!customer) return stampedOrder;

  const nextStamps = (customer.loyaltyStamps ?? 0) + delta;
  useUserStore.getState().updateUser(order.customerId, { loyaltyStamps: nextStamps });

  const session = useAuthStore.getState().user;
  if (session?.id === order.customerId && session.role === 'customer') {
    useAuthStore.setState({ user: { ...session, loyaltyStamps: nextStamps } });
  }

  return stampedOrder;
}
