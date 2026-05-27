import type { BoothBooking, BoothBookingStatus, BookingEstimate } from '../types/domain';

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
  submitted: 'We received your request. Our team will review your estimate shortly.',
  under_review: 'We are reviewing your event details and preparing a quote.',
  quoted: 'Your official quote is ready. Call us to confirm or ask questions.',
  awaiting_confirmation: 'Please confirm your booking. Call us if you need changes.',
  confirmed: 'Your booth booking is confirmed. See you on your event date!',
  declined: 'This request was declined. Contact us if you have questions.',
  cancelled: 'This booking was cancelled.',
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
  return booking.finalQuote ?? booking.estimateSnapshot;
}

export function isOfficialQuote(booking: BoothBooking): boolean {
  return !!booking.finalQuote;
}

export function customerShouldCallAdmin(status: BoothBookingStatus): boolean {
  return ['submitted', 'under_review', 'quoted', 'awaiting_confirmation'].includes(status);
}
