import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Mail, PartyPopper, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { useBoothShowcaseStore } from '../../store/boothShowcaseStore';
import { useBoothCatalogStore } from '../../store/boothCatalogStore';
import { buildBookingEstimate } from '../../store/bookingEstimateStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { BoothBookingOccasion, BoothBookingSelectedAddonSnapshot, BookingEstimate } from '../../types/domain';
import EventAvailabilityCalendar from './EventAvailabilityCalendar';
import CmsStyledText from '../cms/CmsStyledText';
import { buildBoothProposalMailto } from '../../lib/boothProposalEmail';
import { buildProposalEstimate } from '../../lib/boothProposal';
import { formatPhp } from '../../lib/money';
import {
  EVENT_PROPOSAL_PACKAGE_ID,
  EVENT_PROPOSAL_PACKAGE_NAME,
  isDateSelectable,
  minEventDateKey,
} from '../../lib/eventCalendar';
import { useEventCalendarStore } from '../../store/eventCalendarStore';

const OCCASIONS: { id: BoothBookingOccasion; label: string }[] = [
  { id: 'birthday', label: 'Birthday' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'private_party', label: 'Private Party' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'other', label: 'Other' },
];

export type BookingWizardStage = 'form' | 'submitted';

interface BookingWizardProps {
  onStageChange?: (stage: BookingWizardStage) => void;
}

export default function BookingWizard({ onStageChange }: BookingWizardProps) {
  const user = useAuthStore((s) => s.user);
  const contactEmail = useSettingsStore((s) => s.settings.contactEmail);
  const pageCopy = useBoothShowcaseStore((s) => s.pageCopy);
  const createBooking = useBoothBookingStore((s) => s.createBooking);
  const loadMonth = useEventCalendarStore((s) => s.loadMonth);
  const catalogPackages = useBoothCatalogStore((s) => s.visiblePackages());
  const catalogAddons = useBoothCatalogStore((s) => s.visibleAddons());
  const taxRate = useSettingsStore((s) => s.settings.taxRate);

  const [packageChoice, setPackageChoice] = useState(EVENT_PROPOSAL_PACKAGE_ID);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const packageDefaulted = useRef(false);

  const [contactName, setContactName] = useState('');
  const [contactEmailField, setContactEmailField] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [eventName, setEventName] = useState('');
  const [occasion, setOccasion] = useState<BoothBookingOccasion>('birthday');
  const [guestCount, setGuestCount] = useState(30);
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('18:00');
  const [message, setMessage] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState('');
  const [mailtoHref, setMailtoHref] = useState('');

  useEffect(() => {
    onStageChange?.(submittedCode ? 'submitted' : 'form');
  }, [submittedCode, onStageChange]);

  useEffect(() => {
    if (user) {
      setContactName((v) => v || user.name || '');
      setContactEmailField((v) => v || user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (!eventDate) return;
    const [y, m] = eventDate.split('-').map(Number);
    void loadMonth(y, m);
  }, [eventDate, loadMonth]);

  useEffect(() => {
    if (packageDefaulted.current || catalogPackages.length === 0) return;
    setPackageChoice(catalogPackages[0].id);
    packageDefaulted.current = true;
  }, [catalogPackages]);

  const isProposal = packageChoice === EVENT_PROPOSAL_PACKAGE_ID;
  const selectedPackage = catalogPackages.find((pkg) => pkg.id === packageChoice);

  const durationHours = useMemo(() => {
    if (!startTime || !endTime || endTime <= startTime) return selectedPackage?.durationHours ?? 3;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return Math.max(1, Math.ceil((eh * 60 + em - (sh * 60 + sm)) / 60));
  }, [startTime, endTime, selectedPackage?.durationHours]);

  const liveEstimate = useMemo(() => {
    if (isProposal || !selectedPackage) return null;
    return buildBookingEstimate({
      branchId: selectedPackage.branchId,
      packageId: selectedPackage.id,
      guestCount,
      durationHours,
      addonSelections: selectedAddonIds.map((addonId) => ({ addonId })),
      taxRatePercent: taxRate,
      assumptions: ['Indicative estimate — final quote confirmed by our events team'],
    });
  }, [isProposal, selectedPackage, guestCount, durationHours, selectedAddonIds, taxRate]);

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId],
    );
  };

  function addonSnapshotsFromEstimate(estimate: BookingEstimate): BoothBookingSelectedAddonSnapshot[] {
    const addons = useBoothCatalogStore.getState().addons;
    return estimate.lineItems
      .filter((line) => line.sourceType === 'addon')
      .map((line) => {
        const addon = addons.find((a) => a.id === line.sourceId);
        return {
          addonId: line.sourceId,
          addonNameSnapshot: line.labelSnapshot,
          pricingType: addon?.pricingType ?? 'fixed',
          qty: line.qty,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
        };
      });
  }

  const scheduleValid =
    !!contactName.trim() &&
    !!contactEmailField.trim() &&
    !!contactPhone.trim() &&
    !!eventName.trim() &&
    !!eventDate &&
    eventDate >= minEventDateKey() &&
    !!startTime &&
    !!endTime &&
    endTime > startTime;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!scheduleValid) {
      setError('Please complete all required fields and pick an available date on the calendar.');
      return;
    }

    const [y, m] = eventDate.split('-').map(Number);
    const month = await loadMonth(y, m);
    if (!isDateSelectable(eventDate, month)) {
      setError('That date is no longer available. Please choose another day on the calendar.');
      return;
    }

    const startsAt = new Date(`${eventDate}T${startTime}:00`);
    const endsAt = new Date(`${eventDate}T${endTime}:00`);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setError('Invalid event time. Please check start and end times.');
      return;
    }

    const estimate = isProposal
      ? buildProposalEstimate('PENDING')
      : liveEstimate ?? buildProposalEstimate('PENDING');

    const packageId = isProposal ? EVENT_PROPOSAL_PACKAGE_ID : selectedPackage!.id;
    const packageNameSnapshot = isProposal ? EVENT_PROPOSAL_PACKAGE_NAME : selectedPackage!.name;
    const packageBasePriceSnapshot = isProposal ? 0 : selectedPackage!.basePrice;
    const selectedAddons = isProposal ? [] : addonSnapshotsFromEstimate(estimate);

    setSubmitting(true);
    setError('');
    try {
      const booking = await createBooking({
        customerId: user?.role === 'customer' ? user.id : undefined,
        contactName: contactName.trim(),
        contactEmail: contactEmailField.trim(),
        contactPhone: contactPhone.trim(),
        eventName: eventName.trim(),
        occasion,
        guestCount,
        eventDate: new Date(eventDate).toISOString(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        branchId: selectedPackage?.branchId,
        packageId,
        packageNameSnapshot,
        packageBasePriceSnapshot,
        selectedAddons,
        specialRequests: message.trim() || undefined,
        estimateSnapshot: { ...estimate, shortCode: 'PENDING' },
        status: 'submitted',
      });
      const mailto = buildBoothProposalMailto({
        to: contactEmail,
        referenceCode: booking.shortCode,
        contactName: contactName.trim(),
        contactEmail: contactEmailField.trim(),
        contactPhone: contactPhone.trim(),
        eventName: eventName.trim(),
        occasion,
        guestCount,
        eventDate,
        startTime,
        endTime,
        message: message.trim() || undefined,
      });

      setSubmittedCode(booking.shortCode);
      setMailtoHref(mailto);
      window.location.href = mailto;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your proposal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedCode) {
    return (
      <section className="py-10 px-6" id="booking-form">
        <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-green-200 p-8 md:p-10 text-center shadow-sm">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 text-green-600 mb-5">
            <Check className="w-7 h-7" />
          </span>
          <h2 className="font-display text-2xl md:text-3xl font-black text-kado-dark mb-3">Proposal saved</h2>
          <p className="text-sm text-kado-dark/65 leading-relaxed max-w-md mx-auto mb-2">
            Reference <strong className="text-kado-dark">{submittedCode}</strong>. We opened your email app so you can
            send your proposal to our events team — we&apos;ll reply to negotiate pricing and details.
          </p>
          <p className="text-sm text-kado-dark/55 mb-7">
            No payment is required now. Pricing is discussed after we review your event.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {mailtoHref && (
              <a
                href={mailtoHref}
                className="inline-flex items-center justify-center gap-2 min-h-[52px] px-8 bg-kado-red text-white text-xs font-bold uppercase tracking-[0.15em] rounded-full hover:bg-kado-dark transition-colors"
              >
                <Mail className="w-4 h-4" /> Open email again
              </a>
            )}
            {user?.role === 'customer' && (
              <Link
                to="/account/booth"
                className="inline-flex items-center justify-center gap-2 min-h-[52px] px-8 border-2 border-kado-dark text-kado-dark text-xs font-bold uppercase tracking-[0.15em] rounded-full hover:bg-kado-dark hover:text-kado-cream transition-colors"
              >
                View my proposals <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-6" id="booking-form">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-2xl bg-white border border-kado-dark/10 p-5 md:p-8 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-kado-red/10 text-kado-red shrink-0">
              <PartyPopper className="w-6 h-6" />
            </span>
            <div>
              <CmsStyledText value={pageCopy.proposalTitle} as="h2" className="font-display text-2xl md:text-3xl font-bold" defaultColorClass="text-kado-dark" />
              <CmsStyledText
                value={pageCopy.proposalDescription}
                as="p"
                className="mt-1 max-w-2xl leading-relaxed"
                defaultSizeClass="kado-body-sm"
                defaultColorClass="text-kado-dark/60"
              />
            </div>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Your name" value={contactName} onChange={setContactName} required />
                <Field label="Email" type="email" value={contactEmailField} onChange={setContactEmailField} required />
                <Field label="Phone" value={contactPhone} onChange={setContactPhone} required />
                <Field label="Event name" value={eventName} onChange={setEventName} required placeholder="e.g. Ana's 30th" />
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
                <div>
                  <Label>Approx. guests</Label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value || 1)))}
                    className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/20"
                  />
                </div>
                <Field label="Start time" type="time" value={startTime} onChange={setStartTime} required />
                <Field label="End time" type="time" value={endTime} onChange={setEndTime} required />
              </div>

              {catalogPackages.length > 0 && (
                <div>
                  <Label>Package</Label>
                  <div className="space-y-2">
                    {catalogPackages.map((pkg) => (
                      <label
                        key={pkg.id}
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                          packageChoice === pkg.id
                            ? 'border-kado-red bg-kado-red/5'
                            : 'border-kado-dark/15 hover:border-kado-dark/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="booth-package"
                          checked={packageChoice === pkg.id}
                          onChange={() => setPackageChoice(pkg.id)}
                          className="mt-1"
                        />
                        <span className="min-w-0">
                          <span className="block font-bold text-sm text-kado-dark">{pkg.name}</span>
                          <span className="block text-xs text-kado-dark/60 mt-0.5">
                            Up to {pkg.capacity} guests · {pkg.durationHours}h from {formatPhp(pkg.basePrice)}
                          </span>
                          {pkg.description && (
                            <span className="block text-xs text-kado-dark/50 mt-1">{pkg.description}</span>
                          )}
                        </span>
                      </label>
                    ))}
                    <label
                      className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                        isProposal
                          ? 'border-kado-red bg-kado-red/5'
                          : 'border-kado-dark/15 hover:border-kado-dark/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="booth-package"
                        checked={isProposal}
                        onChange={() => setPackageChoice(EVENT_PROPOSAL_PACKAGE_ID)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-bold text-sm text-kado-dark">Custom proposal</span>
                        <span className="block text-xs text-kado-dark/60 mt-0.5">
                          Pricing discussed with our events team after review.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {!isProposal && catalogAddons.length > 0 && (
                <div>
                  <Label>Add-ons</Label>
                  <div className="space-y-2">
                    {catalogAddons.map((addon) => (
                      <label
                        key={addon.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-kado-dark/15 px-4 py-2.5 cursor-pointer hover:border-kado-dark/30"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedAddonIds.includes(addon.id)}
                            onChange={() => toggleAddon(addon.id)}
                          />
                          <span className="text-sm text-kado-dark truncate">{addon.name}</span>
                        </span>
                        <span className="text-xs font-bold text-kado-dark/70 shrink-0">{formatPhp(addon.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!isProposal && liveEstimate && (
                <div className="rounded-xl border border-kado-dark/10 bg-kado-offwhite/80 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-2">
                    Indicative estimate
                  </p>
                  <p className="font-display text-2xl font-bold text-kado-dark">{formatPhp(liveEstimate.total)}</p>
                  <p className="text-xs text-kado-dark/55 mt-1">Final quote confirmed after our team reviews your event.</p>
                </div>
              )}

              <div>
                <Label>What are you planning?</Label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your vision, menu ideas, or questions about pricing..."
                  className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white resize-none focus:outline-none focus:ring-2 focus:ring-kado-red/25"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}

              <motion.button
                type="submit"
                disabled={submitting}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[52px] px-8 rounded-full bg-kado-red text-white text-xs font-bold uppercase tracking-[0.15em] hover:bg-kado-dark transition-colors disabled:opacity-60"
              >
                <Mail className="w-4 h-4" />
                {submitting ? 'Saving…' : <CmsStyledText value={pageCopy.proposalCtaLabel} as="span" />}
              </motion.button>

              <p className="text-xs text-kado-dark/50 leading-relaxed">
                <CmsStyledText value={pageCopy.proposalEmailNote} as="span" /> Email: {contactEmail}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">
                Pick an available date
              </p>
              <EventAvailabilityCalendar selectedDate={eventDate} onSelectDate={setEventDate} />
              {!eventDate && (
                <p className="text-xs text-kado-dark/50 mt-2">Green dates are open. Red means unavailable.</p>
              )}
            </div>
          </form>
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: 'text' | 'email' | 'time';
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white focus:outline-none focus:ring-2 focus:ring-kado-red/25"
      />
    </div>
  );
}
