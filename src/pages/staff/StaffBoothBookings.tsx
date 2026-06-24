import { useMemo, useState } from 'react';
import type { BoothBookingStatus } from '../../types/domain';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { useAuthStore } from '../../store/authStore';
import { useBranchStore } from '../../store/branchStore';
import {
  ALL_BOOTH_BOOKING_STATUSES,
  BOOTH_BOOKING_STATUS_LABELS,
  BOOTH_STATUS_BADGE,
  isOfficialQuote,
} from '../../lib/boothBookingStatus';
import { bookingInitialTotal, bookingQuotedTotal, resolveBookingKind } from '../../lib/boothBookingEstimate';
import { formatPhp } from '../../lib/money';
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_BADGE } from '../../lib/orderStatus';
import { boothAmountDue } from '../../lib/boothPayment';
import BoothBookingManageModal from '../../components/admin/BoothBookingManageModal';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function StaffBoothBookings() {
  const user = useAuthStore((s) => s.user);
  const bookingsForBranch = useBoothBookingStore((s) => s.bookingsForBranch);
  const allBookings = useBoothBookingStore((s) => s.bookings);
  const branches = useBranchStore((s) => s.branches);

  const [statusFilter, setStatusFilter] = useState<BoothBookingStatus | 'all'>('all');
  const [manageId, setManageId] = useState<string | null>(null);

  const branchLabel = user?.branchId
    ? branches.find((b) => b.id === user.branchId)?.name ?? user.branchId
    : null;

  const list = useMemo(() => {
    let items = user?.branchId ? bookingsForBranch(user.branchId) : allBookings;
    if (statusFilter !== 'all') items = items.filter((b) => b.status === statusFilter);
    return items;
  }, [user?.branchId, bookingsForBranch, allBookings, statusFilter]);

  const manageBooking = manageId ? allBookings.find((b) => b.id === manageId) ?? null : null;

  return (
    <div className="max-w-6xl dash-page">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Booth Bookings</h1>
      <p className="dash-muted mb-6">
        Review requests, send quotes, and update booking status
        {branchLabel ? ` · ${branchLabel}` : ''}.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
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
          {list.length} booking{list.length !== 1 ? 's' : ''}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl dash-card border p-12 text-center">
          <p className="text-sm dash-muted">No booth bookings assigned.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((booking) => {
            const kind = resolveBookingKind(booking.bookingKind, booking.specialRequests);
            const quotedTotal = bookingQuotedTotal(booking);
            const amountDue = boothAmountDue(booking);
            return (
            <li key={booking.id} className="rounded-2xl dash-card border p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-display font-bold dash-heading text-lg">{booking.shortCode}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-kado-cream text-kado-dark border-kado-dark/15">
                      {kind === 'matcha-bar' ? 'Matcha bar' : 'Coffee cart'}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${BOOTH_STATUS_BADGE[booking.status]}`}
                    >
                      {BOOTH_BOOKING_STATUS_LABELS[booking.status]}
                    </span>
                    {isOfficialQuote(booking) && (
                      <span className="text-[10px] font-bold uppercase text-violet-700">Quoted</span>
                    )}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${PAYMENT_STATUS_BADGE[booking.paymentStatus]}`}
                    >
                      {PAYMENT_STATUS_LABELS[booking.paymentStatus]}
                    </span>
                    <span className="text-xs dash-muted">{timeAgo(booking.createdAt)}</span>
                  </div>
                  <p className="text-sm dash-muted">
                    {booking.eventName} · {booking.guestCount} guests · {booking.contactName}
                  </p>
                  <p className="text-xs dash-muted mt-1">
                    Est. {formatPhp(bookingInitialTotal(booking))}
                    {quotedTotal != null && <> · Quote {formatPhp(quotedTotal)}</>}
                    {amountDue != null && amountDue > 0 && <> · Due {formatPhp(amountDue)}</>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setManageId(booking.id)}
                  className="shrink-0 rounded-xl bg-kado-dark text-kado-cream px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-kado-red"
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
