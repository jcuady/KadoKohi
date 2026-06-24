import type { BoothBooking } from '../types/domain';
import type { AppSettings } from '../store/settingsStore';
import type { BoothQuoteEmailInput } from './boothQuoteEmail';
import { boothAmountDue } from './boothPayment';
import { bookingQuotedTotal } from './boothBookingEstimate';

export function toBoothQuoteEmailInput(
  booking: BoothBooking,
  settings: Pick<AppSettings, 'boothPayment' | 'gcashQrImage'>,
  opts?: { customMessage?: string; quotedTotal?: number; amountDue?: number },
): BoothQuoteEmailInput {
  const quotedTotal = opts?.quotedTotal ?? bookingQuotedTotal(booking) ?? booking.estimateSnapshot.total;
  const amountDue = opts?.amountDue ?? boothAmountDue(booking) ?? quotedTotal;
  return {
    booking,
    quotedTotal,
    amountDue,
    customMessage: opts?.customMessage,
    boothPayment: settings.boothPayment,
    shopGcashQr: settings.gcashQrImage,
  };
}
