import { useEffect, useState, type FormEvent } from 'react';
import type { Branch, BranchStatus } from '../../types/domain';
import { useBranchStore } from '../../store/branchStore';
import { MapPin, Pencil, Trash2, Plus, Navigation, ExternalLink, Loader2 } from 'lucide-react';

const emptyForm: Omit<Branch, 'id' | 'createdAt' | 'updatedAt' | 'hours'> & { hoursNote: string } = {
  slug: '',
  name: '',
  address: '',
  city: '',
  status: 'active',
  heroImage: '',
  hoursNote: '',
  lat: undefined,
  lng: undefined,
};

function osmEmbedUrl(lat: number, lng: number) {
  const d = 0.005;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
}

function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export default function AdminBranches() {
  const branches = useBranchStore((s) => s.branches);
  const hydrateBranches = useBranchStore((s) => s.hydrateFromRemote);
  const addBranch = useBranchStore((s) => s.addBranch);
  const updateBranch = useBranchStore((s) => s.updateBranch);
  const removeBranch = useBranchStore((s) => s.removeBranch);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveOk, setSaveOk] = useState('');

  useEffect(() => {
    void hydrateBranches();
  }, [hydrateBranches]);

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (b: Branch) => {
    setEditingId(b.id);
    setForm({
      slug: b.slug,
      name: b.name,
      address: b.address,
      city: b.city,
      status: b.status,
      heroImage: b.heroImage ?? '',
      hoursNote: '',
      lat: b.lat,
      lng: b.lng,
    });
  };

  const autoLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocating(false);
      },
      () => setLocating(false),
    );
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.name.trim()) return;

    const normalizedSlug = form.slug.trim().toLowerCase().replace(/\s+/g, '-');
    setSaving(true);
    setSaveError('');
    setSaveOk('');

    try {
      if (editingId) {
        await updateBranch(editingId, {
          slug: normalizedSlug,
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          status: form.status,
          heroImage: form.heroImage.trim() || undefined,
          lat: form.lat,
          lng: form.lng,
        });
        setSaveOk('Branch updated. Staff, POS, and QR links will use the new details.');
      } else {
        const created = await addBranch({
          slug: normalizedSlug,
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          status: form.status,
          hours: [],
          heroImage: form.heroImage.trim() || undefined,
          lat: form.lat,
          lng: form.lng,
        });
        setSaveOk(
          `"${created.name}" is live — 4 dine-in tables + takeout QR seeded. Assign barista/staff in Users, then open Tables & QR.`,
        );
      }
      reset();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save branch.');
    } finally {
      setSaving(false);
    }
  };

  const hasCoords = form.lat != null && form.lng != null;

  return (
    <div className="max-w-5xl dash-page">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Branches</h1>
      <p className="dash-muted mb-4 max-w-2xl">
        Add or edit branches — each active branch appears in the dashboard branch filter, customer checkout, Admin POS,
        and gets its own dine-in + takeout QR codes. Assign barista/staff to a branch in Users.
      </p>
      {saveOk ? <p className="text-sm text-emerald-700 font-medium mb-4">{saveOk}</p> : null}
      {saveError ? <p className="text-sm text-red-600 font-medium mb-4">{saveError}</p> : null}

      <div className="grid lg:grid-cols-5 gap-8">
        <form
          onSubmit={submit}
          className="lg:col-span-2 rounded-2xl dash-card border p-6 space-y-4 h-fit sticky top-6"
        >
          <h2 className="font-display text-lg font-bold dash-heading flex items-center gap-2">
            <Plus className="w-5 h-5 text-kado-red" />
            {editingId ? 'Edit branch' : 'Add branch'}
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Slug (URL)</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full rounded-xl dash-input border px-3 py-2 text-sm"
              placeholder="e.g. bgc"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Display name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl dash-input border px-3 py-2 text-sm"
              placeholder="Kado Kohi — BGC"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full rounded-xl dash-input border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">City</label>
            <input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full rounded-xl dash-input border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BranchStatus }))}
              className="w-full rounded-xl dash-input border px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="coming_soon">Coming soon</option>
            </select>
          </div>

          {/* Lat / Lng */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={form.lat ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lat: e.target.value === '' ? undefined : Number(e.target.value) }))
                }
                className="w-full rounded-xl dash-input border px-3 py-2 text-sm"
                placeholder="14.5547"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={form.lng ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lng: e.target.value === '' ? undefined : Number(e.target.value) }))
                }
                className="w-full rounded-xl dash-input border px-3 py-2 text-sm"
                placeholder="121.0244"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={autoLocate}
            disabled={locating}
            className="w-full flex items-center justify-center gap-2 rounded-xl border dash-border px-3 py-2 text-sm font-semibold dash-muted hover:bg-kado-cream transition-colors disabled:opacity-50"
          >
            {locating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            {locating ? 'Locating…' : 'Auto-locate (use my position)'}
          </button>

          {hasCoords && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                  Google Maps URL
                </label>
                <input
                  readOnly
                  value={googleMapsUrl(form.lat!, form.lng!)}
                  className="w-full rounded-xl dash-input border px-3 py-2 text-xs dash-muted select-all"
                />
              </div>
              <div className="rounded-xl overflow-hidden border dash-border">
                <iframe
                  title="Map preview"
                  src={osmEmbedUrl(form.lat!, form.lng!)}
                  className="w-full h-48"
                  style={{ border: 0 }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-kado-red text-kado-cream py-3 text-sm font-bold uppercase tracking-wider hover:bg-[#7d1115] transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Save' : 'Create'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border dash-border px-4 text-sm font-semibold dash-muted hover:bg-kado-cream"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="lg:col-span-3 space-y-3">
          {branches.map((b) => {
            const branchHasCoords = b.lat != null && b.lng != null;
            return (
              <div
                key={b.id}
                className="rounded-2xl dash-card border p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-kado-red shrink-0" />
                      <span className="text-xs font-mono dash-muted">{b.slug}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          b.status === 'active' ? 'bg-kado-dark text-kado-cream' : 'bg-kado-red/10 text-kado-red'
                        }`}
                      >
                        {b.status === 'active' ? 'Active' : 'Soon'}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg text-kado-dark dash-heading truncate">{b.name}</h3>
                    {(b.address || b.city) && (
                      <p className="text-sm dash-muted truncate">
                        {[b.address, b.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(b)}
                      className="p-2.5 rounded-xl border dash-border hover:bg-kado-cream text-kado-dark dash-heading"
                      aria-label="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `Remove branch "${b.name}"? Its tables will be removed. This may fail if orders still reference this branch.`,
                          )
                        ) {
                          void removeBranch(b.id).catch((err) =>
                            setSaveError(err instanceof Error ? err.message : 'Could not remove branch.'),
                          );
                        }
                      }}
                      className="p-2.5 rounded-xl border border-kado-red/20 text-kado-red hover:bg-kado-red/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {branchHasCoords && (
                  <div className="space-y-2">
                    <div className="rounded-xl overflow-hidden border dash-border">
                      <iframe
                        title={`Map of ${b.name}`}
                        src={osmEmbedUrl(b.lat!, b.lng!)}
                        className="w-full h-36"
                        style={{ border: 0 }}
                      />
                    </div>
                    <a
                      href={googleMapsUrl(b.lat!, b.lng!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-kado-red hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View on Maps
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
