import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Branch, BranchStatus } from '../../types/domain';
import { useBranchStore } from '../../store/branchStore';
import { formatBranchCrudError } from '../../lib/supabase/repositories/ordering';
import { uploadCmsImageFile } from '../../lib/cmsImageUpload';
import { branchGoogleMapsUrl, branchHeroImageUrl } from '../../lib/branchMaps';
import BranchLocationPicker, {
  geocodeBranchStreetAddress,
} from '../../components/admin/BranchLocationPicker';
import {
  MapPin,
  Pencil,
  Trash2,
  Plus,
  ExternalLink,
  Loader2,
  Upload,
  X,
  Search,
  CheckCircle2,
} from 'lucide-react';

type BranchForm = {
  slug: string;
  name: string;
  address: string;
  city: string;
  status: BranchStatus;
  heroImage: string;
  lat?: number;
  lng?: number;
};

const emptyForm: BranchForm = {
  slug: '',
  name: '',
  address: '',
  city: '',
  status: 'active',
  heroImage: '',
  lat: undefined,
  lng: undefined,
};

function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Admin Branches — list-first CRUD + modal editor.
 * Store contracts unchanged: addBranch / updateBranch / removeBranch / hydrateFromRemote.
 */
export default function AdminBranches() {
  const branches = useBranchStore((s) => s.branches);
  const hydrateBranches = useBranchStore((s) => s.hydrateFromRemote);
  const addBranch = useBranchStore((s) => s.addBranch);
  const updateBranch = useBranchStore((s) => s.updateBranch);
  const removeBranch = useBranchStore((s) => s.removeBranch);

  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');
  const [saveOk, setSaveOk] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [listQuery, setListQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BranchStatus>('all');
  const [geocodingAddress, setGeocodingAddress] = useState(false);
  /** When true, editing slug manually — don't overwrite from display name. */
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    void hydrateBranches();
  }, [hydrateBranches]);

  useEffect(() => {
    if (!saveOk) return;
    const timer = window.setTimeout(() => setSaveOk(''), 8000);
    return () => window.clearTimeout(timer);
  }, [saveOk]);

  const sortedBranches = useMemo(
    () => [...branches].sort((a, b) => a.name.localeCompare(b.name)),
    [branches],
  );

  const filteredBranches = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    return sortedBranches.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${b.name} ${b.slug} ${b.address} ${b.city}`.toLowerCase();
      return hay.includes(q);
    });
  }, [sortedBranches, listQuery, statusFilter]);

  const locationSearchHint = useMemo(() => {
    const parts = [form.address, form.city].filter(Boolean);
    return parts.length ? parts.join(', ') : undefined;
  }, [form.address, form.city]);

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    setSlugTouched(false);
    setUploadError('');
    setSaveError('');
  };

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setUploadError('');
    setSaveError('');
    setShowForm(true);
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
      lat: b.lat,
      lng: b.lng,
    });
    setSlugTouched(true);
    setUploadError('');
    setSaveError('');
    setShowForm(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.name.trim()) return;

    const normalizedSlug = normalizeSlug(form.slug);
    const slugTaken = branches.some((b) => b.slug === normalizedSlug && b.id !== editingId);
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
      closeForm();
    } catch (err) {
      setSaveError(formatBranchCrudError(err, editingId ? 'update' : 'create'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (b: Branch) => {
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
        if (editingId === b.id) closeForm();
      })
      .catch((err) => setSaveError(formatBranchCrudError(err, 'delete')))
      .finally(() => setDeletingId(null));
  };

  const heroPreview = branchHeroImageUrl({ slug: form.slug || 'branch', heroImage: form.heroImage });

  const suggestSlugFromName = (name: string) => {
    const cleaned = name
      .toLowerCase()
      .replace(/kado\s*kohi/gi, '')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .trim();
    return normalizeSlug(cleaned);
  };

  const geocodeFromStreetField = async (address: string) => {
    const trimmed = address.trim();
    if (trimmed.length < 8) return;
    setGeocodingAddress(true);
    setSaveError('');
    try {
      const hit = await geocodeBranchStreetAddress(trimmed, form.city);
      if (!hit) {
        setSaveError(
          'Could not place that street address on the map. Try a shorter place name (e.g. Promenade Greenhills) or paste a Google Maps link in Find location.',
        );
        return;
      }
      setForm((f) => ({
        ...f,
        lat: hit.lat,
        lng: hit.lng,
        address: hit.address ?? trimmed,
        city: hit.city ?? f.city,
      }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Address lookup failed.');
    } finally {
      setGeocodingAddress(false);
    }
  };

  return (
    <div className="dash-page max-w-5xl space-y-6 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="kado-label mb-1 text-kado-red">Admin · Operations</p>
          <h1 className="font-display text-3xl font-bold dash-heading md:text-4xl">Branches</h1>
          <p className="mt-1 max-w-xl text-sm dash-muted">
            Manage café locations. Active branches appear in checkout, POS filters, and QR codes.
          </p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-kado-red px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-kado-cream transition-colors hover:bg-kado-red-hover"
        >
          <Plus className="h-4 w-4" />
          Add branch
        </button>
      </div>

      {saveOk ? (
        <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {saveOk}
        </p>
      ) : null}
      {saveError && !showForm ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {saveError}
        </p>
      ) : null}

      <div className="rounded-2xl border dash-border dash-card p-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 dash-muted" />
          <input
            type="search"
            value={listQuery}
            onChange={(e) => setListQuery(e.target.value)}
            placeholder="Filter by name, slug, city…"
            className="w-full rounded-xl border dash-input py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'All'],
              ['active', 'Active'],
              ['coming_soon', 'Coming soon'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                statusFilter === id
                  ? 'border-kado-red bg-kado-red text-white'
                  : 'dash-border dash-muted hover:bg-kado-cream'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto self-center text-[11px] dash-muted">
            {filteredBranches.length} of {branches.length}
          </span>
        </div>
      </div>

      {filteredBranches.length === 0 ? (
        <div className="rounded-2xl border dash-border dash-card px-5 py-12 text-center">
          <MapPin className="mx-auto mb-3 h-8 w-8 text-kado-red/40" />
          <p className="text-sm font-semibold dash-heading">
            {listQuery.trim() || statusFilter !== 'all' ? 'No branches match' : 'No branches yet'}
          </p>
          <p className="mt-1 text-xs dash-muted">
            {listQuery.trim() || statusFilter !== 'all'
              ? 'Try a different filter or clear search.'
              : 'Add your first location to unlock POS, QR, and checkout filters.'}
          </p>
          {!listQuery.trim() && statusFilter === 'all' ? (
            <button
              type="button"
              onClick={startAdd}
              className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-kado-red px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-kado-cream"
            >
              <Plus className="h-4 w-4" />
              Add branch
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filteredBranches.map((b) => {
            const hero = branchHeroImageUrl(b);
            const pinned = b.lat != null && b.lng != null;
            return (
              <li
                key={b.id}
                className="overflow-hidden rounded-2xl border dash-border dash-card transition-shadow hover:shadow-[0_12px_28px_rgba(25,25,25,0.06)]"
              >
                <div className="relative h-36 bg-kado-cream">
                  <img src={hero} alt="" className="h-full w-full object-cover" />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      b.status === 'active'
                        ? 'bg-kado-dark text-kado-cream'
                        : 'bg-kado-cream text-kado-red ring-1 ring-kado-red/30'
                    }`}
                  >
                    {b.status === 'active' ? 'Active' : 'Coming soon'}
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] dash-muted">{b.slug}</span>
                      {pinned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          <MapPin className="h-3 w-3" />
                          Pin set
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          No pin
                        </span>
                      )}
                    </div>
                    <h3 className="truncate font-display text-lg font-bold dash-heading">{b.name}</h3>
                    {(b.address || b.city) && (
                      <p className="mt-0.5 line-clamp-2 text-sm dash-muted">
                        {[b.address, b.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {pinned ? (
                      <a
                        href={branchGoogleMapsUrl(b.lat!, b.lng!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border dash-border px-3 text-xs font-semibold text-kado-red hover:bg-kado-cream"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Maps
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => startEdit(b)}
                      className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl border dash-border px-3 text-xs font-bold uppercase tracking-wider dash-heading hover:bg-kado-cream"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === b.id || saving}
                      onClick={() => handleDelete(b)}
                      className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-kado-red/25 px-3 text-kado-red hover:bg-kado-red/10 disabled:opacity-50"
                      aria-label={`Delete ${b.name}`}
                    >
                      {deletingId === b.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showForm ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-kado-dark/55 p-4 backdrop-blur-[3px] sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="branch-form-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving && !uploadingImage) closeForm();
          }}
        >
          <form
            onSubmit={submit}
            className="my-4 w-full max-w-lg overflow-hidden rounded-[1.5rem] border dash-border bg-kado-offwhite shadow-[0_30px_60px_rgba(25,25,25,0.18)] sm:my-8"
          >
            <div className="flex items-start justify-between gap-3 border-b dash-border px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-kado-red">
                  {editingId ? 'Edit' : 'New'} branch
                </p>
                <h2 id="branch-form-title" className="font-display text-xl font-bold dash-heading">
                  {editingId ? 'Update location' : 'Add a location'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving || uploadingImage}
                className="flex h-10 w-10 items-center justify-center rounded-full border dash-border dash-muted hover:bg-kado-cream disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[min(78dvh,40rem)] space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
              {saveError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {saveError}
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">
                    Display name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => ({
                        ...f,
                        name,
                        slug: !slugTouched && !editingId ? suggestSlugFromName(name) || f.slug : f.slug,
                      }));
                    }}
                    className="w-full rounded-xl border dash-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                    placeholder="Kado Kohi — Greenhills"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">
                    Slug (takeout QR)
                  </label>
                  <input
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((f) => ({ ...f, slug: e.target.value }));
                    }}
                    className="w-full rounded-xl border dash-input px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                    placeholder="greenhills"
                    required
                  />
                  <p className="mt-1 text-[10px] leading-snug dash-muted">
                    Not redundant — takeout links use <span className="font-mono">?b={form.slug || 'slug'}</span>.
                    Keep stable; changing it breaks printed takeout QRs until you reprint.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BranchStatus }))}
                    className="w-full rounded-xl border dash-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                  >
                    <option value="active">Active — accepts orders</option>
                    <option value="coming_soon">Coming soon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">
                  Branch photo
                </label>
                <div className="mb-2 overflow-hidden rounded-xl border dash-border">
                  <img src={heroPreview} alt="" className="h-32 w-full object-cover" />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={form.heroImage}
                    onChange={(e) => setForm((f) => ({ ...f, heroImage: e.target.value }))}
                    placeholder="/path, https://…, or upload"
                    className="min-w-0 flex-1 rounded-xl border dash-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                  />
                  <label className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border dash-border px-4 text-xs font-bold uppercase tracking-wider dash-muted hover:border-kado-red/40">
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
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
                        const prefix = `branches/${normalizeSlug(form.slug) || 'new'}`;
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">
                    Street address
                  </label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    onBlur={(e) => {
                      const next = e.target.value.trim();
                      // Geocode pasted / long addresses (Google-style lines).
                      if (next.length >= 12 && (next.includes(',') || next.split(/\s+/).length >= 4)) {
                        void geocodeFromStreetField(next);
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text').trim();
                      if (pasted.length >= 12) {
                        window.setTimeout(() => void geocodeFromStreetField(pasted), 0);
                      }
                    }}
                    className="w-full rounded-xl border dash-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                    placeholder="Paste address — pin updates on blur"
                  />
                  {geocodingAddress ? (
                    <p className="mt-1 flex items-center gap-1.5 text-[10px] dash-muted">
                      <Loader2 className="h-3 w-3 animate-spin" /> Finding on map…
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] dash-muted">
                      Paste a full address here or use Find location above. Both update the pin.
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">
                    City
                  </label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full rounded-xl border dash-input px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                    placeholder="Filled from map search"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t dash-border bg-white/60 px-5 py-4 sm:flex-row sm:px-6">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving || uploadingImage}
                className="min-h-[48px] rounded-xl border dash-border px-5 text-sm font-semibold dash-muted hover:bg-kado-cream disabled:opacity-50 sm:flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="inline-flex min-h-[48px] flex-[1.4] items-center justify-center gap-2 rounded-xl bg-kado-red px-5 text-sm font-bold uppercase tracking-wider text-kado-cream transition-colors hover:bg-kado-red-hover disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create branch'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
