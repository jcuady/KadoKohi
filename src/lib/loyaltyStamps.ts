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
 * Optimistic local stamp count when an order becomes completed.
 * Persist via {@link persistLoyaltyStampsForCompletedOrder} AFTER status is saved.
 */
export function applyLoyaltyStampsForCompletedOrder(order: Order): Order {
  if (order.status !== 'completed') return order;
  if (order.loyaltyStampsAwarded !== undefined) return order;
  if (!order.customerId) return order;

  const delta = countDrinkStampsForOrder(order);
  return { ...order, loyaltyStampsAwarded: delta };
}

/**
 * Server-side idempotent stamp award (call after order.status = completed is persisted).
 * @returns error message for staff UI when award fails; null on success / no-op.
 */
export async function persistLoyaltyStampsForCompletedOrder(
  order: Pick<Order, 'id' | 'customerId'>,
): Promise<string | null> {
  if (!order.customerId) return null;
  try {
    const result = await orderingRepo.awardLoyaltyStamps(order.id);
    if (!result || result.already || result.awarded <= 0) return null;

    const customerId = order.customerId;
    let localCustomer = useUserStore.getState().getById(customerId);
    if (!localCustomer) {
      localCustomer = await orderingRepo.fetchUserById(customerId);
    }
    if (!localCustomer) return null;

    const nextStamps = (localCustomer.loyaltyStamps ?? 0) + result.awarded;
    useUserStore.setState({
      users: useUserStore
        .getState()
        .users.map((u) => (u.id === customerId ? { ...u, loyaltyStamps: nextStamps } : u)),
    });
    const session = useAuthStore.getState().user;
    if (session?.id === customerId && session.role === 'customer') {
      useAuthStore.setState({ user: { ...session, loyaltyStamps: nextStamps } });
    }
    return null;
  } catch (err) {
    // Completion already persisted; surface so staff can retry via Stamps / re-save completed.
    const detail = err instanceof Error && err.message.trim() ? err.message.trim() : null;
    return detail
      ? `Order completed, but loyalty stamps failed: ${detail}`
      : 'Order completed, but loyalty stamps failed. Open Stamps or re-save completed to retry.';
  }
}
