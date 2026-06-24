import type { BoothBooking, BoothBookingStatus, BookingEstimate } from '../types/domain';
import { normalizeBookingEstimate } from './boothBookingEstimate';
import { boothAmountDue } from './boothPayment';

export const BOOTH_BOOKING_STATUS_LABELS: Record<BoothBookingStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  quoted: 'Quote sent',
  awaiting_confirmation: 'Awaiting your confirmation',
  confirmed: 'Confirmed',
  declined: 'Declined',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export const BOOTH_BOOKING_STATUS_CUSTOMER: Record<BoothBookingStatus, string> = {
  submitted: 'We received your proposal. Email us or wait for our team to reply about pricing and details.',
  under_review: 'We are reviewing your event and preparing a quote to discuss with you.',
  quoted: 'We sent a quote — reply by email or call us to confirm or adjust.',
  awaiting_confirmation: 'Almost set — confirm with us by email or phone when you are ready.',
  confirmed: 'Your event date is confirmed. See you on the day!',
  declined: 'This proposal was declined. Contact us if you have questions.',
  cancelled: 'This proposal was cancelled.',
  completed: 'Thank you — your event is marked complete.',
};

export const BOOTH_STATUS_BADGE: Record<BoothBookingStatus, string> = {
  submitted: 'bg-amber-50 text-amber-800 border-amber-200',
  under_review: 'bg-blue-50 text-blue-800 border-blue-200',
  quoted: 'bg-violet-50 text-violet-800 border-violet-200',
  awaiting_confirmation: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  completed: 'bg-emerald-50 text-emerald-900 border-emerald-200',
};

export const ALL_BOOTH_BOOKING_STATUSES: BoothBookingStatus[] = [
  'submitted',
  'under_review',
  'quoted',
  'awaiting_confirmation',
  'confirmed',
  'declined',
  'cancelled',
  'completed',
];

/** Price shown to customer — official quote when set, otherwise initial estimate. */
export function getBookingDisplayEstimate(booking: BoothBooking): BookingEstimate {
  if (booking.finalQuote) {
    return normalizeBookingEstimate(booking.finalQuote, {
      fallbackTotal: booking.estimateSnapshot.total,
      shortCode: booking.shortCode,
      createdAt: booking.createdAt,
    });
  }
  return booking.estimateSnapshot;
}

export function isOfficialQuote(booking: BoothBooking): boolean {
  return !!booking.finalQuote;
}

export function customerShouldCallAdmin(status: BoothBookingStatus): boolean {
  return ['submitted', 'under_review', 'quoted', 'awaiting_confirmation'].includes(status);
}

export function customerShouldPay(booking: BoothBooking): boolean {
  return (
    ['quoted', 'awaiting_confirmation'].includes(booking.status) &&
    booking.paymentStatus === 'unpaid'
  );
}

export function customerCanUploadProof(booking: BoothBooking): boolean {
  return (
    ['quoted', 'awaiting_confirmation'].includes(booking.status) &&
    (booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'proof_submitted')
  );
}

/** Customer account payment block — quote sent, amount due, not yet settled. */
export function customerShowsPaymentPanel(booking: BoothBooking): boolean {
  if (!['quoted', 'awaiting_confirmation'].includes(booking.status)) return false;
  if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded') return false;
  const due = boothAmountDue(booking);
  return due != null && due > 0;
}
