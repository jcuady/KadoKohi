import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarHeart, ChevronDown, ChevronUp, Plus, MapPin } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { useBranchStore } from '../../store/branchStore';
import AccountPageHeader from '../../components/account/AccountPageHeader';
import AccountEmptyState from '../../components/account/AccountEmptyState';
import {
  BOOTH_BOOKING_STATUS_CUSTOMER,
  BOOTH_BOOKING_STATUS_LABELS,
  BOOTH_STATUS_BADGE,
  customerShouldCallAdmin,
  customerShowsPaymentPanel,
  getBookingDisplayEstimate,
  isOfficialQuote,
} from '../../lib/boothBookingStatus';
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_BADGE, PAYMENT_STATUS_CUSTOMER } from '../../lib/orderStatus';
import { boothAmountDue } from '../../lib/boothPayment';
import BoothEstimateBreakdown from '../../components/booth/BoothEstimateBreakdown';
import BoothContactCallCard from '../../components/booth/BoothContactCallCard';
import BoothPaymentPanel from '../../components/booth/BoothPaymentPanel';
import { formatPhp } from '../../lib/money';

export default function AccountBoothBookings() {
  const user = useAuthStore((s) => s.user);
  const bookingsForCustomer = useBoothBookingStore((s) => s.bookingsForCustomer);
  const hydrateFromRemote = useBoothBookingStore((s) => s.hydrateFromRemote);
  const branches = useBranchStore((s) => s.branches);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void hydrateFromRemote();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [hydrateFromRemote]);

  const branchName = useMemo(() => {
    const m = new Map(branches.map((b) => [b.id, b.name]));
    return (id: string) => m.get(id) ?? '';
  }, [branches]);

  const myBookings = useMemo(
    () => (user?.id ? bookingsForCustomer(user.id) : []),
    [bookingsForCustomer, user?.id],
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <AccountPageHeader
        eyebrow="Events"
        title="Event booking"
        subtitle="Track proposals — pricing is final only after you agree with our team."
        action={
          <Link
            to="/book/coffee-cart"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-kado-dark px-4 text-[10px] font-black uppercase tracking-wider text-kado-cream hover:bg-kado-red transition-colors touch-manipulation"
          >
            <Plus className="w-4 h-4" aria-hidden />
            New
          </Link>
        }
      />

      {myBookings.length === 0 ? (
        <div className="space-y-3">
          <AccountEmptyState
            icon={CalendarHeart}
            title="No event bookings yet"
            description="Plan a celebration — submit a proposal and we’ll follow up by email."
          />
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/book/coffee-cart"
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-kado-red px-4 text-[10px] font-black uppercase tracking-wider text-kado-cream touch-manipulation"
            >
              Coffee cart
            </Link>
            <Link
              to="/book/matcha-bar"
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-kado-dark/12 bg-white px-4 text-[10px] font-black uppercase tracking-wider text-kado-dark touch-manipulation"
            >
              Matcha bar
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {myBookings.map((booking, i) => {
            const isExpanded = expandedId === booking.id;
            const displayEstimate = getBookingDisplayEstimate(booking);
            const hasQuote = isOfficialQuote(booking);
            const showCall = customerShouldCallAdmin(booking.status);
            const showPay = customerShowsPaymentPanel(booking);
            const amountDue = boothAmountDue(booking);

            return (
              <motion.li
                key={booking.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl border border-kado-dark/8 bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                  className="w-full p-4 sm:p-5 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-display font-black text-kado-dark text-lg">{booking.shortCode}</span>
                    <span
                      className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${BOOTH_STATUS_BADGE[booking.status]}`}
                    >
                      {BOOTH_BOOKING_STATUS_LABELS[booking.status]}
                    </span>
                    {hasQuote && (
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                        Official quote
                      </span>
                    )}
                    <span
                      className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${PAYMENT_STATUS_BADGE[booking.paymentStatus]}`}
                    >
                      {PAYMENT_STATUS_LABELS[booking.paymentStatus]}
                    </span>
                  </div>
                  <p className="font-bold text-kado-dark">{booking.eventName}</p>
                  <p className="text-xs text-kado-dark/50 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {branchName(booking.branchId)} ·{' '}
                    {new Date(booking.eventDate).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {' '}
                    · {booking.guestCount} guests
                  </p>
                  <p className="mt-2 text-sm text-kado-dark/60">{BOOTH_BOOKING_STATUS_CUSTOMER[booking.status]}</p>
                  <p className="mt-1 text-xs text-kado-dark/50">{PAYMENT_STATUS_CUSTOMER[booking.paymentStatus]}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-display font-black text-kado-red text-xl">
                      {formatPhp(displayEstimate.total)}
                      {!hasQuote && (
                        <span className="text-[10px] font-bold text-kado-dark/40 uppercase tracking-wider ml-2">
                          est.
                        </span>
                      )}
                      {amountDue != null && amountDue > 0 && booking.paymentStatus !== 'paid' && (
                        <span className="block text-sm font-bold text-kado-dark/70 mt-0.5">
                          {hasQuote && amountDue < displayEstimate.total
                            ? `Deposit due: ${formatPhp(amountDue)}`
                            : `Due now: ${formatPhp(amountDue)}`}
                        </span>
                      )}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-kado-dark/30" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-kado-dark/30" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-kado-dark/5"
                    >
                      <div className="p-4 sm:p-5 space-y-4 bg-kado-offwhite/50">
                        <BoothEstimateBreakdown
                          estimate={booking.estimateSnapshot}
                          title="Your submitted estimate"
                          subtitle="Ballpark from the booking builder — not final"
                        />

                        {booking.finalQuote && (
                          <BoothEstimateBreakdown
                            estimate={booking.finalQuote}
                            title="Official quote from Kado Kohi"
                            subtitle={
                              booking.quotedAt
                                ? `Sent ${new Date(booking.quotedAt).toLocaleDateString('en-PH')}`
                                : undefined
                            }
                          />
                        )}

                        {booking.quoteNotes && (
                          <p className="text-sm text-kado-dark/70 rounded-xl bg-white border border-kado-dark/10 p-3">
                            <span className="font-bold text-kado-dark">Note from our team: </span>
                            {booking.quoteNotes}
                          </p>
                        )}

                        {booking.paymentStatus === 'paid' && booking.paymentPaidAt && (
                          <p className="text-xs text-emerald-800 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                            Payment confirmed on{' '}
                            {new Date(booking.paymentPaidAt).toLocaleDateString('en-PH', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                            .
                          </p>
                        )}

                        {showPay && <BoothPaymentPanel booking={booking} />}

                        {showCall && !showPay && (
                          <BoothContactCallCard message="Call us to confirm your date, adjust details, or accept your quote." />
                        )}

                        {booking.specialRequests && (
                          <p className="text-xs text-kado-dark/55">
                            <span className="font-bold">Your requests: </span>
                            {booking.specialRequests}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
