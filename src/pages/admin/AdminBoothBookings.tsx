import { useEffect, useMemo, useState } from 'react';
import type { BoothBookingStatus } from '../../types/domain';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import {
  ALL_BOOTH_BOOKING_STATUSES,
  BOOTH_BOOKING_STATUS_LABELS,
  BOOTH_STATUS_BADGE,
  isOfficialQuote,
} from '../../lib/boothBookingStatus';
import { BOOKING_PAGE_LABELS, type BookingPageKind } from '../../lib/bookingPageKinds';
import { bookingInitialTotal, bookingQuotedTotal, resolveBookingKind } from '../../lib/boothBookingEstimate';
import { formatPhp } from '../../lib/money';
import BoothBookingManageModal from '../../components/admin/BoothBookingManageModal';
import EventAvailabilityCalendar from '../../components/booking/EventAvailabilityCalendar';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminBoothBookings() {
  const bookings = useBoothBookingStore((s) => s.bookings);
  const hydrateFromRemote = useBoothBookingStore((s) => s.hydrateFromRemote);

  const [statusFilter, setStatusFilter] = useState<BoothBookingStatus | 'all'>('all');
  const [kindFilter, setKindFilter] = useState<BookingPageKind | 'all'>('all');
  const [manageId, setManageId] = useState<string | null>(null);

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

  const filtered = useMemo(() => {
    let list = bookings;
    if (kindFilter !== 'all') {
      list = list.filter((b) => resolveBookingKind(b.bookingKind, b.specialRequests) === kindFilter);
    }
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [bookings, statusFilter, kindFilter]);

  const manageBooking = manageId ? bookings.find((b) => b.id === manageId) ?? null : null;

  return (
    <div className="max-w-6xl dash-page">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Event Proposals</h1>
      <p className="dash-muted text-sm mb-6">
        Review coffee cart and matcha bar proposals, manage the availability calendar, and send official quotes when ready.
      </p>

      <div className="mb-10 max-w-md">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red mb-2">Availability calendar</p>
        <p className="text-xs dash-muted mb-3">Only admins can block or reopen dates. Confirmed bookings show as booked.</p>
        <EventAvailabilityCalendar adminMode />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as BookingPageKind | 'all')}
          className="rounded-xl dash-input border px-4 py-2 text-sm font-semibold"
        >
          <option value="all">All services</option>
          <option value="coffee-cart">{BOOKING_PAGE_LABELS['coffee-cart']}</option>
          <option value="matcha-bar">{BOOKING_PAGE_LABELS['matcha-bar']}</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BoothBookingStatus | 'all')}
          className="rounded-xl dash-input border px-4 py-2 text-sm font-semibold"
        >
          <option value="all">All statuses</option>
          {ALL_BOOTH_BOOKING_STATUSES.map((status) => (
            <option key={status} value={status}>
              {BOOTH_BOOKING_STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <span className="self-center text-xs dash-muted font-semibold">
          {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl dash-card border p-12 text-center">
          <p className="text-sm dash-muted">No bookings match your filters.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((booking) => {
            const kind = resolveBookingKind(booking.bookingKind, booking.specialRequests);
            const quotedTotal = bookingQuotedTotal(booking);
            return (
              <li key={booking.id} className="rounded-2xl dash-card border p-5">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-display font-bold dash-heading text-lg">{booking.shortCode}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border bg-kado-cream text-kado-dark border-kado-dark/15">
                        {kind === 'matcha-bar' ? 'Matcha bar' : 'Coffee cart'}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${BOOTH_STATUS_BADGE[booking.status]}`}
                      >
                        {BOOTH_BOOKING_STATUS_LABELS[booking.status]}
                      </span>
                      {isOfficialQuote(booking) && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                          Quoted
                        </span>
                      )}
                      <span className="text-xs dash-muted">{timeAgo(booking.createdAt)}</span>
                    </div>
                    <p className="text-sm dash-muted">
                      {booking.eventName} · {booking.occasion.replace('_', ' ')} · {booking.guestCount} guests
                    </p>
                    <p className="text-xs dash-muted mt-1">
                      {booking.contactName} · {booking.contactEmail} · {booking.contactPhone}
                    </p>
                    <p className="text-[10px] dash-muted mt-2">
                      Est. {formatPhp(bookingInitialTotal(booking))}
                      {quotedTotal != null && (
                        <> → Quote {formatPhp(quotedTotal)}</>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setManageId(booking.id)}
                    className="shrink-0 rounded-xl bg-kado-dark text-kado-cream px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-kado-red transition-colors"
                  >
                    Manage
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <BoothBookingManageModal booking={manageBooking} onClose={() => setManageId(null)} />
    </div>
  );
}
