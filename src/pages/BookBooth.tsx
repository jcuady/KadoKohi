import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarHeart, Users, Clock3, BadgeCheck, ArrowDown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import BookingSteps from '../components/booking/BookingSteps';
import BookingEstimatePreview from '../components/booking/BookingEstimatePreview';
import BookingForm, { type BookingFormValues } from '../components/booking/BookingForm';
import { useBoothCatalogStore } from '../store/boothCatalogStore';
import { useBoothShowcaseStore } from '../store/boothShowcaseStore';
import { useBookingEstimateStore } from '../store/bookingEstimateStore';
import { useBoothBookingStore } from '../store/boothBookingStore';
import { formatPhp } from '../lib/money';

export default function BookBooth() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const visiblePackages = useBoothCatalogStore((s) => s.visiblePackages);
  const visibleAddons = useBoothCatalogStore((s) => s.visibleAddons);

  const calculateEstimate = useBookingEstimateStore((s) => s.calculateEstimate);
  const draftEstimate = useBookingEstimateStore((s) => s.draft);
  const saveEstimate = useBookingEstimateStore((s) => s.saveEstimate);
  const estimates = useBookingEstimateStore((s) => s.estimates);
  const createBooking = useBoothBookingStore((s) => s.createBooking);
  const showcaseMediaRaw = useBoothShowcaseStore((s) => s.media);
  const showcaseMedia = useMemo(
    () =>
      [...showcaseMediaRaw]
        .filter((item) => item.visible)
        .sort((a, b) => a.order - b.order),
    [showcaseMediaRaw],
  );

  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [guestCount, setGuestCount] = useState(12);
  const [durationHours, setDurationHours] = useState(3);
  const [enabledAddons, setEnabledAddons] = useState<Record<string, boolean>>({});
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  const [submittedCode, setSubmittedCode] = useState('');

  const pkgList = useMemo(() => visiblePackages(), [visiblePackages]);
  const addonList = useMemo(() => visibleAddons(), [visibleAddons]);
  const selectedPackage = pkgList.find((pkg) => pkg.id === selectedPackageId);

  useEffect(() => {
    if (!pkgList.length) return;
    if (!pkgList.some((pkg) => pkg.id === selectedPackageId)) {
      const fallback = pkgList[0];
      setSelectedPackageId(fallback.id);
      setGuestCount(fallback.capacity);
      setDurationHours(fallback.durationHours);
    }
  }, [pkgList, selectedPackageId]);

  useEffect(() => {
    if (!selectedPackage) return;
    setGuestCount((n) => Math.max(1, Math.min(n, Math.max(selectedPackage.capacity * 2, selectedPackage.capacity))));
    setDurationHours(selectedPackage.durationHours);
  }, [selectedPackage]);

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

  const handleSubmitBooking = async (values: BookingFormValues) => {
    if (!selectedPackage || !draftEstimate) {
      throw new Error('Please select a package and wait for the estimate preview before submitting.');
    }

    const estimateToSave = {
      ...draftEstimate,
      status: 'sent' as const,
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveEstimate(estimateToSave);

    const startsAt = new Date(`${values.eventDate}T${values.startTime}:00`);
    const endsAt = new Date(`${values.eventDate}T${values.endTime}:00`);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new Error('Invalid event schedule. Please review event date and time.');
    }
    const selectedAddonsSnapshot = selectedAddonSelections.map((s) => {
      const addon = addonList.find((a) => a.id === s.addonId)!;
      const estimateLine = estimateToSave.lineItems.find((line) => line.sourceId === addon.id);
      return {
        addonId: addon.id,
        addonNameSnapshot: addon.name,
        pricingType: addon.pricingType,
        qty: estimateLine?.qty ?? s.qty ?? 1,
        unitPrice: addon.price,
        lineTotal: estimateLine?.lineTotal ?? addon.price,
      };
    });

    const booking = createBooking({
      customerId: user?.role === 'customer' ? user.id : undefined,
      contactName: values.contactName.trim(),
      contactEmail: values.contactEmail.trim(),
      contactPhone: values.contactPhone.trim(),
      eventName: values.eventName.trim(),
      occasion: values.occasion,
      guestCount: values.guestCount,
      eventDate: new Date(values.eventDate).toISOString(),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      packageId: selectedPackage.id,
      packageNameSnapshot: selectedPackage.name,
      packageBasePriceSnapshot: selectedPackage.basePrice,
      selectedAddons: selectedAddonsSnapshot,
      specialRequests: values.specialRequests?.trim() || undefined,
      estimateSnapshot: estimateToSave,
      status: 'submitted',
    });

    setSubmittedCode(booking.shortCode);
    if (user?.role === 'customer') {
      navigate('/account/booth');
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-kado-dark" style={{ minHeight: 'min(92svh, 680px)' }}>
        {/* Photo collage grid */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-0.5 opacity-60">
          <div className="col-span-4 row-span-3 overflow-hidden">
            <img src="/booth-photos/booth-1.jpg" alt="Kado Kohi booth event" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-5 row-span-4 overflow-hidden">
            <img src="/booth-photos/booth-2.jpg" alt="Kado Kohi booth setup" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-3 row-span-2 overflow-hidden">
            <img src="/booth-photos/booth-3.jpg" alt="Kado Kohi booth guests" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-4 row-span-3 overflow-hidden">
            <img src="/booth-photos/booth-4.jpg" alt="Kado Kohi event drinks" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-3 row-span-2 overflow-hidden">
            <img src="/booth-photos/booth-5.jpg" alt="Kado Kohi event venue" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-5 row-span-2 overflow-hidden">
            <img src="/booth-photos/booth-1.jpg" alt="Kado Kohi booth" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
        </div>

        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-kado-dark/95 via-kado-dark/75 to-kado-dark/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-kado-dark/80 via-transparent to-transparent" />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col justify-end h-full px-6 sm:px-10 md:px-16 pb-12 sm:pb-16" style={{ minHeight: 'inherit' }}>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.28em] text-kado-red mb-4">
              Events &amp; Celebrations
            </p>
            <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-black text-white leading-[0.95] tracking-tight uppercase mb-5 drop-shadow-lg">
              Your Moment,<br />Our Space.
            </h1>
            <p className="text-kado-cream/85 text-base sm:text-lg leading-relaxed max-w-xl mb-8">
              Host birthdays, weddings, and intimate celebrations in a Japanese-inspired space with curated coffee, food, and an event-ready setup that's anything but ordinary.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {[
                { icon: CalendarHeart, label: 'Events & Celebrations' },
                { icon: Users, label: 'Flexible Group Sizes' },
                { icon: Clock3, label: 'Custom Duration' },
                { icon: BadgeCheck, label: 'Professional Support' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm text-[10px] sm:text-xs font-bold uppercase tracking-wider text-kado-cream/90">
                  <Icon className="w-3 h-3 text-kado-red shrink-0" />{label}
                </span>
              ))}
            </div>

            <a
              href="#booking-form"
              className="inline-flex items-center gap-2.5 min-h-[52px] px-8 bg-kado-red text-white text-xs font-bold uppercase tracking-[0.15em] rounded-sm shadow-lg shadow-kado-red/30 hover:bg-[#7d1115] transition-colors"
            >
              Book an Event <ArrowDown className="w-4 h-4 shrink-0" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── SHOWCASE ─────────────────────────────────────────────── */}
      {showcaseMedia.length > 0 && (
        <section className="py-10 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {showcaseMedia.map((media, i) => (
                <motion.article
                  key={media.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="rounded-2xl overflow-hidden border border-kado-dark/10 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <img
                    src={media.image}
                    alt={media.title}
                    className="w-full aspect-[4/3] object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-4">
                    <h3 className="font-display text-lg font-bold text-kado-dark">{media.title}</h3>
                    {media.caption && <p className="text-sm text-kado-dark/60 mt-1">{media.caption}</p>}
                  </div>
                </motion.article>
              ))}

              {/* Always show booth photos as additional cards */}
              {[
                { src: '/booth-photos/booth-3.jpg', title: 'Intimate Gatherings', caption: 'Perfect for birthdays and milestones.' },
                { src: '/booth-photos/booth-5.jpg', title: 'Event-Ready Setup', caption: 'We handle the space, you enjoy the moment.' },
                { src: '/booth-photos/booth-4.jpg', title: 'Curated Drinks Bar', caption: 'Signature Kado coffee, served fresh.' },
              ].map(({ src, title, caption }, i) => (
                <motion.article
                  key={src}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: (showcaseMedia.length + i) * 0.07 }}
                  className="rounded-2xl overflow-hidden border border-kado-dark/10 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <img src={src} alt={title} className="w-full aspect-[4/3] object-cover" />
                  <div className="p-4">
                    <h3 className="font-display text-lg font-bold text-kado-dark">{title}</h3>
                    <p className="text-sm text-kado-dark/60 mt-1">{caption}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      <BookingSteps />

      <section className="py-8 px-6" id="booking-form">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl bg-white border border-kado-dark/10 p-5 md:p-6">
            <div className="mb-5">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-kado-dark">Build Your Booking</h2>
              <p className="text-sm text-kado-dark/55 mt-1">Events bookings are managed brand-wide — no branch selection needed.</p>
            </div>

            <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">
                    Choose Package
                  </p>
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
                          Capacity: <strong>{pkg.capacity}</strong> · Duration: <strong>{pkg.durationHours}h</strong>
                        </p>
                        <p className="mt-2 text-kado-red font-bold">{formatPhp(pkg.basePrice)}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-1.5">
                      Guest count
                    </label>
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
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-1.5">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={durationHours}
                      onChange={(e) => setDurationHours(Math.max(1, Number(e.target.value || 1)))}
                      className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/20"
                    />
                  </div>
                </div>

                {pkgList.length === 0 && (
                  <div className="rounded-xl border border-kado-dark/10 bg-kado-offwhite/60 px-4 py-3 text-sm text-kado-dark/65">
                    No event packages are available yet. Check back soon or contact us.
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">Add-ons</p>
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
                            setEnabledAddons((s) => ({
                              ...s,
                              [addon.id]: e.target.checked,
                            }))
                          }
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-kado-dark">{addon.name}</p>
                          {addon.description && <p className="text-xs text-kado-dark/60">{addon.description}</p>}
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
                </div>

                {submittedCode && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 space-y-2">
                    <p>
                      Booking submitted. Reference: <strong>{submittedCode}</strong>. This is an{' '}
                      <strong>estimate only</strong> — we will send an official quote after review.
                    </p>
                    {user?.role === 'customer' ? (
                      <Link to="/account/booth" className="font-bold text-kado-red hover:underline">
                        View in Events Bookings →
                      </Link>
                    ) : (
                      <p>
                        <Link to="/auth/login" className="font-bold text-kado-red hover:underline">
                          Sign in
                        </Link>{' '}
                        to track your booking and quotes.
                      </p>
                    )}
                  </div>
                )}

                <BookingForm
                  defaultGuestCount={guestCount}
                  guestCount={guestCount}
                  onGuestCountChange={setGuestCount}
                  onSubmit={handleSubmitBooking}
                />
              </div>

              <BookingEstimatePreview estimate={draftEstimate} />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red mb-3">Sample Estimates</p>
          <h2 className="font-display text-3xl md:text-4xl font-black text-kado-dark mb-6">Budget Guidance</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[...estimates]
              .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
              .slice(0, 4)
              .map((estimate) => (
                <article key={estimate.id} className="rounded-2xl bg-white border border-kado-dark/10 p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-display text-xl font-bold text-kado-dark">{estimate.shortCode}</p>
                    <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full bg-kado-red/10 text-kado-red">
                      {estimate.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {estimate.lineItems.map((line) => (
                      <div key={line.id} className="flex justify-between text-sm text-kado-dark/70">
                        <span>{line.labelSnapshot}</span>
                        <span>{formatPhp(line.lineTotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-kado-dark/10 pt-2 flex justify-between font-bold text-kado-dark">
                    <span>Total</span>
                    <span className="text-kado-red">{formatPhp(estimate.total)}</span>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Badge({ icon: Icon, label }: { icon: typeof CalendarHeart; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-kado-dark/10 bg-white px-3 py-1.5 text-xs font-semibold text-kado-dark/70">
      <Icon className="w-3.5 h-3.5 text-kado-red" />
      {label}
    </span>
  );
}
