import { describe, expect, it } from 'vitest';
import { shouldOpenGcashQrModal } from './shouldOpenGcashQrModal';

describe('shouldOpenGcashQrModal', () => {
  it('opens only for unpaid GCash QR orders', () => {
    expect(
      shouldOpenGcashQrModal({
        paymentMethod: 'gcash-qr',
        paymentStatus: 'unpaid',
        status: 'pending',
      }),
    ).toBe(true);
  });

  it('stays closed for paid PayMongo QR Ph orders', () => {
    expect(
      shouldOpenGcashQrModal({
        paymentMethod: 'paymongo',
        paymentStatus: 'paid',
        status: 'accepted',
      }),
    ).toBe(false);
  });

  it('stays closed when order is missing', () => {
    expect(shouldOpenGcashQrModal(null)).toBe(false);
  });
});
