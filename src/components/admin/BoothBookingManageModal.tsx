import { useEffect, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import type { BoothBooking, BoothBookingStatus } from '../../types/domain';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { useUserStore } from '../../store/userStore';
import {
  ALL_BOOTH_BOOKING_STATUSES,
  BOOTH_BOOKING_STATUS_LABELS,
  BOOTH_STATUS_BADGE,
  getBookingDisplayEstimate,
  isOfficialQuote,
} from '../../lib/boothBookingStatus';
import { bookingInitialTotal, resolveBookingKind } from '../../lib/boothBookingEstimate';
import { BOOKING_PAGE_LABELS } from '../../lib/bookingPageKinds';
import { formatPhp } from '../../lib/money';
import BoothEstimateBreakdown from '../booth/BoothEstimateBreakdown';
import BoothContactCallCard from '../booth/BoothContactCallCard';

type Props = {
  booking: BoothBooking | null;
  onClose: () => void;
};

export default function BoothBookingManageModal({ booking, onClose }: Props) {
  const setStatus = useBoothBookingStore((s) => s.setStatus);
  const setFinalQuote = useBoothBookingStore((s) => s.setFinalQuote);
  const updateBooking = useBoothBookingStore((s) => s.updateBooking);
  const assignStaff = useBoothBookingStore((s) => s.assignStaff);
  const users = useUserStore((s) => s.users);

  const [status, setStatusLocal] = useState<BoothBookingStatus>('submitted');
  const [officialTotal, setOfficialTotal] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [staffId, setStaffId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const staffUsers = users.filter((u) => u.role === 'staff' || u.role === 'admin');
  useEffect(() => {
    if (!booking) return;
    const display = getBookingDisplayEstimate(booking);
    setStatusLocal(booking.status);
    setOfficialTotal(String(display.total));
    setQuoteNotes(booking.quoteNotes ?? '');
    setInternalNotes(booking.internalNotes ?? '');
    setStaffId(booking.assignedStaffId ?? '');
    setSaveError('');
  }, [booking]);

  if (!booking) return null;

  const serviceKind = resolveBookingKind(booking.bookingKind, booking.specialRequests);
  const initialTotal = bookingInitialTotal(booking);

  const persistChanges = async (includeQuote: boolean) => {
    setSaving(true);
    setSaveError('');
    try {
      if (includeQuote) {
        const total = Number(officialTotal);
        if (!Number.isFinite(total) || total < 0) {
          setSaveError('Enter a valid quoted total.');
          return;
        }
        await setFinalQuote(booking.id, total, {
          quoteNotes,
          status: status === 'submitted' ? 'quoted' : status,
        });
      } else {
        await setStatus(booking.id, status);
      }
      await updateBooking(booking.id, { internalNotes: internalNotes.trim() || undefined });
      await assignStaff(booking.id, staffId || undefined);
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save booking changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuote = (e: FormEvent) => {
    e.preventDefault();
    void persistChanges(true);
  };

  const handleStatusOnly = () => {
    void persistChanges(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl dash-card border shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b dash-border sticky top-0 bg-[var(--color-dash-surface)] z-10">
            <div>
              <h2 className="font-display font-bold text-lg dash-heading">{booking.shortCode}</h2>
              <p className="text-xs dash-muted">{booking.eventName}</p>
            </div>
            <button type="button" onClick={onClose} className="p-2 dash-muted hover:text-kado-red" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {saveError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {saveError}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider bg-kado-cream text-kado-dark border-kado-dark/15">
                {BOOKING_PAGE_LABELS[serviceKind]}
              </span>
              <span className={`px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${BOOTH_STATUS_BADGE[booking.status]}`}>
                {BOOTH_BOOKING_STATUS_LABELS[booking.status]}
              </span>
              {isOfficialQuote(booking) && (
                <span className="px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 border border-violet-200 font-bold uppercase tracking-wider text-[10px]">
                  Official quote sent
                </span>
              )}
            </div>

            <p className="text-sm dash-muted">
              {booking.contactName} · {booking.contactEmail} · {booking.contactPhone}
            </p>

            <BoothEstimateBreakdown
              estimate={booking.estimateSnapshot}
              title="Customer estimate (at submit)"
              subtitle="Initial calculator — not the final price"
              variant="dash"
            />

            <form onSubmit={handleSaveQuote} className="space-y-4 rounded-xl border dash-border p-4">
              <h3 className="font-display font-bold dash-heading">Official quote</h3>
              <p className="text-xs dash-muted">
                Set the real price. Customer will see this on their account and can call to confirm.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
                  Quoted total (PHP)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={officialTotal}
                  onChange={(e) => setOfficialTotal(e.target.value)}
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm font-semibold"
                  disabled={saving}
                />
                <p className="text-[10px] dash-muted mt-1">
                  Estimate was {formatPhp(initialTotal)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
                  Message to customer
                </label>
                <textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm resize-none"
                  placeholder="e.g. Includes setup, 3-hour service, and curated menu…"
                  disabled={saving}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-kado-red text-white py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-red/90 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save official quote'}
              </button>
            </form>

            {booking.finalQuote && (
              <BoothEstimateBreakdown
                estimate={booking.finalQuote}
                title="Current official quote"
                variant="dash"
              />
            )}

            <div className="space-y-3">
              <h3 className="font-display font-bold text-sm dash-heading">Status override</h3>
              <select
                value={status}
                onChange={(e) => setStatusLocal(e.target.value as BoothBookingStatus)}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm font-semibold"
                disabled={saving}
              >
                {ALL_BOOTH_BOOKING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {BOOTH_BOOKING_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleStatusOnly}
                disabled={saving}
                className="w-full rounded-xl border dash-border py-2.5 text-xs font-bold uppercase tracking-wider dash-heading hover:border-kado-red/40 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Update status only'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
                Assigned staff
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm"
                disabled={saving}
              >
                <option value="">Unassigned</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
                Internal notes
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm resize-none"
                disabled={saving}
              />
            </div>

            <BoothContactCallCard
              message="This number is shown to customers on their booking page."
              className="opacity-90"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
