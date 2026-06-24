import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, CalendarCheck } from 'lucide-react';
import type { BoothBooking, BoothBookingKind, BoothBookingStatus, BoothPaymentMethod, PaymentStatus } from '../../types/domain';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { useEventCalendarStore } from '../../store/eventCalendarStore';
import { useSettingsStore } from '../../store/settingsStore';
import { BOOKING_PAGE_LABELS } from '../../lib/bookingPageKinds';
import {
  ALL_BOOTH_BOOKING_STATUSES,
  BOOTH_BOOKING_STATUS_LABELS,
} from '../../lib/boothBookingStatus';
import { PAYMENT_STATUS_LABELS } from '../../lib/orderStatus';
import { boothPaymentMethodLabel } from '../../lib/boothPayment';
import { buildBoothQuoteEmailHtml, buildBoothQuoteEmailPlain } from '../../lib/boothQuoteEmail';
import { toBoothQuoteEmailInput } from '../../lib/boothQuoteEmailInput';
import { sendBoothQuoteToClient } from '../../lib/sendBoothEmail';
import { buildProposalEstimate } from '../../lib/boothProposal';
import { EVENT_PROPOSAL_PACKAGE_ID, EVENT_PROPOSAL_PACKAGE_NAME } from '../../lib/eventCalendar';
import { formatPhp } from '../../lib/money';
import { dayStatus, type EventCalendarMonth } from '../../lib/eventCalendar';
import BoothPaymentProofPreview from '../booth/BoothPaymentProofPreview';

const PAYMENT_METHODS: BoothPaymentMethod[] = ['gcash-or-bank', 'gcash-qr', 'bank-transfer'];
const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'proof_submitted', 'paid', 'refunded'];

type Props = {
  dateKey: string | null;
  calendar: EventCalendarMonth | null;
  bookings: BoothBooking[];
  onClose: () => void;
  onOpenManage: (bookingId: string) => void;
  onSaved: () => void;
};

type EntryMode = 'existing' | 'manual';

const EMPTY_MANUAL = {
  bookingKind: 'coffee-cart' as BoothBookingKind,
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  eventName: '',
  guestCount: '30',
  startTime: '10:00',
  endTime: '14:00',
  quotedTotal: '',
  quoteNotes: '',
};

export default function AdminBoothDayModal({
  dateKey,
  calendar,
  bookings,
  onClose,
  onOpenManage,
  onSaved,
}: Props) {
  const createBooking = useBoothBookingStore((s) => s.createBooking);
  const setFinalQuote = useBoothBookingStore((s) => s.setFinalQuote);
  const updateBooking = useBoothBookingStore((s) => s.updateBooking);
  const markPaymentPaid = useBoothBookingStore((s) => s.markPaymentPaid);
  const setDateKind = useEventCalendarStore((s) => s.setDateKind);
  const settings = useSettingsStore((s) => s.settings);

  const [mode, setMode] = useState<EntryMode>('existing');
  const [existingId, setExistingId] = useState('');
  const [manual, setManual] = useState(EMPTY_MANUAL);
  const [emailMessage, setEmailMessage] = useState('');
  const [quotedTotal, setQuotedTotal] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [bookingStatus, setBookingStatus] = useState<BoothBookingStatus>('submitted');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [paymentMethod, setPaymentMethod] = useState<BoothPaymentMethod>('gcash-or-bank');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const dayBookings = useMemo(() => {
    if (!dateKey) return [];
    return bookings.filter((b) => b.eventDate.slice(0, 10) === dateKey);
  }, [bookings, dateKey]);

  const selectableExisting = useMemo(
    () => [...bookings].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [bookings],
  );

  const status = dateKey && calendar ? dayStatus(dateKey, calendar, '1970-01-01') : 'available';

  const activeBooking = activeBookingId
    ? bookings.find((b) => b.id === activeBookingId) ?? dayBookings.find((b) => b.id === activeBookingId) ?? null
    : dayBookings[0] ?? null;

  useEffect(() => {
    if (!dateKey) return;
    setError('');
    setSuccess('');
    setMode(dayBookings.length > 0 ? 'existing' : 'manual');
    setExistingId(dayBookings[0]?.id ?? selectableExisting[0]?.id ?? '');
    setActiveBookingId(dayBookings[0]?.id ?? null);
    setManual(EMPTY_MANUAL);
    setEmailMessage('');
    setQuotedTotal('');
    setAmountDue('');
    setBookingStatus('submitted');
    setPaymentStatus('unpaid');
    setPaymentMethod('gcash-or-bank');
  }, [dateKey, dayBookings, selectableExisting]);

  useEffect(() => {
    if (!activeBooking) return;
    setBookingStatus(activeBooking.status);
    setPaymentStatus(activeBooking.paymentStatus);
    setPaymentMethod(activeBooking.paymentMethod);
  }, [activeBooking?.id, activeBooking?.status, activeBooking?.paymentStatus, activeBooking?.paymentMethod]);

  useEffect(() => {
    if (mode !== 'existing' || !existingId) return;
    const picked = bookings.find((b) => b.id === existingId);
    if (!picked) return;
    setActiveBookingId(picked.id);
    const total = picked.finalQuote?.total ?? picked.estimateSnapshot?.total ?? 0;
    setQuotedTotal(String(total));
    setAmountDue(String(picked.paymentAmount ?? total));
    setEmailMessage(picked.quoteNotes ?? '');
  }, [mode, existingId, bookings]);

  if (!dateKey) return null;

  const dateKind: 'available' | 'blocked' | 'pending' =
    status === 'blocked' ? 'blocked' : status === 'pending' ? 'pending' : 'available';

  const emailPreview = activeBooking
    ? buildBoothQuoteEmailPlain(
        toBoothQuoteEmailInput(
          { ...activeBooking, quoteNotes: emailMessage },
          settings,
          {
            quotedTotal: Number(quotedTotal) || 0,
            amountDue: Number(amountDue) || Number(quotedTotal) || 0,
            customMessage: emailMessage,
          },
        ),
      )
    : null;

  const handleDateKind = async (kind: 'available' | 'blocked' | 'pending') => {
    setSaving(true);
    setError('');
    try {
      await setDateKind(dateKey, kind);
      setSuccess(kind === 'available' ? 'Date is available.' : `Date marked ${kind}.`);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update availability.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveManual = async () => {
    if (!manual.contactName.trim() || !manual.contactEmail.trim() || !manual.eventName.trim()) {
      setError('Contact name, email, and event name are required.');
      return;
    }
    const total = Number(manual.quotedTotal);
    if (!Number.isFinite(total) || total < 0) {
      setError('Enter a valid quoted total.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const startsAt = new Date(`${dateKey}T${manual.startTime}:00`);
      const endsAt = new Date(`${dateKey}T${manual.endTime}:00`);
      const estimate = buildProposalEstimate('PENDING');
      const created = await createBooking({
        bookingKind: manual.bookingKind,
        contactName: manual.contactName.trim(),
        contactEmail: manual.contactEmail.trim(),
        contactPhone: manual.contactPhone.trim() || '—',
        eventName: manual.eventName.trim(),
        occasion: 'other',
        guestCount: Math.max(1, Number(manual.guestCount) || 1),
        eventDate: new Date(dateKey).toISOString(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        packageId: EVENT_PROPOSAL_PACKAGE_ID,
        packageNameSnapshot: EVENT_PROPOSAL_PACKAGE_NAME,
        packageBasePriceSnapshot: 0,
        selectedAddons: [],
        estimateSnapshot: { ...estimate, shortCode: 'PENDING', total },
        status: 'quoted',
        quoteNotes: manual.quoteNotes.trim() || undefined,
      });
      await setFinalQuote(created.id, total, {
        quoteNotes: manual.quoteNotes.trim() || undefined,
        status: 'quoted',
      });
      setActiveBookingId(created.id);
      setQuotedTotal(String(total));
      setEmailMessage(manual.quoteNotes);
      setSuccess('Booking saved for this date.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save booking.');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignExisting = async () => {
    const picked = bookings.find((b) => b.id === existingId);
    if (!picked) {
      setError('Select a proposal to link.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const start = new Date(picked.startsAt);
      const end = new Date(picked.endsAt);
      const pad = (n: number) => String(n).padStart(2, '0');
      const startLocal = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
      const endLocal = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
      const startsAt = new Date(`${dateKey}T${startLocal}:00`);
      const endsAt = new Date(`${dateKey}T${endLocal}:00`);
      await updateBooking(picked.id, {
        eventDate: new Date(dateKey).toISOString(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
      setActiveBookingId(picked.id);
      setSuccess('Proposal linked to this date.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not link proposal.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!activeBooking) {
      setError('Select or create a booking first.');
      return;
    }
    const total = Number(quotedTotal);
    if (!Number.isFinite(total) || total < 0) {
      setError('Enter a valid quoted total before sending.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await setFinalQuote(activeBooking.id, total, {
        quoteNotes: emailMessage.trim() || undefined,
        status: activeBooking.status === 'submitted' ? 'quoted' : activeBooking.status,
        paymentAmount: Number(amountDue) || total,
      });
      const emailInput = toBoothQuoteEmailInput(
        { ...activeBooking, quoteNotes: emailMessage.trim() || activeBooking.quoteNotes },
        settings,
        {
          quotedTotal: total,
          amountDue: Number(amountDue) || total,
          customMessage: emailMessage.trim() || undefined,
        },
      );
      const result = await sendBoothQuoteToClient(emailInput);
      if (!result.ok) throw new Error(result.error || 'Email failed.');
      await updateBooking(activeBooking.id, { status: 'awaiting_confirmation' });
      setSuccess('Quote email sent to client.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send email.');
    } finally {
      setSending(false);
    }
  };

  const handleSaveBookingOverrides = async () => {
    if (!activeBooking) return;
    setSaving(true);
    setError('');
    try {
      await updateBooking(activeBooking.id, {
        status: bookingStatus,
        paymentStatus,
        paymentMethod,
        paymentAmount: Number(amountDue) || undefined,
      });
      if (Number(quotedTotal) > 0) {
        await setFinalQuote(activeBooking.id, Number(quotedTotal), {
          paymentAmount: Number(amountDue) || Number(quotedTotal),
          paymentMethod,
          status: bookingStatus,
        });
      }
      setSuccess('Booking updated.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save booking.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!activeBooking) return;
    setSaving(true);
    setError('');
    try {
      await markPaymentPaid(activeBooking.id);
      setSuccess('Marked paid and confirmed.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not mark paid.');
    } finally {
      setSaving(false);
    }
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
          className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl dash-card border shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b dash-border sticky top-0 bg-[var(--color-dash-surface)] z-10">
            <div>
              <h2 className="font-display font-bold text-lg dash-heading">{dateKey}</h2>
              <p className="text-xs dash-muted capitalize">{status.replace('_', ' ')}</p>
            </div>
            <button type="button" onClick={onClose} className="p-2 dash-muted hover:text-kado-red" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}
            {success ? (
              <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
            ) : null}

            <section className="rounded-xl border dash-border p-4 space-y-3">
              <h3 className="font-display font-bold text-sm dash-heading">Date availability</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['available', 'pending', 'blocked'] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    disabled={saving || status === 'booked'}
                    onClick={() => void handleDateKind(kind)}
                    className={`rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider border ${
                      dateKind === kind ? 'bg-kado-dark text-kado-cream border-kado-dark' : 'dash-border dash-muted'
                    }`}
                  >
                    {kind}
                  </button>
                ))}
              </div>
            </section>

            {dayBookings.length > 0 && (
              <section className="rounded-xl border dash-border p-4 space-y-2">
                <h3 className="font-display font-bold text-sm dash-heading flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-kado-red" /> On this date
                </h3>
                <ul className="space-y-2">
                  {dayBookings.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold dash-heading truncate">
                          {b.shortCode} · {b.eventName}
                        </p>
                        <p className="text-xs dash-muted truncate">{b.contactName} · {b.contactEmail}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenManage(b.id)}
                        className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-kado-red"
                      >
                        Manage
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`flex-1 rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider border ${
                  mode === 'existing' ? 'bg-kado-dark text-kado-cream border-kado-dark' : 'dash-border dash-muted'
                }`}
              >
                Link proposal
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`flex-1 rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider border ${
                  mode === 'manual' ? 'bg-kado-dark text-kado-cream border-kado-dark' : 'dash-border dash-muted'
                }`}
              >
                Manual entry
              </button>
            </div>

            {mode === 'existing' ? (
              <div className="space-y-3 rounded-xl border dash-border p-4">
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted">Customer proposal</label>
                <select
                  value={existingId}
                  onChange={(e) => setExistingId(e.target.value)}
                  className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
                >
                  <option value="">Select…</option>
                  {selectableExisting.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.shortCode} — {b.eventName} ({b.contactName})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={saving || !existingId}
                  onClick={() => void handleAssignExisting()}
                  className="w-full rounded-xl bg-kado-red text-white py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Assign to this date'}
                </button>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border dash-border p-4">
                <div className="grid grid-cols-2 gap-2">
                  {(['coffee-cart', 'matcha-bar'] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setManual((s) => ({ ...s, bookingKind: kind }))}
                      className={`rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider border ${
                        manual.bookingKind === kind ? 'bg-kado-red text-white border-kado-red' : 'dash-border dash-muted'
                      }`}
                    >
                      {BOOKING_PAGE_LABELS[kind]}
                    </button>
                  ))}
                </div>
                <Field label="Contact name" value={manual.contactName} onChange={(v) => setManual((s) => ({ ...s, contactName: v }))} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Email" value={manual.contactEmail} onChange={(v) => setManual((s) => ({ ...s, contactEmail: v }))} />
                  <Field label="Phone" value={manual.contactPhone} onChange={(v) => setManual((s) => ({ ...s, contactPhone: v }))} />
                </div>
                <Field label="Event name" value={manual.eventName} onChange={(v) => setManual((s) => ({ ...s, eventName: v }))} />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Guests" value={manual.guestCount} onChange={(v) => setManual((s) => ({ ...s, guestCount: v }))} type="number" />
                  <Field label="Start" value={manual.startTime} onChange={(v) => setManual((s) => ({ ...s, startTime: v }))} type="time" />
                  <Field label="End" value={manual.endTime} onChange={(v) => setManual((s) => ({ ...s, endTime: v }))} type="time" />
                </div>
                <Field label="Quoted total (PHP)" value={manual.quotedTotal} onChange={(v) => setManual((s) => ({ ...s, quotedTotal: v }))} type="number" />
                <Field label="Notes" value={manual.quoteNotes} onChange={(v) => setManual((s) => ({ ...s, quoteNotes: v }))} multiline />
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveManual()}
                  className="w-full rounded-xl bg-kado-red text-white py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save booking'}
                </button>
              </div>
            )}

            {activeBooking && (
              <section className="rounded-xl border dash-border p-4 space-y-3">
                <h3 className="font-display font-bold text-sm dash-heading">Selected booking</h3>
                <p className="text-xs dash-muted">
                  {activeBooking.shortCode} · {activeBooking.contactName}
                </p>
                <BoothPaymentProofPreview booking={activeBooking} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">Booking status</span>
                    <select
                      value={bookingStatus}
                      onChange={(e) => setBookingStatus(e.target.value as BoothBookingStatus)}
                      className="w-full rounded-xl dash-input border px-3 py-2 text-sm"
                      disabled={saving}
                    >
                      {ALL_BOOTH_BOOKING_STATUSES.map((s) => (
                        <option key={s} value={s}>{BOOTH_BOOKING_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">Payment status</span>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                      className="w-full rounded-xl dash-input border px-3 py-2 text-sm"
                      disabled={saving}
                    >
                      {PAYMENT_STATUSES.map((ps) => (
                        <option key={ps} value={ps}>{PAYMENT_STATUS_LABELS[ps]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">Payment method</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as BoothPaymentMethod)}
                      className="w-full rounded-xl dash-input border px-3 py-2 text-sm"
                      disabled={saving}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{boothPaymentMethodLabel(m)}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSaveBookingOverrides()}
                    className="flex-1 min-w-[140px] rounded-xl border dash-border py-2 text-[10px] font-bold uppercase tracking-wider dash-heading disabled:opacity-60"
                  >
                    Save overrides
                  </button>
                  {activeBooking.paymentStatus !== 'paid' && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleMarkPaid()}
                      className="flex-1 min-w-[140px] rounded-xl bg-emerald-700 text-white py-2 text-[10px] font-bold uppercase tracking-wider disabled:opacity-60"
                    >
                      Mark paid & confirm
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenManage(activeBooking.id)}
                    className="flex-1 min-w-[100px] rounded-xl text-[10px] font-bold uppercase tracking-wider text-kado-red"
                  >
                    Full manage
                  </button>
                </div>
              </section>
            )}

            {activeBooking && (
              <section className="rounded-xl border dash-border p-4 space-y-3">
                <h3 className="font-display font-bold text-sm dash-heading flex items-center gap-2">
                  <Mail className="w-4 h-4 text-kado-red" /> Email to client
                </h3>
                <p className="text-xs dash-muted">
                  {activeBooking.contactName} · {activeBooking.contactEmail}
                </p>
                <Field label="Quoted total (PHP)" value={quotedTotal} onChange={setQuotedTotal} type="number" />
                <Field label="Amount due (PHP)" value={amountDue} onChange={setAmountDue} type="number" />
                <Field label="Message" value={emailMessage} onChange={setEmailMessage} multiline />
                {emailPreview && (
                  <div className="rounded-xl bg-kado-cream/60 border border-kado-dark/10 p-4 text-sm space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-kado-dark/50">Preview</p>
                    <p className="font-semibold text-kado-dark">{emailPreview.subject}</p>
                    <pre className="whitespace-pre-wrap font-sans text-xs text-kado-dark/80 leading-relaxed">{emailPreview.body}</pre>
                    <div
                      className="mt-3 rounded-lg border border-kado-dark/10 bg-white p-3 text-xs"
                      dangerouslySetInnerHTML={{
                        __html: buildBoothQuoteEmailHtml(
                          toBoothQuoteEmailInput(
                            { ...activeBooking, quoteNotes: emailMessage },
                            settings,
                            {
                              quotedTotal: Number(quotedTotal) || 0,
                              amountDue: Number(amountDue) || Number(quotedTotal) || 0,
                              customMessage: emailMessage,
                            },
                          ),
                        ),
                      }}
                    />
                  </div>
                )}
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void handleSendEmail()}
                  className="w-full rounded-xl bg-kado-dark text-kado-cream py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-60"
                >
                  {sending ? 'Sending…' : 'Send quote email'}
                </button>
              </section>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
        />
      )}
    </div>
  );
}
