/** Guest-initiated cancel / change-order reason codes (stored on kk_orders + audit). */
import type { Order } from '../types/domain';

export type GuestOrderAction = 'cancel' | 'change_order';

export type GuestOrderActionReason =
  | 'changed_mind'
  | 'taking_too_long'
  | 'wrong_item'
  | 'add_or_remove_items'
  | 'other';

export const GUEST_ORDER_ACTION_REASONS: {
  id: GuestOrderActionReason;
  label: string;
  /** Shown for change-order flow; hidden for pure cancel when not relevant. */
  changeOnly?: boolean;
}[] = [
  { id: 'add_or_remove_items', label: 'I want to add or remove items', changeOnly: true },
  { id: 'wrong_item', label: 'I ordered the wrong drink' },
  { id: 'changed_mind', label: 'I changed my mind' },
  { id: 'taking_too_long', label: "It's taking too long" },
  { id: 'other', label: 'Other' },
];

export function guestActionReasonLabel(reason: string | undefined): string {
  return GUEST_ORDER_ACTION_REASONS.find((r) => r.id === reason)?.label ?? reason ?? '—';
}

export function formatGuestOrderActionSummary(
  order: Pick<Order, 'guestAction' | 'guestActionReason' | 'guestActionNote'>,
): string | null {
  if (!order.guestAction || !order.guestActionReason) return null;
  const verb = order.guestAction === 'change_order' ? 'Guest changed order' : 'Guest cancelled';
  const reason = guestActionReasonLabel(order.guestActionReason);
  return order.guestActionNote ? `${verb}: ${reason} — ${order.guestActionNote}` : `${verb}: ${reason}`;
}

export function reasonsForGuestAction(action: GuestOrderAction) {
  return GUEST_ORDER_ACTION_REASONS.filter((r) => !r.changeOnly || action === 'change_order');
}
