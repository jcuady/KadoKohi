import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff, Inbox, Pencil, Plus, Trash2 } from 'lucide-react';
import CareerFormEditor from '../../components/careers/CareerFormEditor';
import { useCareersStore } from '../../store/careersStore';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import {
  CAREER_CATEGORY_LABELS,
  type CareerApplyMode,
  type CareerListing,
  type CareerListingCategory,
} from '../../lib/careersPageContent';
import { newId } from '../../lib/id';

type ListingForm = {
  title: string;
  category: CareerListingCategory;
  location: string;
  employmentType: string;
  description: string;
  applyLabel: string;
  applyMode: CareerApplyMode;
  applyHref: string;
  visible: boolean;
};

const EMPTY_LISTING: ListingForm = {
  title: '',
  category: 'careers',
  location: '',
  employmentType: '',
  description: '',
  applyLabel: 'Apply now',
  applyMode: 'form',
  applyHref: '',
  visible: true,
};

type ApplicationRow = Awaited<ReturnType<typeof orderingRepo.fetchCareerApplications>>[number];

export default function AdminCareers() {
  const pageCopy = useCareersStore((s) => s.pageCopy);
  const listings = useCareersStore((s) => s.listings);
  const applicationForm = useCareersStore((s) => s.applicationForm);
  const updatePageCopy = useCareersStore((s) => s.updatePageCopy);
  const updateApplicationForm = useCareersStore((s) => s.updateApplicationForm);
  const setApplicationFormFields = useCareersStore((s) => s.setApplicationFormFields);
  const addListing = useCareersStore((s) => s.addListing);
  const updateListing = useCareersStore((s) => s.updateListing);
  const removeListing = useCareersStore((s) => s.removeListing);
  const saveToRemote = useCareersStore((s) => s.saveToRemote);
  const saving = useCareersStore((s) => s.saving);
  const saveError = useCareersStore((s) => s.saveError);

  const [savedMsg, setSavedMsg] = useState('');
  const [showListingModal, setShowListingModal] = useState(false);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [listingForm, setListingForm] = useState<ListingForm>(EMPTY_LISTING);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState('');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [benefitsText, setBenefitsText] = useState(pageCopy.heroBenefits.join('\n'));

  useEffect(() => {
    setBenefitsText(pageCopy.heroBenefits.join('\n'));
  }, [pageCopy.heroBenefits]);

  const loadApplications = async () => {
    setAppsLoading(true);
    setAppsError('');
    try {
      const rows = await orderingRepo.fetchCareerApplications();
      setApplications(rows);
    } catch (err) {
      setAppsError(err instanceof Error ? err.message : 'Could not load applications.');
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  const handlePublish = async () => {
    setSavedMsg('');
    updatePageCopy({
      heroBenefits: benefitsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    });
    try {
      await saveToRemote();
      setSavedMsg('Careers page published.');
    } catch {
      // saveError set in store
    }
  };

  const openNewListing = () => {
    setEditingListingId(null);
    setListingForm(EMPTY_LISTING);
    setShowListingModal(true);
  };

  const openEditListing = (listing: CareerListing) => {
    setEditingListingId(listing.id);
    setListingForm({
      title: listing.title,
      category: listing.category,
      location: listing.location ?? '',
      employmentType: listing.employmentType ?? '',
      description: listing.description,
      applyLabel: listing.applyLabel,
      applyMode: listing.applyMode,
      applyHref: listing.applyHref ?? '',
      visible: listing.visible,
    });
    setShowListingModal(true);
  };

  const submitListing = (e: FormEvent) => {
    e.preventDefault();
    if (!listingForm.title.trim() || !listingForm.description.trim()) return;
    if (listingForm.applyMode === 'link' && !listingForm.applyHref.trim()) return;

    const payload = {
      title: listingForm.title.trim(),
      category: listingForm.category,
      location: listingForm.location.trim() || undefined,
      employmentType: listingForm.employmentType.trim() || undefined,
      description: listingForm.description.trim(),
      applyLabel: listingForm.applyLabel.trim() || 'Apply now',
      applyMode: listingForm.applyMode,
      applyHref: listingForm.applyMode === 'link' ? listingForm.applyHref.trim() : undefined,
      visible: listingForm.visible,
    };

    if (editingListingId) {
      updateListing(editingListingId, payload);
    } else {
      addListing({ ...payload, id: newId(), sortOrder: listings.length });
    }
    setShowListingModal(false);
  };

  const sortedListings = [...listings].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="max-w-6xl dash-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Careers Page</h1>
          <p className="dash-muted text-sm">
            Manage roles, application form fields, and review submissions from /careers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={saving}
          className="shrink-0 rounded-xl bg-kado-red text-kado-cream px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark disabled:opacity-60"
        >
          {saving ? 'Publishing…' : 'Publish careers page'}
        </button>
      </div>

      {saveError ? <p className="mb-4 text-sm text-red-600 font-medium">{saveError}</p> : null}
      {savedMsg ? <p className="mb-4 text-sm text-emerald-700 font-medium">{savedMsg}</p> : null}

      <section className="rounded-2xl dash-card border p-5 md:p-6 mb-8 space-y-4">
        <h2 className="font-display text-xl font-bold dash-heading">Hero</h2>
        <Field label="Eyebrow" value={pageCopy.heroEyebrow} onChange={(v) => updatePageCopy({ heroEyebrow: v })} />
        <Field label="Title" value={pageCopy.heroTitle} onChange={(v) => updatePageCopy({ heroTitle: v })} />
        <Field label="Description" value={pageCopy.heroDescription} onChange={(v) => updatePageCopy({ heroDescription: v })} multiline />
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Hero benefits (one per line)</label>
          <textarea
            value={benefitsText}
            onChange={(e) => setBenefitsText(e.target.value)}
            rows={4}
            className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm min-h-[88px]"
          />
        </div>
      </section>

      <section className="rounded-2xl dash-card border p-5 md:p-6 mb-8 space-y-4">
        <h2 className="font-display text-xl font-bold dash-heading">Why join us</h2>
        <Field label="Title" value={pageCopy.whyJoinTitle} onChange={(v) => updatePageCopy({ whyJoinTitle: v })} />
        <Field label="Body" value={pageCopy.whyJoinBody} onChange={(v) => updatePageCopy({ whyJoinBody: v })} multiline />
      </section>

      <section className="rounded-2xl dash-card border p-5 md:p-6 mb-8 space-y-4">
        <h2 className="font-display text-xl font-bold dash-heading">Section copy</h2>
        <Field label="Careers section title" value={pageCopy.careersSectionTitle} onChange={(v) => updatePageCopy({ careersSectionTitle: v })} />
        <Field label="Careers section intro" value={pageCopy.careersSectionIntro} onChange={(v) => updatePageCopy({ careersSectionIntro: v })} multiline />
        <Field label="Creators section title" value={pageCopy.creatorsSectionTitle} onChange={(v) => updatePageCopy({ creatorsSectionTitle: v })} />
        <Field label="Creators section intro" value={pageCopy.creatorsSectionIntro} onChange={(v) => updatePageCopy({ creatorsSectionIntro: v })} multiline />
        <Field label="Collaborations section title" value={pageCopy.collabsSectionTitle} onChange={(v) => updatePageCopy({ collabsSectionTitle: v })} />
        <Field label="Collaborations section intro" value={pageCopy.collabsSectionIntro} onChange={(v) => updatePageCopy({ collabsSectionIntro: v })} multiline />
        <Field label="Empty section message" value={pageCopy.emptyMessage} onChange={(v) => updatePageCopy({ emptyMessage: v })} multiline />
      </section>

      <section className="rounded-2xl dash-card border p-5 md:p-6 mb-8 space-y-4">
        <h2 className="font-display text-xl font-bold dash-heading">Application form</h2>
        <p className="text-sm dash-muted">Shared by all listings with &quot;In-page form&quot; apply mode. Guests and signed-in customers can submit.</p>
        <Field label="Modal title" value={applicationForm.title} onChange={(v) => updateApplicationForm({ title: v })} />
        <Field label="Intro" value={applicationForm.intro} onChange={(v) => updateApplicationForm({ intro: v })} multiline />
        <Field label="Success title" value={applicationForm.successTitle} onChange={(v) => updateApplicationForm({ successTitle: v })} />
        <Field label="Success message" value={applicationForm.successMessage} onChange={(v) => updateApplicationForm({ successMessage: v })} multiline />
        <CareerFormEditor fields={applicationForm.fields} onChange={setApplicationFormFields} />
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-bold dash-heading">Listings</h2>
          <button
            type="button"
            onClick={openNewListing}
            className="rounded-xl bg-kado-dark text-kado-cream px-4 py-2 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Listing
          </button>
        </div>
        <div className="space-y-2.5">
          {sortedListings.map((listing) => (
            <article key={listing.id} className="rounded-2xl dash-card border p-4 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-display font-bold dash-heading">{listing.title}</p>
                  <span className="rounded-full bg-kado-red/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-kado-red">
                    {CAREER_CATEGORY_LABELS[listing.category]}
                  </span>
                  <span className="rounded-full bg-kado-offwhite px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider dash-muted">
                    {listing.applyMode === 'form' ? 'In-page form' : 'External link'}
                  </span>
                  {!listing.visible ? (
                    <span className="inline-flex items-center gap-1 text-xs dash-muted">
                      <EyeOff className="w-3.5 h-3.5" /> Hidden
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                      <Eye className="w-3.5 h-3.5" /> Visible
                    </span>
                  )}
                </div>
                <p className="text-sm dash-muted line-clamp-2">{listing.description}</p>
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => openEditListing(listing)} className="p-1.5 dash-muted hover:text-kado-red">
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => removeListing(listing.id)} className="p-1.5 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl dash-card border p-5 md:p-6 mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-display text-xl font-bold dash-heading inline-flex items-center gap-2">
            <Inbox className="w-5 h-5" /> Applications
          </h2>
          <button
            type="button"
            onClick={() => void loadApplications()}
            disabled={appsLoading}
            className="rounded-lg border dash-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider dash-muted hover:text-kado-red disabled:opacity-60"
          >
            {appsLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        {appsError ? <p className="text-sm text-red-600 mb-3">{appsError}</p> : null}
        {applications.length === 0 && !appsLoading ? (
          <p className="text-sm dash-muted">No applications yet. They appear here after candidates submit the form on /careers.</p>
        ) : (
          <div className="space-y-2">
            {applications.map((app) => (
              <article key={app.id} className="rounded-xl border dash-border p-4">
                <button
                  type="button"
                  onClick={() => setExpandedAppId((id) => (id === app.id ? null : app.id))}
                  className="w-full text-left"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-display font-bold dash-heading">{app.contactName}</p>
                      <p className="text-sm dash-muted">
                        {app.listingTitle} · {new Date(app.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xs dash-muted">{app.contactEmail}</p>
                  </div>
                </button>
                {expandedAppId === app.id ? (
                  <div className="mt-3 pt-3 border-t dash-border text-sm space-y-1 dash-muted">
                    <p>
                      <strong>Phone:</strong> {app.contactPhone || '—'}
                    </p>
                    {Object.entries(app.answers).map(([key, value]) => {
                      const label = applicationForm.fields.find((f) => f.id === key)?.label ?? key;
                      return (
                        <p key={key}>
                          <strong>{label}:</strong> {String(value)}
                        </p>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      {showListingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitListing} className="w-full max-w-lg max-h-[90vh] overflow-y-auto dash-card rounded-[2rem] p-6 md:p-8 space-y-4 shadow-2xl">
            <h3 className="font-display text-xl font-bold dash-heading">{editingListingId ? 'Edit listing' : 'New listing'}</h3>
            <Field label="Title" value={listingForm.title} onChange={(v) => setListingForm((s) => ({ ...s, title: v }))} required />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Category</label>
              <select
                value={listingForm.category}
                onChange={(e) => setListingForm((s) => ({ ...s, category: e.target.value as CareerListingCategory }))}
                className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
              >
                {(Object.keys(CAREER_CATEGORY_LABELS) as CareerListingCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {CAREER_CATEGORY_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Location" value={listingForm.location} onChange={(v) => setListingForm((s) => ({ ...s, location: v }))} />
            <Field label="Employment type" value={listingForm.employmentType} onChange={(v) => setListingForm((s) => ({ ...s, employmentType: v }))} />
            <Field label="Description" value={listingForm.description} onChange={(v) => setListingForm((s) => ({ ...s, description: v }))} multiline required />
            <Field label="Apply button label" value={listingForm.applyLabel} onChange={(v) => setListingForm((s) => ({ ...s, applyLabel: v }))} />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Apply method</label>
              <select
                value={listingForm.applyMode}
                onChange={(e) => setListingForm((s) => ({ ...s, applyMode: e.target.value as CareerApplyMode }))}
                className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
              >
                <option value="form">In-page application form</option>
                <option value="link">External link (mailto or URL)</option>
              </select>
            </div>
            {listingForm.applyMode === 'link' ? (
              <Field label="Apply link (mailto: or URL)" value={listingForm.applyHref} onChange={(v) => setListingForm((s) => ({ ...s, applyHref: v }))} required />
            ) : null}
            <label className="text-xs dash-muted flex items-center gap-2">
              <input type="checkbox" checked={listingForm.visible} onChange={(e) => setListingForm((s) => ({ ...s, visible: e.target.checked }))} />
              Visible on public page
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowListingModal(false)} className="rounded-xl border dash-border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider">
                {editingListingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          required={required}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm min-h-[88px]"
        />
      ) : (
        <input
          type="text"
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
        />
      )}
    </div>
  );
}
