import type { BoothBooking, BoothPaymentMethod } from '../types/domain';
import type { BoothPaymentConfig } from '../store/settingsStore';
import { bookingQuotedTotal } from './boothBookingEstimate';

export function boothAmountDue(booking: BoothBooking): number | null {
  if (booking.paymentAmount != null && booking.paymentAmount >= 0) return booking.paymentAmount;
  const quoted = bookingQuotedTotal(booking);
  return quoted ?? null;
}

export function resolveBoothGcashQr(settings: {
  gcashQrImage: string;
  boothPayment?: BoothPaymentConfig;
}): string {
  const booth = settings.boothPayment;
  if (booth?.gcashEnabled) {
    return booth.gcashQrImage?.trim() || settings.gcashQrImage;
  }
  return settings.gcashQrImage;
}

export function boothPaymentMethodLabel(method: BoothPaymentMethod): string {
  if (method === 'gcash-qr') return 'GCash';
  if (method === 'bank-transfer') return 'Bank transfer';
  return 'GCash or bank transfer';
}
