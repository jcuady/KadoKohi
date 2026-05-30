import type { Order, OrderItem } from '../types/domain';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { orderingRepo } from './supabase/repositories/ordering';

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
 *
 * Returns the updated order immediately (with stampsAwarded set) and resolves
 * the async DB write / fallback in the background.
 */
export function applyLoyaltyStampsForCompletedOrder(order: Order): Order {
  if (order.status !== 'completed') return order;
  if (order.loyaltyStampsAwarded !== undefined) return order;
  if (!order.customerId) return order;

  const delta = countDrinkStampsForOrder(order);
  const stampedOrder: Order = { ...order, loyaltyStampsAwarded: delta };

  if (delta <= 0) return stampedOrder;

  // Fire-and-forget async stamp credit. The returned order already has the
  // awarded count set so the DB patch for the order row is correct.
  void applyStampsAsync(order.customerId, delta);

  return stampedOrder;
}

async function applyStampsAsync(customerId: string, delta: number) {
  // Prefer local store (fast path) but fall back to a DB read so stamps are
  // awarded even when the customer hasn't been loaded into this device's store.
  let localCustomer = useUserStore.getState().getById(customerId);
  if (!localCustomer) {
    localCustomer = await orderingRepo.fetchUserById(customerId);
  }
  if (!localCustomer) return; // customer row doesn't exist — skip

  const nextStamps = (localCustomer.loyaltyStamps ?? 0) + delta;

  // Persist to DB.
  void orderingRepo.updateUserStamps(customerId, nextStamps);

  // Reflect in local stores.
  useUserStore.setState({
    users: useUserStore
      .getState()
      .users.map((u) => (u.id === customerId ? { ...u, loyaltyStamps: nextStamps } : u)),
  });
  const session = useAuthStore.getState().user;
  if (session?.id === customerId && session.role === 'customer') {
    useAuthStore.setState({ user: { ...session, loyaltyStamps: nextStamps } });
  }
}
