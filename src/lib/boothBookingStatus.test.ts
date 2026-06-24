import { describe, expect, it } from 'vitest';
import type { BoothBooking } from '../types/domain';
import {
  customerCanUploadProof,
  customerShouldPay,
  customerShowsPaymentPanel,
} from './boothBookingStatus';

function estimate(total: number) {
  const now = '2026-01-01T00:00:00.000Z';
  return {
    id: 'est-1',
    shortCode: 'BK-1001',
    lineItems: [],
    subtotal: total,
    total,
    status: 'sent' as const,
    createdAt: now,
    updatedAt: now,
  };
}

function booking(overrides: Partial<BoothBooking> = {}): BoothBooking {
  return {
    id: 'b1',
    shortCode: 'BK-1001',
    bookingKind: 'coffee-cart',
    contactName: 'Test',
    contactEmail: 'test@example.com',
    contactPhone: '0917',
    eventName: 'Event',
    occasion: 'other',
    guestCount: 20,
    eventDate: '2026-07-01T00:00:00.000Z',
    startsAt: '2026-07-01T02:00:00.000Z',
    endsAt: '2026-07-01T06:00:00.000Z',
    packageId: 'pkg',
    packageNameSnapshot: 'Package',
    packageBasePriceSnapshot: 0,
    selectedAddons: [],
    estimateSnapshot: estimate(5000),
    status: 'quoted',
    paymentMethod: 'gcash-or-bank',
    paymentStatus: 'unpaid',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('booth payment customer flow', () => {
  it('shows pay panel when quoted and unpaid', () => {
    const b = booking({ finalQuote: estimate(8000) });
    expect(customerShouldPay(b)).toBe(true);
    expect(customerShowsPaymentPanel(b)).toBe(true);
    expect(customerCanUploadProof(b)).toBe(true);
  });

  it('keeps payment panel after proof submitted', () => {
    const b = booking({
      paymentStatus: 'proof_submitted',
      finalQuote: estimate(8000),
    });
    expect(customerShouldPay(b)).toBe(false);
    expect(customerShowsPaymentPanel(b)).toBe(true);
    expect(customerCanUploadProof(b)).toBe(true);
  });

  it('hides panel when paid', () => {
    const b = booking({ paymentStatus: 'paid', status: 'confirmed' });
    expect(customerShowsPaymentPanel(b)).toBe(false);
    expect(customerCanUploadProof(b)).toBe(false);
  });
});
