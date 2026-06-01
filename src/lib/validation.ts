const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  const v = value.trim();
  return v.length > 0 && v.length <= 254 && EMAIL_RE.test(v);
}

export function clampText(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

export function requireNonEmpty(value: string, fieldLabel: string): string | null {
  const v = value.trim();
  if (!v) return `${fieldLabel} is required.`;
  return null;
}

export function requireGuestName(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Please enter your name for pickup.';
  if (v.length > 80) return 'Name must be 80 characters or fewer.';
  return null;
}

export function clampTaxRate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function clampPositiveInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

/** Map Supabase / PostgREST errors to short user-facing copy. */
export function formatOrderError(err: unknown): string {
  const msg =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: string }).message)
      : '';
  if (!msg) return 'Could not place your order. Please check your connection and try again.';
  if (/guest name/i.test(msg)) return msg;
  if (/product.*not available/i.test(msg)) return 'An item in your cart is no longer available. Refresh and try again.';
  if (/branch is not active/i.test(msg)) return 'This location is not accepting orders right now.';
  if (/promo/i.test(msg)) return msg;
  if (/between 1 and 50 items/i.test(msg)) return 'Your cart is empty or too large.';
  return msg.length < 120 ? msg : 'Could not place your order. Please try again.';
}
