import { describe, expect, it } from 'vitest';
import { normalizeBookingEstimate, resolveBookingKind } from './boothBookingEstimate';

describe('normalizeBookingEstimate', () => {
  it('fills missing totals from package base price', () => {
    const estimate = normalizeBookingEstimate({}, { fallbackTotal: 12500, shortCode: 'BK-1001' });
    expect(estimate.total).toBe(12500);
    expect(estimate.subtotal).toBe(12500);
    expect(estimate.shortCode).toBe('BK-1001');
  });

  it('preserves explicit totals from JSONB', () => {
    const estimate = normalizeBookingEstimate({ total: 8800, subtotal: 8000, short_code: 'BK-2002' });
    expect(estimate.total).toBe(8800);
    expect(estimate.subtotal).toBe(8000);
  });
});

describe('resolveBookingKind', () => {
  it('prefers stored booking kind', () => {
    expect(resolveBookingKind('matcha-bar', 'Coffee cart booking — hello')).toBe('matcha-bar');
  });

  it('infers matcha bar from special requests', () => {
    expect(resolveBookingKind(undefined, 'Matcha bar booking — wedding')).toBe('matcha-bar');
  });

  it('defaults to coffee cart', () => {
    expect(resolveBookingKind(undefined, 'Need espresso bar')).toBe('coffee-cart');
  });
});
