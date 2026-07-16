import type { PaymentMethod } from '../types/domain';

const STORAGE_KEY = 'kado.pendingPayments.v1';
const MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24h
const MAX_ITEMS = 12;

export type PendingPaymentItem = {
  orderId: string;
  shortCode: string;
  paymentMethod: PaymentMethod;
  total: number;
  channel: string;
  placedAt: string;
};

function readAll(): PendingPaymentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingPaymentItem[];
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter((item) => {
      if (!item?.orderId || !item.shortCode) return false;
      const age = now - new Date(item.placedAt).getTime();
      return Number.isFinite(age) && age >= 0 && age < MAX_AGE_MS;
    });
  } catch {
    return [];
  }
}

function writeAll(items: PendingPaymentItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // best-effort
  }
}

export function listPendingPayments(): PendingPaymentItem[] {
  return readAll().sort((a, b) => (a.placedAt < b.placedAt ? 1 : -1));
}

export function rememberPendingPayment(input: {
  orderId: string;
  shortCode: string;
  paymentMethod?: PaymentMethod;
  total: number;
  channel: string;
  placedAt?: string;
}): void {
  if (!input.paymentMethod) return;
  if (input.paymentMethod !== 'gcash-qr' && input.paymentMethod !== 'paymongo') return;

  const next: PendingPaymentItem = {
    orderId: input.orderId,
    shortCode: input.shortCode,
    paymentMethod: input.paymentMethod,
    total: input.total,
    channel: input.channel,
    placedAt: input.placedAt ?? new Date().toISOString(),
  };
  const rest = readAll().filter((item) => item.orderId !== next.orderId);
  writeAll([next, ...rest]);
  window.dispatchEvent(new Event('kado:pending-payments'));
}

export function clearPendingPayment(orderId: string): void {
  writeAll(readAll().filter((item) => item.orderId !== orderId));
  window.dispatchEvent(new Event('kado:pending-payments'));
}

export function getPendingPayment(orderId: string): PendingPaymentItem | null {
  return readAll().find((item) => item.orderId === orderId) ?? null;
}

export function checkoutPath(orderId: string, query?: Record<string, string>): string {
  const qs = query
    ? `?${new URLSearchParams(query).toString()}`
    : '';
  return `/checkout/${encodeURIComponent(orderId)}${qs}`;
}
