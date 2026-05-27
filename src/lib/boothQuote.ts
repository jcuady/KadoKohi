import type { BookingEstimate } from '../types/domain';
import { newId } from './id';

/** Build official quote from estimate + admin-adjusted total. */
export function buildFinalQuote(
  estimate: BookingEstimate,
  officialTotal: number,
  quoteNotes?: string,
): BookingEstimate {
  const diff = officialTotal - estimate.total;
  const lineItems = [...estimate.lineItems];

  if (Math.abs(diff) >= 1) {
    lineItems.push({
      id: newId(),
      sourceType: 'custom',
      labelSnapshot: diff > 0 ? 'Quote adjustment' : 'Quote discount',
      qty: 1,
      unitPrice: diff,
      lineTotal: diff,
    });
  }

  const now = new Date().toISOString();
  return {
    ...estimate,
    id: newId(),
    shortCode: `QT-${Math.floor(1000 + Math.random() * 9000)}`,
    lineItems,
    subtotal: officialTotal,
    tax: 0,
    total: officialTotal,
    notes: quoteNotes?.trim() || estimate.notes,
    status: 'sent',
    updatedAt: now,
    createdAt: now,
  };
}
