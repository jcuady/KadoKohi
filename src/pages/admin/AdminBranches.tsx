import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Branch, BranchStatus } from '../../types/domain';
import { useBranchStore } from '../../store/branchStore';
import { formatBranchCrudError } from '../../lib/supabase/repositories/ordering';
import { uploadCmsImageFile } from '../../lib/cmsImageUpload';
import { branchGoogleMapsUrl, branchHeroImageUrl, branchOsmEmbedUrl } from '../../lib/branchMaps';
import BranchLocationPicker from '../../components/admin/BranchLocationPicker';
import { MapPin, Pencil, Trash2, Plus, ExternalLink, Loader2, Upload } from 'lucide-react';

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

export default function AdminBranches() {
  const branches = useBranchStore((s) => s.branches);
  const hydrateBranches = useBranchStore((s) => s.hydrateFromRemote);
  const addBranch = useBranchStore((s) => s.addBranch);
  const updateBranch = useBranchStore((s) => s.updateBranch);
  const removeBranch = useBranchStore((s) => s.removeBranch);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');
  const [saveOk, setSaveOk] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    void hydrateBranches();
  }, [hydrateBranches]);

  useEffect(() => {
    if (!saveOk) return;
    const timer = window.setTimeout(() => setSaveOk(''), 8000);
    return () => window.clearTimeout(timer);
  }, [saveOk]);

  const locationSearchHint = useMemo(() => {
    const parts = [form.address, form.city].filter(Boolean);
    return parts.length ? parts.join(', ') : undefined;
  }, [form.address, form.city]);

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
    setUploadError('');
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
    setUploadError('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.name.trim()) return;

    const normalizedSlug = form.slug.trim().toLowerCase().replace(/\s+/g, '-');
    const slugTaken = branches.some(
      (b) => b.slug === normalizedSlug && b.id !== editingId,
    );
    if (slugTaken) {
      setSaveError('That slug is already used by another branch. Pick a unique URL slug.');
      return;
    }

    if (
      editingId &&
      branches.find((b) => b.id === editingId)?.slug !== normalizedSlug &&
      !confirm(
        'Changing the slug updates takeout QR links immediately. Printed dine-in table codes keep their old prefix — reprint table QRs from Tables & QR if needed. Continue?',
      )
    ) {
      return;
    }

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
          created.status === 'active'
            ? `"${created.name}" is live — 4 dine-in tables + takeout QR seeded. Assign barista/staff in Users, then open Tables & QR.`
            : `"${created.name}" saved as coming soon — tables are seeded but guests cannot order until status is Active.`,
        );
      }
      reset();
    } catch (err) {
      setSaveError(
        formatBranchCrudError(err, editingId ? 'update' : 'create'),
      );
    } finally {
      setSaving(false);
    }
  };

  const hasCoords = form.lat != null && form.lng != null;
  const heroPreview = branchHeroImageUrl({ slug: form.slug || 'branch', heroImage: form.heroImage });

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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Branch photo</label>
            <div className="mb-2 overflow-hidden rounded-xl border dash-border">
              <img
                src={heroPreview}
                alt={form.name || 'Branch preview'}
                className="h-36 w-full object-cover"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={form.heroImage}
                onChange={(e) => setForm((f) => ({ ...f, heroImage: e.target.value }))}
                placeholder="/path, https://…, or upload"
                className="flex-1 min-w-0 rounded-xl dash-input border px-3 py-2 text-sm"
              />
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border dash-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted hover:border-kado-red/40 shrink-0">
                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    setUploadError('');
                    setUploadingImage(true);
                    const prefix = `branches/${form.slug.trim() || 'new'}`;
                    void uploadCmsImageFile(file, prefix)
                      .then((url) => setForm((f) => ({ ...f, heroImage: url })))
                      .catch((err) =>
                        setUploadError(err instanceof Error ? err.message : 'Could not upload image.'),
                      )
                      .finally(() => setUploadingImage(false));
                  }}
                />
              </label>
            </div>
            {uploadError ? <p className="mt-1 text-xs text-red-600">{uploadError}</p> : null}
          </div>

          <div key={editingId ?? 'new'}>
            <BranchLocationPicker
              searchHint={locationSearchHint}
              value={{
                lat: form.lat,
                lng: form.lng,
                address: form.address,
                city: form.city,
              }}
              onChange={(next) =>
                setForm((f) => ({
                  ...f,
                  lat: next.lat,
                  lng: next.lng,
                  address: next.address ?? f.address,
                  city: next.city ?? f.city,
                }))
              }
            />
          </div>

          {hasCoords ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                Google Maps link
              </label>
              <input
                readOnly
                value={branchGoogleMapsUrl(form.lat!, form.lng!)}
                className="w-full rounded-xl dash-input border px-3 py-2 text-xs dash-muted select-all"
              />
            </div>
          ) : null}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="flex-1 rounded-xl bg-kado-red text-kado-cream py-3 text-sm font-bold uppercase tracking-wider hover:bg-kado-red-hover transition-colors disabled:opacity-60"
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
            const hero = branchHeroImageUrl(b);
            return (
              <div
                key={b.id}
                className="rounded-2xl dash-card border overflow-hidden"
              >
                <img src={hero} alt={b.name} className="h-40 w-full object-cover" />
                <div className="p-5 space-y-3">
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
                        disabled={deletingId === b.id || saving}
                        onClick={() => {
                          if (
                            !confirm(
                              `Remove branch "${b.name}"? Its tables will be removed. This may fail if orders still reference this branch.`,
                            )
                          ) {
                            return;
                          }
                          setSaveError('');
                          setDeletingId(b.id);
                          void removeBranch(b.id)
                            .then(() => {
                              setSaveOk(`"${b.name}" removed.`);
                            })
                            .catch((err) =>
                              setSaveError(formatBranchCrudError(err, 'delete')),
                            )
                            .finally(() => setDeletingId(null));
                        }}
                        className="p-2.5 rounded-xl border border-kado-red/20 text-kado-red hover:bg-kado-red/10 disabled:opacity-50"
                        aria-label="Delete"
                      >
                        {deletingId === b.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {branchHasCoords && (
                    <div className="space-y-2">
                      <div className="rounded-xl overflow-hidden border dash-border">
                        <iframe
                          title={`Map of ${b.name}`}
                          src={branchOsmEmbedUrl(b.lat!, b.lng!)}
                          className="w-full h-36"
                          style={{ border: 0 }}
                        />
                      </div>
                      <a
                        href={branchGoogleMapsUrl(b.lat!, b.lng!)}
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
