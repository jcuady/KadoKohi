import type { BookingEstimate, BookingEstimateLineItem } from '../types/domain';
import type { BookingPageKind } from './bookingPageKinds';
import { BOOKING_SERVICE_TAGS } from './bookingPageKinds';
import { newId } from './id';

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

function mapLineItem(raw: unknown): BookingEstimateLineItem | null {
  const row = asRecord(raw);
  const label = String(row.labelSnapshot ?? row.label_snapshot ?? '').trim();
  if (!label) return null;
  const qty = Number(row.qty ?? 1);
  const unitPrice = Number(row.unitPrice ?? row.unit_price ?? 0);
  const lineTotal = Number(row.lineTotal ?? row.line_total ?? qty * unitPrice);
  return {
    id: String(row.id ?? newId()),
    sourceType: (row.sourceType ?? row.source_type ?? 'custom') as BookingEstimateLineItem['sourceType'],
    sourceId: row.sourceId != null ? String(row.sourceId) : row.source_id != null ? String(row.source_id) : undefined,
    labelSnapshot: label,
    descriptionSnapshot:
      row.descriptionSnapshot != null
        ? String(row.descriptionSnapshot)
        : row.description_snapshot != null
          ? String(row.description_snapshot)
          : undefined,
    qty: Number.isFinite(qty) ? qty : 1,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
    lineTotal: Number.isFinite(lineTotal) ? lineTotal : 0,
  };
}

/** Coerce legacy/partial JSONB into a usable estimate (proposal rows often store `{}`). */
export function normalizeBookingEstimate(
  raw: unknown,
  opts?: { fallbackTotal?: number; shortCode?: string; createdAt?: string },
): BookingEstimate {
  const row = asRecord(raw);
  const now = opts?.createdAt ?? new Date().toISOString();
  const lineItems = Array.isArray(row.lineItems)
    ? row.lineItems.map(mapLineItem).filter((item): item is BookingEstimateLineItem => item != null)
    : Array.isArray(row.line_items)
      ? row.line_items.map(mapLineItem).filter((item): item is BookingEstimateLineItem => item != null)
      : [];

  const lineSum = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const subtotal = Number(row.subtotal ?? (lineSum > 0 ? lineSum : opts?.fallbackTotal ?? 0));
  const total = Number(row.total ?? subtotal ?? opts?.fallbackTotal ?? 0);
  const safeSubtotal = Number.isFinite(subtotal) ? subtotal : 0;
  const safeTotal = Number.isFinite(total) ? total : safeSubtotal;

  return {
    id: String(row.id ?? newId()),
    shortCode: String(row.shortCode ?? row.short_code ?? opts?.shortCode ?? 'PENDING'),
    branchId: row.branchId != null ? String(row.branchId) : row.branch_id != null ? String(row.branch_id) : undefined,
    lineItems,
    subtotal: safeSubtotal,
    tax: row.tax != null && Number.isFinite(Number(row.tax)) ? Number(row.tax) : undefined,
    total: safeTotal,
    assumptions: Array.isArray(row.assumptions) ? row.assumptions.map(String) : undefined,
    notes: row.notes != null ? String(row.notes) : undefined,
    status: (row.status ?? 'draft') as BookingEstimate['status'],
    validUntil: row.validUntil != null ? String(row.validUntil) : row.valid_until != null ? String(row.valid_until) : undefined,
    createdAt: String(row.createdAt ?? row.created_at ?? now),
    updatedAt: String(row.updatedAt ?? row.updated_at ?? now),
  };
}

export function resolveBookingKind(
  bookingKind: BookingPageKind | undefined,
  specialRequests?: string,
): BookingPageKind {
  if (bookingKind === 'coffee-cart' || bookingKind === 'matcha-bar') return bookingKind;
  const sr = specialRequests ?? '';
  if (sr.includes(BOOKING_SERVICE_TAGS['matcha-bar'])) return 'matcha-bar';
  if (sr.includes(BOOKING_SERVICE_TAGS['coffee-cart'])) return 'coffee-cart';
  return 'coffee-cart';
}

export function bookingInitialTotal(booking: { estimateSnapshot: BookingEstimate }): number {
  return booking.estimateSnapshot.total;
}

export function bookingQuotedTotal(booking: { finalQuote?: BookingEstimate }): number | undefined {
  if (!booking.finalQuote) return undefined;
  return Number.isFinite(booking.finalQuote.total) ? booking.finalQuote.total : undefined;
}
