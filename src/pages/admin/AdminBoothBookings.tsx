import { useEffect, useMemo, useState } from 'react';
import type { BoothBookingStatus, PaymentStatus } from '../../types/domain';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import {
  ALL_BOOTH_BOOKING_STATUSES,
  BOOTH_BOOKING_STATUS_LABELS,
  BOOTH_STATUS_BADGE,
  isOfficialQuote,
} from '../../lib/boothBookingStatus';
import { ALL_PAYMENT_STATUSES, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_BADGE } from '../../lib/orderStatus';
import { BOOKING_PAGE_LABELS, type BookingPageKind } from '../../lib/bookingPageKinds';
import { bookingInitialTotal, bookingQuotedTotal, resolveBookingKind } from '../../lib/boothBookingEstimate';
import { boothAmountDue } from '../../lib/boothPayment';
import { formatPhp } from '../../lib/money';
import BoothBookingManageModal from '../../components/admin/BoothBookingManageModal';
import AdminBoothDayModal from '../../components/admin/AdminBoothDayModal';
import EventAvailabilityCalendar from '../../components/booking/EventAvailabilityCalendar';
import { useEventCalendarStore } from '../../store/eventCalendarStore';
import type { EventCalendarMonth } from '../../lib/eventCalendar';
import { Search, X } from 'lucide-react';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function hasActiveFilters(
  search: string,
  kindFilter: BookingPageKind | 'all',
  statusFilter: BoothBookingStatus | 'all',
  paymentFilter: PaymentStatus | 'all',
  dateFilter: string | null,
): boolean {
  return (
    search.trim().length > 0 ||
    kindFilter !== 'all' ||
    statusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    dateFilter != null
  );
}

export default function AdminBoothBookings() {
  const bookings = useBoothBookingStore((s) => s.bookings);
  const hydrateFromRemote = useBoothBookingStore((s) => s.hydrateFromRemote);

  const [statusFilter, setStatusFilter] = useState<BoothBookingStatus | 'all'>('all');
  const [kindFilter, setKindFilter] = useState<BookingPageKind | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [manageId, setManageId] = useState<string | null>(null);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [calendarVersion, setCalendarVersion] = useState(0);
  const [monthSnapshot, setMonthSnapshot] = useState<EventCalendarMonth | null>(null);
  const refreshMonth = useEventCalendarStore((s) => s.refreshMonth);

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = bookings;
    if (kindFilter !== 'all') {
      list = list.filter((b) => resolveBookingKind(b.bookingKind, b.specialRequests) === kindFilter);
    }
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    if (paymentFilter !== 'all') list = list.filter((b) => b.paymentStatus === paymentFilter);
    if (dateFilter) list = list.filter((b) => b.eventDate.slice(0, 10) === dateFilter);
    if (q) {
      list = list.filter(
        (b) =>
          b.shortCode.toLowerCase().includes(q) ||
          b.contactName.toLowerCase().includes(q) ||
          b.contactEmail.toLowerCase().includes(q) ||
          b.eventName.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [bookings, statusFilter, kindFilter, paymentFilter, dateFilter, search]);

  const manageBooking = manageId ? bookings.find((b) => b.id === manageId) ?? null : null;
  const filtersActive = hasActiveFilters(search, kindFilter, statusFilter, paymentFilter, dateFilter);

  const clearFilters = () => {
    setSearch('');
    setKindFilter('all');
    setStatusFilter('all');
    setPaymentFilter('all');
    setDateFilter(null);
  };

  const handleCalendarRefresh = () => {
    setCalendarVersion((v) => v + 1);
    if (dayKey) {
      const [y, m] = dayKey.split('-').map(Number);
      void refreshMonth(y, m).then(setMonthSnapshot);
    }
    void hydrateFromRemote();
  };

  const handleAdminDayClick = (key: string) => {
    setDayKey(key);
    setDateFilter(key);
    const [y, m] = key.split('-').map(Number);
    void refreshMonth(y, m).then(setMonthSnapshot);
  };

  return (
    <div className="max-w-7xl dash-page">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Event Proposals</h1>
      <p className="dash-muted text-sm mb-6">
        Review proposals, send quotes with payment details, and manage the availability calendar.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,360px)_1fr] gap-6 mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red mb-2">Availability calendar</p>
          <EventAvailabilityCalendar
            adminMode
            selectedDate={dateFilter ?? undefined}
            onAdminDayClick={handleAdminDayClick}
            calendarVersion={calendarVersion}
          />
        </div>

        <div className="min-h-[420px] flex flex-col rounded-2xl dash-card border overflow-hidden">
          <div className="p-4 border-b dash-border space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red">Bookings</p>
              <span className="text-xs dash-muted font-semibold">
                {filtered.length} of {bookings.length}
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dash-muted pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code, name, email, event…"
                className="w-full rounded-xl dash-input border pl-9 pr-4 py-2.5 text-sm"
                aria-label="Search bookings"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">Service</span>
                <select
                  value={kindFilter}
                  onChange={(e) => setKindFilter(e.target.value as BookingPageKind | 'all')}
                  className="w-full rounded-xl dash-input border px-3 py-2 text-sm font-semibold"
                >
                  <option value="all">All services</option>
                  <option value="coffee-cart">{BOOKING_PAGE_LABELS['coffee-cart']}</option>
                  <option value="matcha-bar">{BOOKING_PAGE_LABELS['matcha-bar']}</option>
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">Booking status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as BoothBookingStatus | 'all')}
                  className="w-full rounded-xl dash-input border px-3 py-2 text-sm font-semibold"
                >
                  <option value="all">All statuses</option>
                  {ALL_BOOTH_BOOKING_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {BOOTH_BOOKING_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">Payment</span>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | 'all')}
                  className="w-full rounded-xl dash-input border px-3 py-2 text-sm font-semibold"
                >
                  <option value="all">All payments</option>
                  {ALL_PAYMENT_STATUSES.map((ps) => (
                    <option key={ps} value={ps}>
                      {PAYMENT_STATUS_LABELS[ps]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {(dateFilter || filtersActive) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {dateFilter && (
                  <span className="inline-flex items-center gap-1 rounded-full border dash-border bg-kado-cream/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider dash-heading">
                    Date: {dateFilter}
                    <button
                      type="button"
                      onClick={() => setDateFilter(null)}
                      className="p-0.5 dash-muted hover:text-kado-red"
                      aria-label="Clear date filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filtersActive && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[560px]">
            {filtered.length === 0 ? (
              <p className="text-sm dash-muted text-center py-12">
                {filtersActive ? 'No bookings match your filters.' : 'No booth bookings yet.'}
              </p>
            ) : (
              filtered.map((booking) => {
                const kind = resolveBookingKind(booking.bookingKind, booking.specialRequests);
                const quotedTotal = bookingQuotedTotal(booking);
                const due = boothAmountDue(booking);
                const selected = manageId === booking.id;
                return (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => setManageId(booking.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-colors ${
                      selected
                        ? 'border-kado-red/50 bg-kado-cream/40 ring-1 ring-kado-red/20'
                        : 'dash-border hover:border-kado-red/30'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-display font-bold dash-heading">{booking.shortCode}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-kado-cream text-kado-dark border-kado-dark/15">
                        {kind === 'matcha-bar' ? 'Matcha' : 'Coffee'}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${BOOTH_STATUS_BADGE[booking.status]}`}
                      >
                        {BOOTH_BOOKING_STATUS_LABELS[booking.status]}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${PAYMENT_STATUS_BADGE[booking.paymentStatus]}`}
                      >
                        {PAYMENT_STATUS_LABELS[booking.paymentStatus]}
                      </span>
                      {isOfficialQuote(booking) && (
                        <span className="text-[9px] font-bold uppercase text-violet-700">Quoted</span>
                      )}
                      <span className="text-[10px] dash-muted ml-auto shrink-0">{timeAgo(booking.createdAt)}</span>
                    </div>
                    <p className="text-sm dash-heading font-semibold truncate">{booking.eventName}</p>
                    <p className="text-xs dash-muted truncate">
                      {booking.contactName} · {booking.contactEmail}
                    </p>
                    <p className="text-[10px] dash-muted mt-1">
                      {booking.eventDate.slice(0, 10)}
                      {' · '}
                      Est. {formatPhp(bookingInitialTotal(booking))}
                      {quotedTotal != null && <> · Quote {formatPhp(quotedTotal)}</>}
                      {due != null && due > 0 && <> · Due {formatPhp(due)}</>}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <BoothBookingManageModal
        booking={manageBooking}
        onClose={() => setManageId(null)}
        onSaved={handleCalendarRefresh}
      />

      <AdminBoothDayModal
        dateKey={dayKey}
        calendar={monthSnapshot}
        bookings={bookings}
        onClose={() => setDayKey(null)}
        onOpenManage={(id) => {
          setDayKey(null);
          setManageId(id);
        }}
        onSaved={handleCalendarRefresh}
      />
    </div>
  );
}
