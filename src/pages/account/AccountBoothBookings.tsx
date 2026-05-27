import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarHeart, ChevronDown, ChevronUp, Plus, MapPin } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { useBranchStore } from '../../store/branchStore';
import {
  BOOTH_BOOKING_STATUS_CUSTOMER,
  BOOTH_BOOKING_STATUS_LABELS,
  BOOTH_STATUS_BADGE,
  customerShouldCallAdmin,
  getBookingDisplayEstimate,
  isOfficialQuote,
} from '../../lib/boothBookingStatus';
import BoothEstimateBreakdown from '../../components/booth/BoothEstimateBreakdown';
import BoothContactCallCard from '../../components/booth/BoothContactCallCard';
import { formatPhp } from '../../lib/money';

export default function AccountBoothBookings() {
  const user = useAuthStore((s) => s.user);
  const bookingsForCustomer = useBoothBookingStore((s) => s.bookingsForCustomer);
  const branches = useBranchStore((s) => s.branches);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const branchName = useMemo(() => {
    const m = new Map(branches.map((b) => [b.id, b.name]));
    return (id: string) => m.get(id) ?? '';
  }, [branches]);

  const myBookings = useMemo(
    () => (user?.id ? bookingsForCustomer(user.id) : []),
    [bookingsForCustomer, user?.id],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red mb-2">Events</p>
          <h1 className="font-display text-3xl md:text-4xl font-black text-kado-dark tracking-tight">
            Events Bookings
          </h1>
          <p className="text-sm text-kado-dark/55 mt-2 max-w-xl">
            Track booth requests, estimates, and official quotes. Prices start as estimates until our team sends a
            final quote — call us anytime to discuss.
          </p>
        </div>
        <Link
          to="/book/booth"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-kado-dark text-kado-cream px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          New booking
        </Link>
      </div>

      {myBookings.length === 0 ? (
        <div className="rounded-2xl border border-kado-dark/10 bg-[#FAF7F2] p-12 text-center">
          <CalendarHeart className="w-10 h-10 text-kado-red/40 mx-auto mb-4" />
          <p className="font-display font-bold text-kado-dark text-lg mb-2">No booth bookings yet</p>
          <p className="text-sm text-kado-dark/55 mb-6 max-w-sm mx-auto">
            Plan a celebration at Kado Kohi — submit a request and we will follow up with an official quote.
          </p>
          <Link
            to="/book/booth"
            className="inline-flex items-center gap-2 rounded-xl bg-kado-red text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            Book a booth
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {myBookings.map((booking, i) => {
            const isExpanded = expandedId === booking.id;
            const displayEstimate = getBookingDisplayEstimate(booking);
            const hasQuote = isOfficialQuote(booking);
            const showCall = customerShouldCallAdmin(booking.status);

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
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-display font-black text-kado-red text-xl">
                      {formatPhp(displayEstimate.total)}
                      {!hasQuote && (
                        <span className="text-[10px] font-bold text-kado-dark/40 uppercase tracking-wider ml-2">
                          est.
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
                      <div className="p-4 sm:p-5 space-y-4 bg-[#FAF7F2]/50">
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

                        {showCall && (
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
