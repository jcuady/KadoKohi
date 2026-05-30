/**
 * Per-browser ("session") tracking of a placed order for the QR dine-in and
 * takeout pages. A guest has no account, so the browser's localStorage is the
 * only place we can remember "the order I just placed" across a refresh.
 *
 * One active order is tracked per context key (e.g. a specific table or a
 * branch takeout page) so each browser sees its own order status until it is
 * cleared via "Order again".
 */
const PREFIX = 'kado.order.';
const MAX_AGE_MS = 1000 * 60 * 60 * 6; // 6h — drop stale references on next visit.

export type TrackedOrderRef = {
  orderId: string;
  shortCode: string;
  label: string;
  placedAt: string;
};

function keyFor(context: string): string {
  return `${PREFIX}${context}`;
}

export function getTrackedOrder(context: string): TrackedOrderRef | null {
  try {
    const raw = localStorage.getItem(keyFor(context));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrackedOrderRef;
    if (!parsed?.orderId) return null;
    if (Date.now() - new Date(parsed.placedAt).getTime() > MAX_AGE_MS) {
      localStorage.removeItem(keyFor(context));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setTrackedOrder(context: string, ref: TrackedOrderRef): void {
  try {
    localStorage.setItem(keyFor(context), JSON.stringify(ref));
  } catch {
    // Ignore quota / private-mode failures — tracking is best-effort.
  }
}

export function clearTrackedOrder(context: string): void {
  try {
    localStorage.removeItem(keyFor(context));
  } catch {
    // no-op
  }
}
