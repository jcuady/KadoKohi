import { useEffect, useMemo, useState } from 'react';
import { CalendarHeart, Users, Clock3, BadgeCheck } from 'lucide-react';
import BookingSteps from '../components/booking/BookingSteps';
import BookingEstimatePreview from '../components/booking/BookingEstimatePreview';
import BookingForm, { type BookingFormValues } from '../components/booking/BookingForm';
import { useBranchStore } from '../store/branchStore';
import { useBoothCatalogStore } from '../store/boothCatalogStore';
import { useBoothShowcaseStore } from '../store/boothShowcaseStore';
import { useBookingEstimateStore } from '../store/bookingEstimateStore';
import { useBoothBookingStore } from '../store/boothBookingStore';
import { formatPhp } from '../lib/money';

export default function BookBooth() {
  const branches = useBranchStore((s) => s.branches);
  const activeBranches = useMemo(() => branches.filter((b) => b.status === 'active'), [branches]);

  const visiblePackagesForBranch = useBoothCatalogStore((s) => s.visiblePackagesForBranch);
  const visibleAddonsForBranch = useBoothCatalogStore((s) => s.visibleAddonsForBranch);

  const calculateEstimate = useBookingEstimateStore((s) => s.calculateEstimate);
  const draftEstimate = useBookingEstimateStore((s) => s.draft);
  const saveEstimate = useBookingEstimateStore((s) => s.saveEstimate);
  const estimates = useBookingEstimateStore((s) => s.estimates);
  const createBooking = useBoothBookingStore((s) => s.createBooking);
  const showcaseMedia = useBoothShowcaseStore((s) => s.visibleMedia());

  const [branchId, setBranchId] = useState(activeBranches[0]?.id ?? 'branch_marikina');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [guestCount, setGuestCount] = useState(12);
  const [durationHours, setDurationHours] = useState(3);
  const [enabledAddons, setEnabledAddons] = useState<Record<string, boolean>>({});
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  const [submittedCode, setSubmittedCode] = useState('');

  const pkgList = useMemo(() => visiblePackagesForBranch(branchId), [visiblePackagesForBranch, branchId]);
  const addonList = useMemo(() => visibleAddonsForBranch(branchId), [visibleAddonsForBranch, branchId]);
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
    if (!selectedPackageId || !branchId) return;
    calculateEstimate({
      branchId,
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
  }, [branchId, selectedPackageId, guestCount, durationHours, selectedAddonSelections, selectedPackage, calculateEstimate]);

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
      branchId,
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
  };

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen">
      <section className="pt-28 pb-12 px-6 border-b border-kado-dark/5 bg-gradient-to-b from-kado-cream/80 to-[#FAF7F2]">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-kado-red mb-3">Private Events</p>
          <h1 className="font-display text-4xl md:text-6xl font-black text-kado-dark tracking-tight uppercase mb-4">
            Book A Kado Booth
          </h1>
          <p className="text-kado-dark/65 text-base max-w-2xl leading-relaxed">
            Host birthdays, weddings, and intimate celebrations in a Japanese-inspired space with curated coffee, food, and event-ready setup.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Badge icon={CalendarHeart} label="Events & Celebrations" />
            <Badge icon={Users} label="Flexible Group Sizes" />
            <Badge icon={Clock3} label="Custom Duration" />
            <Badge icon={BadgeCheck} label="Professional Team Support" />
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {showcaseMedia.map((media) => (
                <article
                  key={media.id}
                  className="rounded-2xl overflow-hidden border border-kado-dark/10 bg-white shadow-sm"
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
                </article>
            ))}
          </div>
        </div>
      </section>

      <BookingSteps />

      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl bg-white border border-kado-dark/10 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-kado-dark">Build Your Booking</h2>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white focus:outline-none focus:ring-2 focus:ring-kado-red/20"
              >
                {activeBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
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
                    No booth packages are configured for this branch yet.
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">
                    Add-ons
                  </p>
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
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    Booking submitted successfully. Reference code: <strong>{submittedCode}</strong>.
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
