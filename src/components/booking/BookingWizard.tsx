import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, LogIn, PartyPopper, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useBoothCatalogStore } from '../../store/boothCatalogStore';
import { useBookingEstimateStore } from '../../store/bookingEstimateStore';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { formatPhp } from '../../lib/money';
import type { BoothBookingOccasion } from '../../types/domain';
import BookingEstimatePreview from './BookingEstimatePreview';

const OCCASIONS: { id: BoothBookingOccasion; label: string }[] = [
  { id: 'birthday', label: 'Birthday' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'private_party', label: 'Private Party' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'other', label: 'Other' },
];

const STEPS = ['Package', 'Details', 'Schedule', 'Review'] as const;

export default function BookingWizard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isCustomer = user?.role === 'customer';

  const visiblePackages = useBoothCatalogStore((s) => s.visiblePackages);
  const visibleAddons = useBoothCatalogStore((s) => s.visibleAddons);
  const calculateEstimate = useBookingEstimateStore((s) => s.calculateEstimate);
  const draftEstimate = useBookingEstimateStore((s) => s.draft);
  const saveEstimate = useBookingEstimateStore((s) => s.saveEstimate);
  const createBooking = useBoothBookingStore((s) => s.createBooking);

  const pkgList = useMemo(() => visiblePackages(), [visiblePackages]);
  const addonList = useMemo(() => visibleAddons(), [visibleAddons]);

  const [step, setStep] = useState(0);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [guestCount, setGuestCount] = useState(12);
  const [durationHours, setDurationHours] = useState(3);
  const [enabledAddons, setEnabledAddons] = useState<Record<string, boolean>>({});
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});

  const minEventDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [eventName, setEventName] = useState('');
  const [occasion, setOccasion] = useState<BoothBookingOccasion>('birthday');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');
  const [specialRequests, setSpecialRequests] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState('');

  const selectedPackage = pkgList.find((pkg) => pkg.id === selectedPackageId);

  // Prefill contact details from the signed-in account.
  useEffect(() => {
    if (user) {
      setContactName((v) => v || user.name || '');
      setContactEmail((v) => v || user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (!pkgList.length) return;
    if (!pkgList.some((pkg) => pkg.id === selectedPackageId)) {
      const fallback = pkgList[0];
      setSelectedPackageId(fallback.id);
      setGuestCount(fallback.capacity);
      setDurationHours(fallback.durationHours);
    }
  }, [pkgList, selectedPackageId]);

  const selectedAddonSelections = useMemo(
    () =>
      addonList
        .filter((addon) => enabledAddons[addon.id])
        .map((addon) => ({
          addonId: addon.id,
          qty: addon.pricingType === 'fixed' ? Math.max(1, addonQty[addon.id] ?? 1) : 1,
        })),
    [addonList, enabledAddons, addonQty],
  );

  useEffect(() => {
    if (!selectedPackageId) return;
    calculateEstimate({
      packageId: selectedPackageId,
      guestCount,
      durationHours,
      addonSelections: selectedAddonSelections,
      assumptions: [
        `${guestCount} guests`,
        `${durationHours} hour(s)`,
        selectedPackage ? `Package: ${selectedPackage.name}` : 'Package selected',
      ],
    });
  }, [selectedPackageId, guestCount, durationHours, selectedAddonSelections, selectedPackage, calculateEstimate]);

  // ── Sign-in gate ──────────────────────────────────────────────
  if (!isCustomer) {
    return (
      <section className="py-10 px-6" id="booking-form">
        <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-kado-dark/10 p-8 md:p-10 text-center shadow-sm">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-kado-red/10 text-kado-red mb-5">
            <PartyPopper className="w-7 h-7" />
          </span>
          <h2 className="font-display text-2xl md:text-3xl font-black text-kado-dark mb-3">Get Started</h2>
          <p className="text-sm text-kado-dark/60 leading-relaxed max-w-md mx-auto mb-7">
            Plan your event with Kado Kohi in a few guided steps. Sign in to your account first so we can save your
            booking, send your official quote, and let you track its status anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/auth/login"
              state={{ from: '/book/booth', notice: 'Sign in to start your event booking.' }}
              className="inline-flex items-center justify-center gap-2 min-h-[52px] px-8 bg-kado-red text-white text-xs font-bold uppercase tracking-[0.15em] rounded-full hover:bg-kado-dark transition-colors"
            >
              <LogIn className="w-4 h-4" /> Sign in to book
            </Link>
            <Link
              to="/auth/signup"
              className="inline-flex items-center justify-center gap-2 min-h-[52px] px-8 border-2 border-kado-dark text-kado-dark text-xs font-bold uppercase tracking-[0.15em] rounded-full hover:bg-kado-dark hover:text-kado-cream transition-colors"
            >
              Create account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ── Success screen ────────────────────────────────────────────
  if (submittedCode) {
    return (
      <section className="py-10 px-6" id="booking-form">
        <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-green-200 p-8 md:p-10 text-center shadow-sm">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 text-green-600 mb-5">
            <Check className="w-7 h-7" />
          </span>
          <h2 className="font-display text-2xl md:text-3xl font-black text-kado-dark mb-3">Booking submitted!</h2>
          <p className="text-sm text-kado-dark/65 leading-relaxed max-w-md mx-auto mb-2">
            Reference <strong className="text-kado-dark">{submittedCode}</strong>. This is an{' '}
            <strong>estimate only</strong> — our team will review and send an official quote.
          </p>
          <p className="text-sm text-kado-dark/55 mb-7">You can track its status anytime under Events Bookings.</p>
          <Link
            to="/account/booth"
            className="inline-flex items-center justify-center gap-2 min-h-[52px] px-8 bg-kado-red text-white text-xs font-bold uppercase tracking-[0.15em] rounded-full hover:bg-kado-dark transition-colors"
          >
            View my bookings <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    );
  }

  const canNextFromPackage = !!selectedPackage;
  const scheduleValid =
    !!contactName.trim() &&
    !!contactEmail.trim() &&
    !!contactPhone.trim() &&
    !!eventName.trim() &&
    !!eventDate &&
    eventDate >= minEventDate &&
    !!startTime &&
    !!endTime &&
    endTime > startTime;

  const goNext = () => {
    setError('');
    if (step === 0 && !canNextFromPackage) {
      setError('Please choose an event package to continue.');
      return;
    }
    if (step === 2 && !scheduleValid) {
      setError('Please complete your contact details and a valid event schedule (at least 24 hours ahead).');
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goBack = () => {
    setError('');
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async () => {
    if (!selectedPackage || !draftEstimate) {
      setError('Please select a package and wait for the estimate preview before submitting.');
      return;
    }
    if (!scheduleValid) {
      setError('Please complete your contact details and event schedule.');
      setStep(2);
      return;
    }

    const startsAt = new Date(`${eventDate}T${startTime}:00`);
    const endsAt = new Date(`${eventDate}T${endTime}:00`);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setError('Invalid event schedule. Please review event date and time.');
      setStep(2);
      return;
    }

    const estimateToSave = {
      ...draftEstimate,
      status: 'sent' as const,
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const selectedAddonsSnapshot = selectedAddonSelections.map((sel) => {
      const addon = addonList.find((a) => a.id === sel.addonId)!;
      const estimateLine = estimateToSave.lineItems.find((line) => line.sourceId === addon.id);
      return {
        addonId: addon.id,
        addonNameSnapshot: addon.name,
        pricingType: addon.pricingType,
        qty: estimateLine?.qty ?? sel.qty ?? 1,
        unitPrice: addon.price,
        lineTotal: estimateLine?.lineTotal ?? addon.price,
      };
    });

    setSubmitting(true);
    setError('');
    try {
      const booking = await createBooking({
        customerId: user?.id,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        eventName: eventName.trim(),
        occasion,
        guestCount,
        eventDate: new Date(eventDate).toISOString(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        packageId: selectedPackage.id,
        packageNameSnapshot: selectedPackage.name,
        packageBasePriceSnapshot: selectedPackage.basePrice,
        selectedAddons: selectedAddonsSnapshot,
        specialRequests: specialRequests.trim() || undefined,
        estimateSnapshot: estimateToSave,
        status: 'submitted',
      });
      saveEstimate(estimateToSave);
      setSubmittedCode(booking.shortCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your booking right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-8 px-6" id="booking-form">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl bg-white border border-kado-dark/10 p-5 md:p-7">
          <div className="mb-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-kado-dark">Build Your Booking</h2>
            <p className="text-sm text-kado-dark/55 mt-1">
              Events bookings are managed brand-wide — follow the steps below.
            </p>
          </div>

          {/* Stepper */}
          <ol className="flex items-center gap-2 mb-7">
            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={label} className="flex items-center gap-2 flex-1 last:flex-none">
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    className={`flex items-center gap-2 ${i < step ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                        active
                          ? 'bg-kado-red text-white'
                          : done
                            ? 'bg-kado-red/15 text-kado-red'
                            : 'bg-kado-dark/8 text-kado-dark/40'
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : i + 1}
                    </span>
                    <span
                      className={`hidden sm:block text-[11px] font-bold uppercase tracking-wider ${
                        active ? 'text-kado-dark' : 'text-kado-dark/40'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <span className={`h-px flex-1 ${i < step ? 'bg-kado-red/40' : 'bg-kado-dark/10'}`} />
                  )}
                </li>
              );
            })}
          </ol>

          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
            <div className="min-h-[320px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">
                        Choose Package
                      </p>
                      {pkgList.length === 0 ? (
                        <div className="rounded-xl border border-kado-dark/10 bg-kado-offwhite/60 px-4 py-3 text-sm text-kado-dark/65">
                          No event packages are available yet. Check back soon or contact us.
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {pkgList.map((pkg) => (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => {
                                setSelectedPackageId(pkg.id);
                                setGuestCount(pkg.capacity);
                                setDurationHours(pkg.durationHours);
                              }}
                              className={`rounded-xl border p-4 text-left transition-colors ${
                                selectedPackageId === pkg.id
                                  ? 'border-kado-red bg-kado-red/5'
                                  : 'border-kado-dark/10 hover:border-kado-red/35'
                              }`}
                            >
                              <h3 className="font-display font-bold text-lg text-kado-dark">{pkg.name}</h3>
                              <p className="text-sm text-kado-dark/60 mt-1 line-clamp-2">{pkg.description}</p>
                              <p className="text-sm text-kado-dark/65 mt-2">
                                Capacity: <strong>{pkg.capacity}</strong> · Duration:{' '}
                                <strong>{pkg.durationHours}h</strong>
                              </p>
                              <p className="mt-2 text-kado-red font-bold">{formatPhp(pkg.basePrice)}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Guest count</Label>
                          <input
                            type="number"
                            min={1}
                            max={selectedPackage ? Math.max(selectedPackage.capacity * 2, selectedPackage.capacity) : 300}
                            value={guestCount}
                            onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value || 1)))}
                            className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/20"
                          />
                        </div>
                        <div>
                          <Label>Duration (hours)</Label>
                          <input
                            type="number"
                            min={1}
                            value={durationHours}
                            onChange={(e) => setDurationHours(Math.max(1, Number(e.target.value || 1)))}
                            className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/20"
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">
                          Add-ons
                        </p>
                        {addonList.length === 0 ? (
                          <p className="text-sm text-kado-dark/55">No add-ons available.</p>
                        ) : (
                          <div className="space-y-2.5">
                            {addonList.map((addon) => (
                              <label
                                key={addon.id}
                                className="flex items-center gap-3 rounded-xl border border-kado-dark/10 bg-kado-offwhite/50 px-4 py-3"
                              >
                                <input
                                  type="checkbox"
                                  checked={!!enabledAddons[addon.id]}
                                  onChange={(e) =>
                                    setEnabledAddons((s) => ({ ...s, [addon.id]: e.target.checked }))
                                  }
                                  className="rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-kado-dark">{addon.name}</p>
                                  {addon.description && (
                                    <p className="text-xs text-kado-dark/60">{addon.description}</p>
                                  )}
                                </div>
                                <span className="text-xs font-semibold text-kado-dark/65">
                                  {addon.pricingType === 'fixed'
                                    ? `${formatPhp(addon.price)} / setup`
                                    : addon.pricingType === 'per_head'
                                      ? `${formatPhp(addon.price)} / guest`
                                      : `${formatPhp(addon.price)} / hour`}
                                </span>
                                {addon.pricingType === 'fixed' && enabledAddons[addon.id] && (
                                  <input
                                    type="number"
                                    min={1}
                                    value={addonQty[addon.id] ?? 1}
                                    onChange={(e) =>
                                      setAddonQty((s) => ({ ...s, [addon.id]: Number(e.target.value || 1) }))
                                    }
                                    className="w-20 rounded-lg border border-kado-dark/15 px-2 py-1.5 text-xs"
                                  />
                                )}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Contact Name" value={contactName} onChange={setContactName} required />
                      <Field label="Contact Email" type="email" value={contactEmail} onChange={setContactEmail} required />
                      <Field label="Phone Number" value={contactPhone} onChange={setContactPhone} required />
                      <Field label="Event Name" value={eventName} onChange={setEventName} required />
                      <div>
                        <Label>Occasion</Label>
                        <select
                          value={occasion}
                          onChange={(e) => setOccasion(e.target.value as BoothBookingOccasion)}
                          className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white focus:outline-none focus:ring-2 focus:ring-kado-red/25"
                        >
                          {OCCASIONS.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Field
                        label="Event Date"
                        type="date"
                        value={eventDate}
                        onChange={setEventDate}
                        min={minEventDate}
                        required
                      />
                      <Field label="Start Time" type="time" value={startTime} onChange={setStartTime} required />
                      <Field label="End Time" type="time" value={endTime} onChange={setEndTime} required />
                      <div className="sm:col-span-2">
                        <Label>Special Requests</Label>
                        <textarea
                          rows={3}
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          placeholder="Theme, setup notes, dietary considerations, timeline notes..."
                          className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white resize-none focus:outline-none focus:ring-2 focus:ring-kado-red/25"
                        />
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55">Review</p>
                      <dl className="rounded-xl border border-kado-dark/10 divide-y divide-kado-dark/8">
                        <Row term="Package" desc={selectedPackage?.name ?? '—'} />
                        <Row term="Guests" desc={`${guestCount}`} />
                        <Row term="Duration" desc={`${durationHours} hour(s)`} />
                        <Row term="Event" desc={eventName || '—'} />
                        <Row term="Occasion" desc={OCCASIONS.find((o) => o.id === occasion)?.label ?? occasion} />
                        <Row
                          term="When"
                          desc={eventDate ? `${eventDate} · ${startTime}–${endTime}` : '—'}
                        />
                        <Row term="Contact" desc={`${contactName} · ${contactPhone}`} />
                        <Row term="Email" desc={contactEmail || '—'} />
                        {specialRequests.trim() && <Row term="Requests" desc={specialRequests.trim()} />}
                      </dl>
                      <p className="text-xs text-kado-dark/55 leading-relaxed">
                        Submitting sends an <strong>estimate</strong> to our events team. We&apos;ll review and reply
                        with an official quote you can accept in your account.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3 mt-7">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-kado-dark/15 text-xs font-bold uppercase tracking-wider text-kado-dark/70 hover:border-kado-dark/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-1.5 px-7 py-2.5 rounded-full bg-kado-dark text-kado-cream text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-7 py-2.5 rounded-full bg-kado-red text-white text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Submitting…' : 'Submit booking request'}
                    {!submitting && <ChevronRight className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            <BookingEstimatePreview estimate={draftEstimate} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Label({ children }: { children: string }) {
  return (
    <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5">
      {children}
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: 'text' | 'email' | 'date' | 'time';
  min?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        required={required}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white focus:outline-none focus:ring-2 focus:ring-kado-red/25"
      />
    </div>
  );
}

function Row({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <dt className="text-xs font-bold uppercase tracking-wider text-kado-dark/45 shrink-0">{term}</dt>
      <dd className="text-sm text-kado-dark text-right">{desc}</dd>
    </div>
  );
}
