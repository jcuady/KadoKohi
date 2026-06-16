import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { BoothAddonPricingType } from '../../types/domain';
import { useBoothCatalogStore } from '../../store/boothCatalogStore';
import { useBranchStore } from '../../store/branchStore';
import { formatPhp } from '../../lib/money';
import { Plus, Pencil, Trash2 } from 'lucide-react';

type PackageForm = {
  name: string;
  description: string;
  capacity: string;
  durationHours: string;
  basePrice: string;
  image: string;
  inclusions: string;
  branchId: string;
  visible: boolean;
};

type AddonForm = {
  name: string;
  description: string;
  pricingType: BoothAddonPricingType;
  price: string;
  unitLabel: string;
  branchId: string;
  visible: boolean;
};

const EMPTY_PACKAGE_FORM: PackageForm = {
  name: '',
  description: '',
  capacity: '12',
  durationHours: '3',
  basePrice: '',
  image: '',
  inclusions: '',
  branchId: '',
  visible: true,
};

const EMPTY_ADDON_FORM: AddonForm = {
  name: '',
  description: '',
  pricingType: 'fixed',
  price: '',
  unitLabel: '',
  branchId: '',
  visible: true,
};

export default function AdminBoothCatalog() {
  const packages = useBoothCatalogStore((s) => s.packages);
  const addons = useBoothCatalogStore((s) => s.addons);
  const addPackage = useBoothCatalogStore((s) => s.addPackage);
  const updatePackage = useBoothCatalogStore((s) => s.updatePackage);
  const removePackage = useBoothCatalogStore((s) => s.removePackage);
  const addAddon = useBoothCatalogStore((s) => s.addAddon);
  const updateAddon = useBoothCatalogStore((s) => s.updateAddon);
  const removeAddon = useBoothCatalogStore((s) => s.removeAddon);
  const hydrateFromRemote = useBoothCatalogStore((s) => s.hydrateFromRemote);
  const saveToRemote = useBoothCatalogStore((s) => s.saveToRemote);
  const saving = useBoothCatalogStore((s) => s.saving);
  const saveError = useBoothCatalogStore((s) => s.saveError);
  const branches = useBranchStore((s) => s.branches);

  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

  const handlePublish = async () => {
    setSavedMsg('');
    try {
      await saveToRemote();
      setSavedMsg('Booth catalog published.');
    } catch {
      // saveError set in store
    }
  };

  const sortedPackages = useMemo(() => [...packages].sort((a, b) => a.order - b.order), [packages]);
  const sortedAddons = useMemo(() => [...addons].sort((a, b) => a.order - b.order), [addons]);

  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [pkgForm, setPkgForm] = useState<PackageForm>(EMPTY_PACKAGE_FORM);

  const [showAddonModal, setShowAddonModal] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [addonForm, setAddonForm] = useState<AddonForm>(EMPTY_ADDON_FORM);

  const openAddPackage = () => {
    setEditingPkgId(null);
    setPkgForm({ ...EMPTY_PACKAGE_FORM, branchId: branches[0]?.id ?? '' });
    setShowPkgModal(true);
  };

  const openEditPackage = (id: string) => {
    const pkg = sortedPackages.find((p) => p.id === id);
    if (!pkg) return;
    setEditingPkgId(id);
    setPkgForm({
      name: pkg.name,
      description: pkg.description ?? '',
      capacity: String(pkg.capacity),
      durationHours: String(pkg.durationHours),
      basePrice: String(pkg.basePrice),
      image: pkg.image ?? '',
      inclusions: pkg.inclusions.join(', '),
      branchId: pkg.branchId ?? '',
      visible: pkg.visible,
    });
    setShowPkgModal(true);
  };

  const submitPackage = (e: FormEvent) => {
    e.preventDefault();
    if (!pkgForm.name.trim() || !pkgForm.basePrice) return;
    const payload = {
      name: pkgForm.name.trim(),
      description: pkgForm.description.trim() || undefined,
      capacity: Math.max(1, Number(pkgForm.capacity)),
      durationHours: Math.max(1, Number(pkgForm.durationHours)),
      basePrice: Math.max(0, Number(pkgForm.basePrice)),
      image: pkgForm.image.trim() || undefined,
      inclusions: pkgForm.inclusions
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      visible: pkgForm.visible,
      branchId: pkgForm.branchId || undefined,
    };
    if (editingPkgId) {
      updatePackage(editingPkgId, payload);
    } else {
      addPackage({ ...payload, order: sortedPackages.length });
    }
    setShowPkgModal(false);
  };

  const openAddAddon = () => {
    setEditingAddonId(null);
    setAddonForm({ ...EMPTY_ADDON_FORM, branchId: branches[0]?.id ?? '' });
    setShowAddonModal(true);
  };

  const openEditAddon = (id: string) => {
    const addon = sortedAddons.find((a) => a.id === id);
    if (!addon) return;
    setEditingAddonId(id);
    setAddonForm({
      name: addon.name,
      description: addon.description ?? '',
      pricingType: addon.pricingType,
      price: String(addon.price),
      unitLabel: addon.unitLabel ?? '',
      branchId: addon.branchId ?? '',
      visible: addon.visible,
    });
    setShowAddonModal(true);
  };

  const submitAddon = (e: FormEvent) => {
    e.preventDefault();
    if (!addonForm.name.trim() || !addonForm.price) return;
    const payload = {
      name: addonForm.name.trim(),
      description: addonForm.description.trim() || undefined,
      pricingType: addonForm.pricingType,
      price: Math.max(0, Number(addonForm.price)),
      unitLabel: addonForm.unitLabel.trim() || undefined,
      visible: addonForm.visible,
      branchId: addonForm.branchId || undefined,
    };
    if (editingAddonId) {
      updateAddon(editingAddonId, payload);
    } else {
      addAddon({ ...payload, order: sortedAddons.length });
    }
    setShowAddonModal(false);
  };

  return (
    <div className="max-w-5xl dash-page">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-7">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading">Booth Catalog</h1>
          <p className="dash-muted text-sm mt-1">Manage event packages and add-ons for booth bookings.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={saving}
            className="rounded-xl bg-kado-red text-kado-cream px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors disabled:opacity-60"
          >
            {saving ? 'Publishing…' : 'Publish'}
          </button>
          <button
            type="button"
            onClick={openAddPackage}
            className="rounded-xl bg-kado-dark text-kado-cream px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Package
          </button>
          <button
            type="button"
            onClick={openAddAddon}
            className="rounded-xl border dash-border border px-4 py-2.5 text-xs font-bold uppercase tracking-wider dash-heading hover:border-kado-red hover:text-kado-red transition-colors inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add-on
          </button>
        </div>
      </div>

      {savedMsg && <p className="mb-4 text-sm font-semibold text-green-600">{savedMsg}</p>}
      {saveError && <p className="mb-4 text-sm text-red-600">{saveError}</p>}

      <section className="mb-8">
        <h2 className="font-display text-xl font-bold dash-heading mb-3">Packages</h2>
        <div className="space-y-2.5">
          {sortedPackages.map((pkg) => (
            <article key={pkg.id} className="rounded-2xl dash-card border p-5 flex items-start gap-4">
              {pkg.image && (
                <img
                  src={pkg.image}
                  alt={pkg.name}
                  className="w-28 h-20 rounded-xl object-cover border dash-border"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-display text-lg font-bold dash-heading">{pkg.name}</h3>
                  {!pkg.visible && (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full dash-card-alt dash-muted border dash-border">
                      Hidden
                    </span>
                  )}
                </div>
                {pkg.description && <p className="text-sm dash-muted mb-1">{pkg.description}</p>}
                <p className="text-xs dash-muted">
                  Capacity {pkg.capacity} · {pkg.durationHours}h · {formatPhp(pkg.basePrice)}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => openEditPackage(pkg.id)} className="p-1.5 dash-muted hover:text-kado-red">
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => removePackage(pkg.id)} className="p-1.5 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold dash-heading mb-3">Add-ons</h2>
        <div className="space-y-2.5">
          {sortedAddons.map((addon) => (
            <article key={addon.id} className="rounded-2xl dash-card border p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-display text-lg font-bold dash-heading">{addon.name}</h3>
                  {!addon.visible && (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full dash-card-alt dash-muted border dash-border">
                      Hidden
                    </span>
                  )}
                </div>
                {addon.description && <p className="text-sm dash-muted mb-1">{addon.description}</p>}
                <p className="text-xs dash-muted capitalize">
                  {addon.pricingType.replace('_', ' ')} · {formatPhp(addon.price)}
                  {addon.unitLabel ? ` / ${addon.unitLabel}` : ''}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => openEditAddon(addon.id)} className="p-1.5 dash-muted hover:text-kado-red">
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => removeAddon(addon.id)} className="p-1.5 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showPkgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitPackage} className="w-full max-w-xl dash-card rounded-[2rem] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-5 md:px-7 pt-5 md:pt-6 pb-3 border-b dash-border">
              <h3 className="font-display text-xl font-bold dash-heading">{editingPkgId ? 'Edit Package' : 'New Package'}</h3>
            </div>
            <div className="px-5 md:px-7 py-4 md:py-5 space-y-4 overflow-y-auto">
              <Input label="Name" value={pkgForm.name} onChange={(v) => setPkgForm((s) => ({ ...s, name: v }))} required />
              <TextArea label="Description" value={pkgForm.description} onChange={(v) => setPkgForm((s) => ({ ...s, description: v }))} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Capacity" type="number" value={pkgForm.capacity} onChange={(v) => setPkgForm((s) => ({ ...s, capacity: v }))} required />
                <Input label="Duration (hours)" type="number" value={pkgForm.durationHours} onChange={(v) => setPkgForm((s) => ({ ...s, durationHours: v }))} required />
              </div>
              <Input label="Base Price" type="number" value={pkgForm.basePrice} onChange={(v) => setPkgForm((s) => ({ ...s, basePrice: v }))} required />
              <Input label="Image URL" value={pkgForm.image} onChange={(v) => setPkgForm((s) => ({ ...s, image: v }))} />
              <Input label="Inclusions (comma-separated)" value={pkgForm.inclusions} onChange={(v) => setPkgForm((s) => ({ ...s, inclusions: v }))} />
              <SelectBranch
                value={pkgForm.branchId}
                branches={branches}
                onChange={(v) => setPkgForm((s) => ({ ...s, branchId: v }))}
              />
              <label className="text-xs dash-muted flex items-center gap-2">
                <input type="checkbox" checked={pkgForm.visible} onChange={(e) => setPkgForm((s) => ({ ...s, visible: e.target.checked }))} />
                Visible
              </label>
            </div>
            <div className="px-5 md:px-7 py-4 border-t dash-border bg-[var(--color-dash-surface)]/95 flex justify-end gap-3">
              <button type="button" onClick={() => setShowPkgModal(false)} className="rounded-xl border dash-border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted">Cancel</button>
              <button type="submit" className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider">{editingPkgId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      {showAddonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitAddon} className="w-full max-w-lg dash-card rounded-[2rem] p-6 md:p-8 space-y-4 shadow-2xl">
            <h3 className="font-display text-xl font-bold dash-heading">{editingAddonId ? 'Edit Add-on' : 'New Add-on'}</h3>
            <Input label="Name" value={addonForm.name} onChange={(v) => setAddonForm((s) => ({ ...s, name: v }))} required />
            <TextArea label="Description" value={addonForm.description} onChange={(v) => setAddonForm((s) => ({ ...s, description: v }))} />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Pricing type</label>
              <select
                value={addonForm.pricingType}
                onChange={(e) => setAddonForm((s) => ({ ...s, pricingType: e.target.value as BoothAddonPricingType }))}
                className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
              >
                <option value="fixed">Fixed</option>
                <option value="per_head">Per head</option>
                <option value="per_hour">Per hour</option>
              </select>
            </div>
            <Input label="Price" type="number" value={addonForm.price} onChange={(v) => setAddonForm((s) => ({ ...s, price: v }))} required />
            <Input label="Unit label (optional)" value={addonForm.unitLabel} onChange={(v) => setAddonForm((s) => ({ ...s, unitLabel: v }))} />
            <SelectBranch
              value={addonForm.branchId}
              branches={branches}
              onChange={(v) => setAddonForm((s) => ({ ...s, branchId: v }))}
            />
            <label className="text-xs dash-muted flex items-center gap-2">
              <input type="checkbox" checked={addonForm.visible} onChange={(e) => setAddonForm((s) => ({ ...s, visible: e.target.checked }))} />
              Visible
            </label>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setShowAddonModal(false)} className="rounded-xl border dash-border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted">Cancel</button>
              <button type="submit" className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider">{editingAddonId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: 'text' | 'number';
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">{label}</label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm resize-none"
      />
    </div>
  );
}

function SelectBranch({
  value,
  branches,
  onChange,
}: {
  value: string;
  branches: { id: string; name: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Branch scope</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
      >
        <option value="">All branches</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </div>
  );
}
