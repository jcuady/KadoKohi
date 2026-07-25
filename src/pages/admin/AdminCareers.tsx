import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Copy,
  Eye,
  EyeOff,
  Inbox,
  Pencil,
  Plus,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import CareerFormEditor from '../../components/careers/CareerFormEditor';
import CareerListingEditor, {
  EMPTY_CAREER_LISTING_FORM,
  listingToForm,
  type CareerListingFormState,
} from '../../components/admin/CareerListingEditor';
import CmsReorderList from '../../components/admin/CmsReorderList';
import { useCareersStore } from '../../store/careersStore';
import { useBranchStore } from '../../store/branchStore';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import {
  CAREER_CATEGORY_LABELS,
  CAREER_LISTING_TEMPLATES,
  type CareerListing,
  type CareerListingCategory,
} from '../../lib/careersPageContent';
import {
  filterCareerListings,
  DEFAULT_CAREER_CATALOG_FILTERS,
  type CareerCatalogFilters,
} from '../../lib/careerCatalogFilters';
import { newId } from '../../lib/id';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';

type AdminTab = 'jobs' | 'content' | 'form' | 'applications';
type ApplicationRow = Awaited<ReturnType<typeof orderingRepo.fetchCareerApplications>>[number];
type ApplicationStatus = ApplicationRow['status'];

const CAREER_APP_STATUSES: ApplicationStatus[] = ['new', 'reviewing', 'interview', 'hired', 'rejected'];
const CAREER_APP_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  interview: 'Interview',
  hired: 'Hired',
  rejected: 'Rejected',
};

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
  const reorderListing = useCareersStore((s) => s.reorderListing);
  const duplicateListing = useCareersStore((s) => s.duplicateListing);
  const saveToRemote = useCareersStore((s) => s.saveToRemote);
  const saving = useCareersStore((s) => s.saving);
  const saveError = useCareersStore((s) => s.saveError);
  const hydrated = useCareersStore((s) => s.hydrated);
  const hydrateFromRemote = useCareersStore((s) => s.hydrateFromRemote);
  const branches = useBranchStore((s) => s.branches);
  const hydrateBranches = useBranchStore((s) => s.hydrateFromRemote);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab: AdminTab =
    tabParam === 'jobs' || tabParam === 'content' || tabParam === 'form' || tabParam === 'applications'
      ? tabParam
      : 'jobs';
  const [tab, setTab] = useState<AdminTab>(initialTab);
  const [savedMsg, setSavedMsg] = useState('');
  const [benefitsText, setBenefitsText] = useState(pageCopy.heroBenefits.join('\n'));
  const [showEditor, setShowEditor] = useState(false);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [listingForm, setListingForm] = useState<CareerListingFormState>(EMPTY_CAREER_LISTING_FORM);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [adminQuery, setAdminQuery] = useState('');
  const [adminCategory, setAdminCategory] = useState<'all' | CareerListingCategory>('all');
  const [adminVisibility, setAdminVisibility] = useState<'all' | 'visible' | 'hidden'>('all');
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState('');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [appQuery, setAppQuery] = useState('');
  const [appListingFilter, setAppListingFilter] = useState('all');
  const [appStatusFilter, setAppStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);

  useEffect(() => {
    setBenefitsText(pageCopy.heroBenefits.join('\n'));
  }, [pageCopy.heroBenefits]);

  useEffect(() => {
    if (
      tabParam === 'jobs' ||
      tabParam === 'content' ||
      tabParam === 'form' ||
      tabParam === 'applications'
    ) {
      setTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    void hydrateFromRemote();
    void hydrateBranches();
  }, [hydrateFromRemote, hydrateBranches]);

  const selectTab = (next: AdminTab) => {
    setTab(next);
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next === 'jobs') p.delete('tab');
        else p.set('tab', next);
        return p;
      },
      { replace: true },
    );
  };

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
    if (tab === 'applications') void loadApplications();
  }, [tab]);

  const handlePublish = async () => {
    if (!hydrated) return;
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

  const sortedListings = useMemo(
    () => [...listings].sort((a, b) => a.sortOrder - b.sortOrder),
    [listings],
  );

  const adminFilters: CareerCatalogFilters = useMemo(
    () => ({
      ...DEFAULT_CAREER_CATALOG_FILTERS,
      query: adminQuery,
      category: adminCategory,
    }),
    [adminQuery, adminCategory],
  );

  const adminFiltered = useMemo(() => {
    let rows = filterCareerListings(listings, adminFilters, branches, { includeHidden: true });
    if (adminVisibility === 'visible') rows = rows.filter((l) => l.visible);
    if (adminVisibility === 'hidden') rows = rows.filter((l) => !l.visible);
    return rows;
  }, [listings, adminFilters, branches, adminVisibility]);

  const filteredApplications = useMemo(() => {
    const q = appQuery.trim().toLowerCase();
    return applications.filter((app) => {
      if (appListingFilter !== 'all' && app.listingId !== appListingFilter) return false;
      if (appStatusFilter !== 'all' && app.status !== appStatusFilter) return false;
      if (!q) return true;
      const hay = [app.contactName, app.contactEmail, app.contactPhone, app.listingTitle]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [applications, appQuery, appListingFilter, appStatusFilter]);

  const setApplicationStatus = async (id: string, status: ApplicationStatus) => {
    setStatusSavingId(id);
    setAppsError('');
    try {
      await orderingRepo.updateCareerApplicationStatus(id, status);
      setApplications((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      setAppsError(err instanceof Error ? err.message : 'Could not update application status.');
    } finally {
      setStatusSavingId(null);
    }
  };

  const openBlankListing = () => {
    setEditingListingId(null);
    setListingForm(EMPTY_CAREER_LISTING_FORM);
    setShowEditor(true);
    setShowAddMenu(false);
  };

  const openTemplateListing = (index: number) => {
    const template = CAREER_LISTING_TEMPLATES[index];
    if (!template) return;
    setEditingListingId(null);
    setListingForm({
      title: template.title,
      category: template.category,
      branchId: template.branchId ?? '',
      location: template.location ?? '',
      employmentType: template.employmentType ?? '',
      description: template.description,
      applyLabel: template.applyLabel,
      applyMode: template.applyMode,
      applyHref: template.applyHref ?? '',
      visible: template.visible ?? true,
    });
    setShowEditor(true);
    setShowAddMenu(false);
  };

  const openEditListing = (listing: CareerListing) => {
    setEditingListingId(listing.id);
    setListingForm(listingToForm(listing));
    setShowEditor(true);
  };

  const submitListing = (e: FormEvent) => {
    e.preventDefault();
    if (!listingForm.title.trim() || !listingForm.description.trim()) return;
    if (listingForm.applyMode === 'link' && !listingForm.applyHref.trim()) return;

    const payload = {
      title: listingForm.title.trim(),
      category: listingForm.category,
      branchId: listingForm.branchId.trim() || undefined,
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
    setShowEditor(false);
  };

  const previewListing: CareerListing | undefined = showEditor
    ? {
        id: editingListingId ?? 'preview',
        sortOrder: 0,
        postedAt: new Date().toISOString(),
        title: listingForm.title || 'Job title',
        category: listingForm.category,
        branchId: listingForm.branchId || undefined,
        location: listingForm.location || undefined,
        employmentType: listingForm.employmentType || undefined,
        description: listingForm.description || 'Description preview…',
        applyLabel: listingForm.applyLabel || 'Apply now',
        applyMode: listingForm.applyMode,
        applyHref: listingForm.applyHref || undefined,
        visible: listingForm.visible,
      }
    : undefined;

  return (
    <div className="max-w-6xl dash-page">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-2 font-display text-3xl font-bold dash-heading md:text-4xl">Careers</h1>
          <p className="text-sm dash-muted">Manage job listings, page copy, applications, and publish to /careers.</p>
        </div>
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={saving || !hydrated}
          className="shrink-0 rounded-xl bg-kado-red px-6 py-3 text-xs font-bold uppercase tracking-wider text-kado-cream hover:bg-kado-dark disabled:opacity-60"
        >
          {saving ? 'Publishing…' : !hydrated ? 'Loading…' : 'Publish careers page'}
        </button>
      </div>

      {!hydrated ? <p className="mb-4 text-sm dash-muted">Loading careers content…</p> : null}
      {saveError ? <p className="mb-4 text-sm font-medium text-red-600">{saveError}</p> : null}
      {savedMsg ? <p className="mb-4 text-sm font-medium text-emerald-700">{savedMsg}</p> : null}

      <Tabs value={tab} onValueChange={(v) => selectTab(v as AdminTab)} className="mb-6">
        <TabsList className="mb-6 flex w-full flex-wrap">
          <TabsTrigger value="jobs" className="flex-1 sm:flex-none">
            Jobs ({listings.length})
          </TabsTrigger>
          <TabsTrigger value="content" className="flex-1 sm:flex-none">
            Page content
          </TabsTrigger>
          <TabsTrigger value="form" className="flex-1 sm:flex-none">
            Application form
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex-1 sm:flex-none">
            Applications ({applications.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'jobs' ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAddMenu((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl bg-kado-dark px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-kado-cream"
              >
                <Plus className="h-4 w-4" /> Add job
                <ChevronDown className="h-4 w-4" />
              </button>
              {showAddMenu ? (
                <div className="absolute left-0 z-20 mt-2 min-w-[14rem] overflow-hidden rounded-xl border dash-border bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={openBlankListing}
                    className="block w-full px-4 py-3 text-left text-sm hover:bg-kado-cream"
                  >
                    Blank listing
                  </button>
                  {CAREER_LISTING_TEMPLATES.map((t, i) => (
                    <button
                      key={t.title}
                      type="button"
                      onClick={() => openTemplateListing(i)}
                      className="block w-full border-t dash-border px-4 py-3 text-left text-sm hover:bg-kado-cream"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={adminQuery}
                onChange={(e) => setAdminQuery(e.target.value)}
                placeholder="Search listings…"
                className="min-w-[10rem] rounded-xl border dash-input px-3 py-2 text-sm"
              />
              <select
                value={adminCategory}
                onChange={(e) => setAdminCategory(e.target.value as typeof adminCategory)}
                className="rounded-xl border dash-input px-3 py-2 text-xs font-bold uppercase tracking-wider"
              >
                <option value="all">All categories</option>
                {(Object.keys(CAREER_CATEGORY_LABELS) as CareerListingCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {CAREER_CATEGORY_LABELS[key]}
                  </option>
                ))}
              </select>
              <select
                value={adminVisibility}
                onChange={(e) => setAdminVisibility(e.target.value as typeof adminVisibility)}
                className="rounded-xl border dash-input px-3 py-2 text-xs font-bold uppercase tracking-wider"
              >
                <option value="all">All visibility</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>

          <p className="text-xs dash-muted">
            Showing {adminFiltered.length} of {listings.length} · drag to reorder (publish to save order)
          </p>

          {showEditor ? (
            <div className="rounded-2xl border dash-border dash-card p-5 md:p-6">
              <CareerListingEditor
                form={listingForm}
                onChange={setListingForm}
                onSubmit={submitListing}
                onCancel={() => setShowEditor(false)}
                editing={Boolean(editingListingId)}
                previewListing={previewListing}
              />
            </div>
          ) : null}

          <CmsReorderList<CareerListing>
            items={adminFiltered}
            onReorder={(from, to) => {
              const fromId = adminFiltered[from]?.id;
              const toId = adminFiltered[to]?.id;
              if (!fromId || !toId) return;
              const fromIndex = sortedListings.findIndex((l) => l.id === fromId);
              const toIndex = sortedListings.findIndex((l) => l.id === toId);
              if (fromIndex >= 0 && toIndex >= 0) reorderListing(fromIndex, toIndex);
            }}
            keyFn={(item) => item.id}
            renderItem={(listing) => (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="font-display font-bold dash-heading">{listing.title}</p>
                    <span className="rounded-full bg-kado-red/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-kado-red">
                      {CAREER_CATEGORY_LABELS[listing.category]}
                    </span>
                    {listing.visible ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                        <Eye className="h-3.5 w-3.5" /> Visible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs dash-muted">
                        <EyeOff className="h-3.5 w-3.5" /> Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-sm dash-muted line-clamp-2">{listing.description}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => openEditListing(listing)} className="p-1.5 dash-muted hover:text-kado-red">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => duplicateListing(listing.id)} className="p-1.5 dash-muted hover:text-kado-red">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateListing(listing.id, { visible: !listing.visible })}
                    className="p-1.5 dash-muted hover:text-kado-red"
                  >
                    {listing.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => removeListing(listing.id)} className="p-1.5 text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          />
        </section>
      ) : null}

      {tab === 'content' ? (
        <div className="space-y-8">
          <section className="space-y-4 rounded-2xl border dash-card p-5 md:p-6">
            <h2 className="font-display text-xl font-bold dash-heading">Hero</h2>
            <Field label="Eyebrow" value={pageCopy.heroEyebrow} onChange={(v) => updatePageCopy({ heroEyebrow: v })} />
            <Field label="Title" value={pageCopy.heroTitle} onChange={(v) => updatePageCopy({ heroTitle: v })} />
            <Field label="Description" value={pageCopy.heroDescription} onChange={(v) => updatePageCopy({ heroDescription: v })} multiline />
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">Benefits (one per line)</label>
              <textarea
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                rows={4}
                className="min-h-[88px] w-full rounded-xl border dash-input px-4 py-2.5 text-sm"
              />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border dash-card p-5 md:p-6">
            <h2 className="font-display text-xl font-bold dash-heading">Why join us</h2>
            <Field label="Title" value={pageCopy.whyJoinTitle} onChange={(v) => updatePageCopy({ whyJoinTitle: v })} />
            <Field label="Body" value={pageCopy.whyJoinBody} onChange={(v) => updatePageCopy({ whyJoinBody: v })} multiline />
          </section>

          <section className="space-y-4 rounded-2xl border dash-card p-5 md:p-6">
            <h2 className="font-display text-xl font-bold dash-heading">Empty state</h2>
            <Field label="No results message" value={pageCopy.emptyMessage} onChange={(v) => updatePageCopy({ emptyMessage: v })} multiline />
          </section>
        </div>
      ) : null}

      {tab === 'form' ? (
        <section className="space-y-4 rounded-2xl border dash-card p-5 md:p-6">
          <h2 className="font-display text-xl font-bold dash-heading">Application form</h2>
          <p className="text-sm dash-muted">Shared by all listings with in-page apply mode.</p>
          <Field label="Modal title" value={applicationForm.title} onChange={(v) => updateApplicationForm({ title: v })} />
          <Field label="Intro" value={applicationForm.intro} onChange={(v) => updateApplicationForm({ intro: v })} multiline />
          <Field label="Success title" value={applicationForm.successTitle} onChange={(v) => updateApplicationForm({ successTitle: v })} />
          <Field label="Success message" value={applicationForm.successMessage} onChange={(v) => updateApplicationForm({ successMessage: v })} multiline />
          <CareerFormEditor fields={applicationForm.fields} onChange={setApplicationFormFields} />
        </section>
      ) : null}

      {tab === 'applications' ? (
        <section className="rounded-2xl border dash-card p-5 md:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="inline-flex items-center gap-2 font-display text-xl font-bold dash-heading">
              <Inbox className="h-5 w-5" /> Applications
            </h2>
            <button
              type="button"
              onClick={() => void loadApplications()}
              disabled={appsLoading}
              className="rounded-lg border dash-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider dash-muted disabled:opacity-60"
            >
              {appsLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <input
              type="search"
              value={appQuery}
              onChange={(e) => setAppQuery(e.target.value)}
              placeholder="Search applicants…"
              className="min-w-[12rem] flex-1 rounded-xl border dash-input px-3 py-2 text-sm"
            />
            <select
              value={appListingFilter}
              onChange={(e) => setAppListingFilter(e.target.value)}
              className="rounded-xl border dash-input px-3 py-2 text-xs font-bold uppercase tracking-wider"
            >
              <option value="all">All listings</option>
              {sortedListings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
            <select
              value={appStatusFilter}
              onChange={(e) => setAppStatusFilter(e.target.value as ApplicationStatus | 'all')}
              className="rounded-xl border dash-input px-3 py-2 text-xs font-bold uppercase tracking-wider"
            >
              <option value="all">All statuses</option>
              {CAREER_APP_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {CAREER_APP_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <p className="mb-3 text-xs dash-muted">{filteredApplications.length} application(s)</p>
          {appsError ? <p className="mb-3 text-sm text-red-600">{appsError}</p> : null}

          {filteredApplications.length === 0 && !appsLoading ? (
            <p className="text-sm dash-muted">No applications match your filters.</p>
          ) : (
            <div className="space-y-2">
              {filteredApplications.map((app) => (
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
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-xs dash-muted">{app.contactEmail}</p>
                        <select
                          value={app.status}
                          disabled={statusSavingId === app.id}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            void setApplicationStatus(app.id, e.target.value as ApplicationStatus);
                          }}
                          className="rounded-lg border dash-input px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                          aria-label={`Status for ${app.contactName}`}
                        >
                          {CAREER_APP_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {CAREER_APP_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </button>
                  {expandedAppId === app.id ? (
                    <div className="mt-3 space-y-1 border-t dash-border pt-3 text-sm dash-muted">
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
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[88px] w-full rounded-xl border dash-input px-4 py-2.5 text-sm"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border dash-input px-4 py-2.5 text-sm"
        />
      )}
    </div>
  );
}
