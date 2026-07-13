import type { BoothBooking, BoothPaymentMethod } from '../types/domain';
import type { BoothPaymentConfig } from '../store/settingsStore';
import type { BookingPageKind } from './bookingPageKinds';
import { BOOKING_PAGE_LABELS } from './bookingPageKinds';
import { resolveBookingKind } from './boothBookingEstimate';
import { buildBoothPaymentInstructionsHtml, buildBoothPaymentInstructionsPlain } from './boothPaymentEmail';
import { formatPhp } from './money';

export type BoothQuoteEmailInput = {
  booking: Pick<
    BoothBooking,
    | 'shortCode'
    | 'bookingKind'
    | 'specialRequests'
    | 'contactName'
    | 'contactEmail'
    | 'eventName'
    | 'guestCount'
    | 'eventDate'
    | 'startsAt'
    | 'endsAt'
    | 'quoteNotes'
    | 'paymentMethod'
  >;
  quotedTotal: number;
  amountDue: number;
  customMessage?: string;
  boothPayment?: BoothPaymentConfig;
  shopGcashQr?: string;
};

function serviceLabel(booking: BoothQuoteEmailInput['booking']): string {
  const kind = resolveBookingKind(booking.bookingKind as BookingPageKind, booking.specialRequests);
  return BOOKING_PAGE_LABELS[kind];
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeRange(startsAt: string, endsAt: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${new Date(startsAt).toLocaleTimeString('en-PH', opts)} – ${new Date(endsAt).toLocaleTimeString('en-PH', opts)}`;
}

export function buildBoothQuoteEmailPlain(input: BoothQuoteEmailInput): { subject: string; body: string } {
  const { booking, quotedTotal, amountDue, customMessage, boothPayment } = input;
  const subject = `Your Kado Kohi event quote — ${booking.shortCode}`;
  const lines = [
    `Hi ${booking.contactName},`,
    '',
    `Thank you for your interest in Kado Kohi ${serviceLabel(booking)}.`,
    '',
    `Reference: ${booking.shortCode}`,
    `Event: ${booking.eventName}`,
    `Date: ${formatEventDate(booking.eventDate)}`,
    `Time: ${formatTimeRange(booking.startsAt, booking.endsAt)}`,
    `Guests: ${booking.guestCount}`,
    '',
    `Quoted total: ${formatPhp(quotedTotal)}`,
    amountDue !== quotedTotal ? `Amount due now: ${formatPhp(amountDue)}` : undefined,
    customMessage?.trim() ? '' : undefined,
    customMessage?.trim() || undefined,
    booking.quoteNotes?.trim() ? '' : undefined,
    booking.quoteNotes?.trim() ? booking.quoteNotes.trim() : undefined,
    ...buildBoothPaymentInstructionsPlain({
      shortCode: booking.shortCode,
      amountDue,
      paymentMethod: booking.paymentMethod,
      boothPayment,
    }),
    '',
    'Reply to this email or visit kadokohi.com/account/booth to upload payment proof.',
    '',
    'Warm regards,',
    'Kado Kohi Events Team',
    'kadocoffeeph@gmail.com',
  ].filter((line) => line !== undefined) as string[];

  return { subject, body: lines.join('\n') };
}

export function buildBoothQuoteEmailHtml(input: BoothQuoteEmailInput): string {
  const { booking, quotedTotal, amountDue, customMessage, boothPayment, shopGcashQr } = input;
  const msg = customMessage?.trim() || booking.quoteNotes?.trim();
  const paymentBlock = buildBoothPaymentInstructionsHtml({
    shortCode: booking.shortCode,
    amountDue,
    paymentMethod: booking.paymentMethod,
    boothPayment,
    shopGcashQr,
  });
  return `
    <div style="font-family:system-ui,sans-serif;color:#191919;max-width:560px">
      <p style="font-size:22px;font-weight:bold;color:#9E181D;margin:0 0 8px">Kado Kohi</p>
      <p style="margin:0 0 20px;font-size:14px;color:#666">Your event quote</p>
      <p>Hi <strong>${escapeHtml(booking.contactName)}</strong>,</p>
      <p>Thank you for your interest in our <strong>${escapeHtml(serviceLabel(booking))}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
        <tr><td style="padding:6px 0;color:#666">Reference</td><td style="padding:6px 0;font-weight:600">${escapeHtml(booking.shortCode)}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Event</td><td style="padding:6px 0">${escapeHtml(booking.eventName)}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Date</td><td style="padding:6px 0">${escapeHtml(formatEventDate(booking.eventDate))}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Time</td><td style="padding:6px 0">${escapeHtml(formatTimeRange(booking.startsAt, booking.endsAt))}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Guests</td><td style="padding:6px 0">${booking.guestCount}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Quoted total</td><td style="padding:6px 0;font-size:18px;font-weight:bold;color:#9E181D">${escapeHtml(formatPhp(quotedTotal))}</td></tr>
        ${amountDue !== quotedTotal ? `<tr><td style="padding:6px 0;color:#666">Amount due</td><td style="padding:6px 0;font-weight:600">${escapeHtml(formatPhp(amountDue))}</td></tr>` : ''}
      </table>
      ${msg ? `<p style="background:#FAF9F6;padding:12px 14px;border-radius:8px;font-size:14px;line-height:1.5">${escapeHtml(msg).replace(/\n/g, '<br/>')}</p>` : ''}
      ${paymentBlock}
      <p style="font-size:13px;color:#666;margin-top:20px">Upload payment proof at <a href="https://www.kadokohi.com/account/booth">your account</a> or reply to confirm.</p>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type BoothProposalSubmittedInput = {
  referenceCode: string;
  bookingKind: BookingPageKind;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  eventName: string;
  guestCount: number;
  eventDate: string;
  startTime: string;
  endTime: string;
  message?: string;
};

export function buildBoothProposalTeamHtml(input: BoothProposalSubmittedInput): string {
  return `
    <p><strong>New booth proposal</strong> (${escapeHtml(BOOKING_PAGE_LABELS[input.bookingKind])})</p>
    <p><strong>Reference:</strong> ${escapeHtml(input.referenceCode)}</p>
    <p><strong>Contact:</strong> ${escapeHtml(input.contactName)} · ${escapeHtml(input.contactEmail)} · ${escapeHtml(input.contactPhone)}</p>
    <p><strong>Event:</strong> ${escapeHtml(input.eventName)} · ${input.guestCount} guests</p>
    <p><strong>Date:</strong> ${escapeHtml(input.eventDate)} · ${escapeHtml(input.startTime)}–${escapeHtml(input.endTime)}</p>
    ${input.message ? `<p><strong>Notes:</strong><br/>${escapeHtml(input.message).replace(/\n/g, '<br/>')}</p>` : ''}
    <p>Review in <a href="https://www.kadokohi.com/admin/booth-bookings">Admin → Event Proposals</a>.</p>
  `;
}
