import { useEffect, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import type { BoothBooking, BoothBookingStatus, BoothPaymentMethod, PaymentStatus } from '../../types/domain';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { useUserStore } from '../../store/userStore';
import { useSettingsStore } from '../../store/settingsStore';
import {
  ALL_BOOTH_BOOKING_STATUSES,
  BOOTH_BOOKING_STATUS_LABELS,
  BOOTH_STATUS_BADGE,
  getBookingDisplayEstimate,
  isOfficialQuote,
} from '../../lib/boothBookingStatus';
import { PAYMENT_STATUS_LABELS } from '../../lib/orderStatus';
import { bookingInitialTotal, resolveBookingKind } from '../../lib/boothBookingEstimate';
import { BOOKING_PAGE_LABELS } from '../../lib/bookingPageKinds';
import { buildBoothQuoteEmailHtml, buildBoothQuoteEmailPlain } from '../../lib/boothQuoteEmail';
import { toBoothQuoteEmailInput } from '../../lib/boothQuoteEmailInput';
import { sendBoothQuoteToClient } from '../../lib/sendBoothEmail';
import { boothPaymentMethodLabel } from '../../lib/boothPayment';
import { formatPhp } from '../../lib/money';
import BoothEstimateBreakdown from '../booth/BoothEstimateBreakdown';
import BoothContactCallCard from '../booth/BoothContactCallCard';
import BoothPaymentProofPreview from '../booth/BoothPaymentProofPreview';

type Props = {
  booking: BoothBooking | null;
  onClose: () => void;
  onSaved?: () => void;
};

const PAYMENT_METHODS: BoothPaymentMethod[] = ['gcash-or-bank', 'gcash-qr', 'bank-transfer'];
const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'proof_submitted', 'paid', 'refunded'];

export default function BoothBookingManageModal({ booking, onClose, onSaved }: Props) {
  const setFinalQuote = useBoothBookingStore((s) => s.setFinalQuote);
  const updateBooking = useBoothBookingStore((s) => s.updateBooking);
  const assignStaff = useBoothBookingStore((s) => s.assignStaff);
  const markPaymentPaid = useBoothBookingStore((s) => s.markPaymentPaid);
  const markUnderReview = useBoothBookingStore((s) => s.markUnderReview);
  const settings = useSettingsStore((s) => s.settings);
  const users = useUserStore((s) => s.users);

  const [status, setStatusLocal] = useState<BoothBookingStatus>('submitted');
  const [paymentStatus, setPaymentStatusLocal] = useState<PaymentStatus>('unpaid');
  const [paymentMethod, setPaymentMethod] = useState<BoothPaymentMethod>('gcash-or-bank');
  const [officialTotal, setOfficialTotal] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [staffId, setStaffId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  const staffUsers = users.filter((u) => u.role === 'staff' || u.role === 'admin');

  useEffect(() => {
    if (!booking) return;
    if (booking.status === 'submitted') void markUnderReview(booking.id);
    const display = getBookingDisplayEstimate(booking);
    setStatusLocal(booking.status);
    setPaymentStatusLocal(booking.paymentStatus);
    setPaymentMethod(booking.paymentMethod);
    setOfficialTotal(String(display.total));
    setAmountDue(String(booking.paymentAmount ?? display.total));
    setQuoteNotes(booking.quoteNotes ?? '');
    setInternalNotes(booking.internalNotes ?? '');
    setStaffId(booking.assignedStaffId ?? '');
    setEventDate(booking.eventDate.slice(0, 10));
    const start = new Date(booking.startsAt);
    const end = new Date(booking.endsAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    setStartTime(`${pad(start.getHours())}:${pad(start.getMinutes())}`);
    setEndTime(`${pad(end.getHours())}:${pad(end.getMinutes())}`);
    setSaveError('');
    setEmailSuccess('');
  }, [booking, markUnderReview]);

  if (!booking) return null;

  const serviceKind = resolveBookingKind(booking.bookingKind, booking.specialRequests);
  const initialTotal = bookingInitialTotal(booking);

  const liveBooking = {
    ...booking,
    status,
    paymentStatus,
    paymentMethod,
    quoteNotes,
    paymentAmount: Number(amountDue) || undefined,
  };

  const emailInput = toBoothQuoteEmailInput(liveBooking, settings, {
    customMessage: quoteNotes,
    quotedTotal: Number(officialTotal) || 0,
    amountDue: Number(amountDue) || Number(officialTotal) || 0,
  });
  const emailPreview = buildBoothQuoteEmailPlain(emailInput);

  const persistQuote = async () => {
    const total = Number(officialTotal);
    const due = Number(amountDue);
    if (!Number.isFinite(total) || total < 0) throw new Error('Enter a valid quoted total.');
    if (!Number.isFinite(due) || due < 0) throw new Error('Enter a valid amount due.');
    await setFinalQuote(booking.id, total, {
      quoteNotes,
      status: status === 'submitted' || status === 'under_review' ? 'quoted' : status,
      paymentAmount: due,
      paymentMethod,
    });
    await updateBooking(booking.id, {
      status,
      paymentStatus,
      paymentMethod,
      paymentAmount: due,
      internalNotes: internalNotes.trim() || undefined,
    });
    await assignStaff(booking.id, staffId || undefined);
  };

  const handleSaveQuote = (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    void persistQuote()
      .then(() => {
        onSaved?.();
        onClose();
      })
      .catch((err) => setSaveError(err instanceof Error ? err.message : 'Could not save.'))
      .finally(() => setSaving(false));
  };

  const handleStatusOnly = () => {
    setSaving(true);
    setSaveError('');
    const nextStatus =
      paymentStatus === 'paid' && !['declined', 'cancelled', 'completed'].includes(status)
        ? 'confirmed'
        : status;
    void updateBooking(booking.id, {
      status: nextStatus,
      paymentStatus,
      paymentMethod,
      paymentAmount: Number(amountDue) || undefined,
      paymentPaidAt: paymentStatus === 'paid' ? new Date().toISOString() : undefined,
      internalNotes: internalNotes.trim() || undefined,
    })
      .then(() => assignStaff(booking.id, staffId || undefined))
      .then(() => {
        onSaved?.();
        onClose();
      })
      .catch((err) => setSaveError(err instanceof Error ? err.message : 'Could not save.'))
      .finally(() => setSaving(false));
  };

  const handleSendQuoteEmail = async () => {
    setSending(true);
    setSaveError('');
    setEmailSuccess('');
    try {
      await persistQuote();
      const result = await sendBoothQuoteToClient(emailInput);
      if (!result.ok) throw new Error(result.error || 'Could not send email.');
      await updateBooking(booking.id, { status: 'awaiting_confirmation' });
      setEmailSuccess('Quote email sent to client.');
      onSaved?.();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not send quote email.');
    } finally {
      setSending(false);
    }
  };

  const handleMarkPaid = () => {
    setSaving(true);
    void markPaymentPaid(booking.id)
      .then(() => {
        onSaved?.();
        onClose();
      })
      .catch((err) => setSaveError(err instanceof Error ? err.message : 'Could not mark paid.'))
      .finally(() => setSaving(false));
  };

  const handleSaveSchedule = () => {
    if (!eventDate.trim()) {
      setSaveError('Event date is required.');
      return;
    }
    setSaving(true);
    setSaveError('');
    const startsAt = new Date(`${eventDate}T${startTime || '10:00'}:00`);
    const endsAt = new Date(`${eventDate}T${endTime || '14:00'}:00`);
    void updateBooking(booking.id, {
      eventDate: new Date(eventDate).toISOString(),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    })
      .then(() => {
        onSaved?.();
        setSaveError('');
      })
      .catch((err) => setSaveError(err instanceof Error ? err.message : 'Could not save schedule.'))
      .finally(() => setSaving(false));
  };

  const useFullQuoteAsDue = () => setAmountDue(officialTotal);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-kado-dark/55 backdrop-blur-[3px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2rem] dash-card border shadow-[0_30px_60px_rgba(158,24,29,0.12)]"
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
            {saveError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>
            )}
            {emailSuccess && (
              <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{emailSuccess}</p>
            )}

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider bg-kado-cream text-kado-dark border-kado-dark/15">
                {BOOKING_PAGE_LABELS[serviceKind]}
              </span>
              <span className={`px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${BOOTH_STATUS_BADGE[booking.status]}`}>
                {BOOTH_BOOKING_STATUS_LABELS[booking.status]}
              </span>
              {isOfficialQuote(booking) && (
                <span className="px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 border border-violet-200 font-bold uppercase tracking-wider text-[10px]">
                  Quoted
                </span>
              )}
            </div>

            <p className="text-sm dash-muted">
              {booking.contactName} · {booking.contactEmail} · {booking.contactPhone}
            </p>

            <BoothPaymentProofPreview booking={booking} />

            <div className="space-y-3 rounded-xl border dash-border p-4">
              <h3 className="font-display font-bold text-sm dash-heading">Event schedule</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm font-semibold"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Start</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm font-semibold"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">End</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm font-semibold"
                    disabled={saving}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={saving}
                className="w-full rounded-xl border dash-border py-2.5 text-xs font-bold uppercase tracking-wider dash-heading disabled:opacity-60"
              >
                Save schedule
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-4 rounded-xl border dash-border p-4">
              <h3 className="font-display font-bold dash-heading">Quote & payment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Quoted total</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={officialTotal}
                    onChange={(e) => setOfficialTotal(e.target.value)}
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm font-semibold"
                    disabled={saving}
                  />
                  <p className="text-[10px] dash-muted mt-1">Estimate {formatPhp(initialTotal)}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Amount due</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={amountDue}
                    onChange={(e) => setAmountDue(e.target.value)}
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm font-semibold"
                    disabled={saving}
                  />
                  <button type="button" onClick={useFullQuoteAsDue} className="text-[10px] text-kado-red font-bold mt-1">
                    Use full quote
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Payment method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as BoothPaymentMethod)}
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm"
                    disabled={saving}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{boothPaymentMethodLabel(m)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Payment status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatusLocal(e.target.value as PaymentStatus)}
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm"
                    disabled={saving}
                  >
                    {PAYMENT_STATUSES.map((ps) => (
                      <option key={ps} value={ps}>{PAYMENT_STATUS_LABELS[ps]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Message to customer</label>
                <textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm resize-none"
                  disabled={saving}
                />
              </div>
              <div className="rounded-xl bg-kado-cream/50 border dash-border p-3 space-y-2 max-h-48 overflow-y-auto">
                <p className="text-[10px] font-bold uppercase tracking-wider dash-muted">Email preview</p>
                <p className="text-xs font-semibold dash-heading">{emailPreview.subject}</p>
                <div
                  className="rounded-lg border dash-border bg-white p-2 text-[11px]"
                  dangerouslySetInnerHTML={{ __html: buildBoothQuoteEmailHtml(emailInput) }}
                />
              </div>
              <button type="submit" disabled={saving || sending} className="w-full rounded-xl bg-kado-red text-white py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-60">
                {saving ? 'Saving…' : 'Save quote & payment'}
              </button>
              <button
                type="button"
                disabled={saving || sending}
                onClick={() => void handleSendQuoteEmail()}
                className="w-full rounded-xl bg-kado-dark text-kado-cream py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-60"
              >
                {sending ? 'Sending…' : 'Send quote email to client'}
              </button>
              {booking.paymentStatus !== 'paid' && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleMarkPaid}
                  className="w-full rounded-xl border border-emerald-300 text-emerald-800 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-emerald-50 disabled:opacity-60"
                >
                  Mark paid & confirm booking
                </button>
              )}
            </form>

            <div className="space-y-3">
              <h3 className="font-display font-bold text-sm dash-heading">Booking status</h3>
              <select
                value={status}
                onChange={(e) => setStatusLocal(e.target.value as BoothBookingStatus)}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm font-semibold"
                disabled={saving}
              >
                {ALL_BOOTH_BOOKING_STATUSES.map((s) => (
                  <option key={s} value={s}>{BOOTH_BOOKING_STATUS_LABELS[s]}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleStatusOnly}
                disabled={saving}
                className="w-full rounded-xl border dash-border py-2.5 text-xs font-bold uppercase tracking-wider dash-heading disabled:opacity-60"
              >
                Update status only
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Assigned staff</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm"
                disabled={saving}
              >
                <option value="">Unassigned</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Internal notes</label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm resize-none"
                disabled={saving}
              />
            </div>

            <BoothContactCallCard message="Shown to customers on their booking page." className="opacity-90" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
