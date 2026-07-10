import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Event, EventRegistration } from '../../types/domain';
import { useEventStore } from '../../store/eventStore';
import { useBranchStore } from '../../store/branchStore';
import { uploadCmsImageFile } from '../../lib/cmsImageUpload';
import { newId } from '../../lib/id';
import {
  eventDurationLabel,
  eventImages,
  eventMatchesBranchFilter,
  signupClosesBeforeEventStart,
  signupDaysBeforeFromCloses,
} from '../../lib/eventTiming';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { useEventFormStore } from '../../store/eventFormStore';
import EventFormBuilder from '../../components/admin/EventFormBuilder';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Plus, Pencil, Trash2, Star, ImageIcon, X, Users, FileText, CalendarDays } from 'lucide-react';

type EventsTab = 'events' | 'forms' | 'submissions';

type EventFormData = {
  title: string;
  description: string;
  branchId: string;
  startsAt: string;
  endsAt: string;
  visible: boolean;
  highlight: boolean;
  ctaLabel: string;
  images: string[];
  signupEnabled: boolean;
  signupOpensAt: string;
  signupClosesAt: string;
  signupDaysBefore: string;
  maxSignups: string;
  signupFormId: string;
};

const emptyForm: EventFormData = {
  title: '',
  description: '',
  branchId: '',
  startsAt: '',
  endsAt: '',
  visible: true,
  highlight: false,
  ctaLabel: 'Sign up',
  images: [],
  signupEnabled: true,
  signupOpensAt: '',
  signupClosesAt: '',
  signupDaysBefore: '1',
  maxSignups: '',
  signupFormId: '',
};

function toLocalDatetime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminEvents() {
  const events = useEventStore((s) => s.events);
  const hydrated = useEventStore((s) => s.hydrated);
  const hydrateEvents = useEventStore((s) => s.hydrateFromRemote);
  const addEvent = useEventStore((s) => s.addEvent);
  const updateEvent = useEventStore((s) => s.updateEvent);
  const removeEvent = useEventStore((s) => s.removeEvent);
  const branches = useBranchStore((s) => s.branches);
  const hydrateBranches = useBranchStore((s) => s.hydrateFromRemote);
  const eventBranches = useMemo(
    () => [...branches].sort((a, b) => a.name.localeCompare(b.name)),
    [branches],
  );
  const formTemplates = useEventFormStore((s) => s.forms);
  const formsHydrated = useEventFormStore((s) => s.hydrated);
  const hydrateFormTemplates = useEventFormStore((s) => s.hydrateFromRemote);

  const [tab, setTab] = useState<EventsTab>('events');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormData>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [imageError, setImageError] = useState('');
  const [allRegistrations, setAllRegistrations] = useState<EventRegistration[]>([]);
  const [registrationQuery, setRegistrationQuery] = useState('');
  const [registrationEventFilter, setRegistrationEventFilter] = useState<string>('all');
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [branchFilter, setBranchFilter] = useState<string>('all');

  const loadCounts = () => {
    void orderingRepo.fetchEventRegistrationCounts().then(setRegCounts).catch(() => {});
  };

  const loadAllRegistrations = () => {
    void orderingRepo.fetchAllEventRegistrations().then(setAllRegistrations).catch(() => {});
  };

  useEffect(() => {
    void hydrateEvents();
    void hydrateFormTemplates();
    void hydrateBranches();
    loadCounts();
    loadAllRegistrations();
  }, [hydrateEvents, hydrateFormTemplates, hydrateBranches]);

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageError('');
    setShowForm(true);
  };

  const startEdit = (evt: Event) => {
    setEditingId(evt.id);
    const imgs = eventImages(evt);
    setForm({
      title: evt.title,
      description: evt.description,
      branchId: evt.branchId ?? '',
      startsAt: toLocalDatetime(evt.startsAt),
      endsAt: toLocalDatetime(evt.endsAt),
      visible: evt.visible,
      highlight: evt.highlight ?? false,
      ctaLabel: evt.cta?.label ?? 'Sign up',
      images: imgs,
      signupEnabled: evt.signupEnabled ?? false,
      signupOpensAt: toLocalDatetime(evt.signupOpensAt),
      signupClosesAt: toLocalDatetime(evt.signupClosesAt),
      signupDaysBefore: String(signupDaysBeforeFromCloses(evt.startsAt, evt.signupClosesAt)),
      maxSignups: evt.maxSignups != null ? String(evt.maxSignups) : '',
      signupFormId: evt.signupFormId ?? '',
    });
    setImageError('');
    setShowForm(true);
  };

  const cancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setImageError('');
  };

  const applySignupDuration = (daysBefore: string, startsAt: string) => {
    if (!startsAt) return;
    const closes = signupClosesBeforeEventStart(startsAt, Number(daysBefore) || 1);
    if (closes) setForm((f) => ({ ...f, signupClosesAt: toLocalDatetime(closes) }));
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    if (form.images.length >= 8) {
      setImageError('Maximum 8 images per event.');
      return;
    }
    setImageError('');
    try {
      const eventKey = editingId ?? newId();
      const url = await uploadCmsImageFile(file, `events/${eventKey}/${form.images.length}`);
      setForm((f) => ({ ...f, images: [...f.images, url] }));
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Could not upload image.');
    }
  };

  const addImageUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (form.images.length >= 8) {
      setImageError('Maximum 8 images per event.');
      return;
    }
    setForm((f) => ({ ...f, images: [...f.images, trimmed] }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startsAt) return;
    if (form.images.length === 0) {
      setImageError('Add at least one event image.');
      return;
    }
    if (form.endsAt && new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()) {
      setImageError('End time must be after start time.');
      return;
    }
    if (form.signupEnabled && !form.signupClosesAt) {
      setImageError('Set a sign-up close date/time or use the duration preset.');
      return;
    }

    const payload: Omit<Event, 'id'> = {
      title: form.title.trim(),
      description: form.description.trim(),
      branchId: form.branchId || null,
      startsAt: form.startsAt,
      endsAt: form.endsAt || undefined,
      visible: form.visible,
      highlight: form.highlight,
      images: form.images,
      cover: form.images[0],
      signupEnabled: form.signupEnabled,
      signupOpensAt: form.signupOpensAt ? new Date(form.signupOpensAt).toISOString() : undefined,
      signupClosesAt: form.signupEnabled && form.signupClosesAt
        ? new Date(form.signupClosesAt).toISOString()
        : undefined,
      maxSignups: form.maxSignups.trim() ? Math.max(1, Number(form.maxSignups)) : undefined,
      signupFormId: form.signupFormId.trim() || null,
      cta: form.ctaLabel.trim() ? { label: form.ctaLabel.trim(), href: '/events' } : undefined,
    };

    setSaveError('');
    setSaving(true);
    try {
      if (editingId) {
        await updateEvent(editingId, payload);
      } else {
        await addEvent(payload);
      }
      loadCounts();
      loadAllRegistrations();
      cancel();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (evt: Event) => {
    if (!window.confirm(`Delete “${evt.title}”? This cannot be undone.`)) return;
    setSaveError('');
    try {
      await removeEvent(evt.id);
      if (editingId === evt.id) cancel();
      loadCounts();
      loadAllRegistrations();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not delete event.');
    }
  };

  const viewSubmissionsForEvent = (eventId: string) => {
    setRegistrationEventFilter(eventId);
    setTab('submissions');
  };

  const openFormTemplatesTab = () => {
    cancel();
    setTab('forms');
  };

  const filteredRegistrations = useMemo(() => {
    const q = registrationQuery.trim().toLowerCase();
    return allRegistrations.filter((r) => {
      if (registrationEventFilter !== 'all' && r.eventId !== registrationEventFilter) return false;
      if (!q) return true;
      return (
        r.contactName.toLowerCase().includes(q) ||
        r.contactEmail.toLowerCase().includes(q) ||
        r.contactPhone.toLowerCase().includes(q)
      );
    });
  }, [allRegistrations, registrationEventFilter, registrationQuery]);

  const branchName = (id?: string | null) =>
    branches.find((b) => b.id === id)?.name ?? 'All branches';

  const filteredEvents = useMemo(() => {
    if (branchFilter === 'all') return events;
    return events.filter((evt) => eventMatchesBranchFilter(evt, branchFilter));
  }, [events, branchFilter]);

  const branchFilterLabel =
    branchFilter === 'all' ? 'All branches' : branchName(branchFilter);

  return (
    <div className="dash-page max-w-5xl space-y-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="dash-muted text-xs font-bold uppercase tracking-[0.2em] mb-1">Admin · Operations</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading">Kado Events</h1>
          <p className="dash-muted text-sm mt-1 max-w-xl">
            Publish events on the public calendar, build sign-up forms, and review registrations.
          </p>
          {hydrated && formsHydrated ? (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Synced with Supabase · {events.length} event{events.length === 1 ? '' : 's'} · {formTemplates.length} form
              {formTemplates.length === 1 ? '' : 's'} · {allRegistrations.length} submission
              {allRegistrations.length === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
        {tab === 'events' ? (
          <button
            type="button"
            onClick={startAdd}
            className="rounded-xl bg-kado-dark text-kado-cream px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" /> New event
          </button>
        ) : null}
      </div>

      {saveError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {saveError}
        </p>
      ) : null}

      <Tabs value={tab} onValueChange={(v) => setTab(v as EventsTab)} className="space-y-6">
        <TabsList className="h-auto w-full flex-wrap gap-1 p-1">
          <TabsTrigger value="events" className="flex-1 sm:flex-none min-h-[40px]">
            Events ({events.length})
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex-1 sm:flex-none min-h-[40px]">
            Form templates ({formTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="submissions" className="flex-1 sm:flex-none min-h-[40px]">
            Submissions ({allRegistrations.length})
          </TabsTrigger>
        </TabsList>

        {tab === 'events' ? (
          <section className="space-y-3" aria-label="Event listings">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs dash-muted">
                Showing {filteredEvents.length} of {events.length} · {branchFilterLabel}
              </p>
              <div className="flex items-center gap-2 rounded-xl border dash-border dash-input px-3 py-2">
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="min-w-[9rem] bg-transparent text-[10px] font-bold uppercase tracking-wider outline-none"
                  aria-label="Filter events by branch"
                >
                  <option value="all">All branches</option>
                  {eventBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {b.status === 'coming_soon' ? ' (soon)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {filteredEvents.length === 0 ? (
              <div className="rounded-2xl dash-card-alt border dash-border p-10 text-center">
                <CalendarDays className="mx-auto mb-3 h-10 w-10 dash-muted" aria-hidden />
                <p className="font-display font-bold dash-heading">
                  {events.length === 0 ? 'No events yet' : `No events for ${branchFilterLabel}`}
                </p>
                <p className="dash-muted mt-1 text-sm">
                  {events.length === 0
                    ? 'Create your first listing for the public /events page.'
                    : 'Try another branch filter or create a new listing.'}
                </p>
                {events.length === 0 ? (
                <button
                  type="button"
                  onClick={startAdd}
                  className="mt-4 rounded-xl bg-kado-red px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-kado-cream hover:bg-kado-dark"
                >
                  New event
                </button>
                ) : null}
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredEvents.map((evt) => {
                  const thumb = eventImages(evt)[0];
                  const count = regCounts[evt.id] ?? 0;
                  return (
                    <li key={evt.id} className="rounded-2xl dash-card border p-5 flex items-start gap-4">
                      {thumb ? (
                        <img src={thumb} alt={evt.title} className="w-16 h-16 rounded-xl object-cover shrink-0 border dash-border" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl shrink-0 border dash-border flex items-center justify-center dash-card-alt">
                          <ImageIcon className="w-5 h-5 dash-muted" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-display font-bold dash-heading">{evt.title}</span>
                          {evt.highlight && <Star className="w-3.5 h-3.5 text-kado-red fill-kado-red" />}
                          {evt.signupEnabled && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-kado-red bg-kado-red/10 px-2 py-0.5 rounded-full">
                              Sign-ups
                            </span>
                          )}
                          {!evt.visible && (
                            <span className="text-[9px] font-bold uppercase tracking-widest dash-muted dash-card-alt px-2 py-0.5 rounded-full">
                              Hidden
                            </span>
                          )}
                          <Badge variant="outline" className="text-[9px]">
                            {evt.branchId ? branchName(evt.branchId) : 'All branches'}
                          </Badge>
                        </div>
                        <p className="text-xs dash-muted line-clamp-2">{evt.description}</p>
                        <p className="text-[10px] dash-muted mt-1">
                          {new Date(evt.startsAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {evt.signupEnabled && evt.signupClosesAt
                            ? ` · Sign-up until ${new Date(evt.signupClosesAt).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}`
                            : ''}
                        </p>
                        {eventDurationLabel(evt) && (
                          <p className="text-[10px] dash-muted mt-1">Duration: {eventDurationLabel(evt)}</p>
                        )}
                        {evt.signupEnabled && (
                          <>
                            {evt.signupFormId && (
                              <p className="text-[10px] dash-muted mt-1 inline-flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Form: {formTemplates.find((f) => f.id === evt.signupFormId)?.name ?? evt.signupFormId}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() => viewSubmissionsForEvent(evt.id)}
                              className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline"
                            >
                              <Users className="w-3 h-3" /> {count} registration{count !== 1 ? 's' : ''}
                            </button>
                          </>
                        )}
                      </div>
                      <button type="button" onClick={() => startEdit(evt)} className="dash-muted hover:text-kado-red p-1" aria-label={`Edit ${evt.title}`}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => void handleDelete(evt)} className="text-red-400 hover:text-red-600 p-1" aria-label={`Delete ${evt.title}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}

        {tab === 'forms' ? (
          <section aria-label="Registration form templates">
            <p className="text-sm dash-muted mb-4 max-w-2xl">
              Build reusable sign-up forms, then assign them when creating or editing an event. Every form must map fields
              to name, email, and phone.
            </p>
            <EventFormBuilder variant="page" />
          </section>
        ) : null}

        {tab === 'submissions' ? (
          <section className="rounded-2xl dash-card border p-5" aria-label="Registration submissions">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-xl dash-heading">Registration submissions</h2>
                <p className="text-xs dash-muted mt-1">All sign-ups across events, newest first.</p>
              </div>
              <span className="text-xs dash-muted font-bold uppercase tracking-wider">
                {filteredRegistrations.length} result{filteredRegistrations.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <input
                value={registrationQuery}
                onChange={(e) => setRegistrationQuery(e.target.value)}
                placeholder="Search name, email, phone"
                className="md:col-span-2 rounded-xl dash-input border px-4 py-2.5 text-sm"
              />
              <select
                value={registrationEventFilter}
                onChange={(e) => setRegistrationEventFilter(e.target.value)}
                className="rounded-xl dash-input border px-4 py-2.5 text-sm"
              >
                <option value="all">All events</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title}
                  </option>
                ))}
              </select>
            </div>
            {filteredRegistrations.length === 0 ? (
              <p className="text-sm dash-muted py-8 text-center">No registrations found for the selected filters.</p>
            ) : (
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead>
                    <tr className="border-b dash-border text-[10px] font-bold uppercase tracking-wider dash-muted">
                      <th className="py-2 pr-3">Guest</th>
                      <th className="py-2 pr-3">Contact</th>
                      <th className="py-2 pr-3">Event</th>
                      <th className="py-2">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dash-border">
                    {filteredRegistrations.map((r) => (
                      <tr key={r.id} className="align-top">
                        <td className="py-3 pr-3">
                          <p className="font-bold dash-heading">{r.contactName}</p>
                          {r.customAnswers && Object.keys(r.customAnswers).length > 0 ? (
                            <ul className="mt-2 text-[10px] dash-muted space-y-0.5 max-w-xs">
                              {Object.entries(r.customAnswers).map(([key, val]) => (
                                <li key={key}>
                                  <span className="font-semibold">{key}:</span> {String(val)}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </td>
                        <td className="py-3 pr-3 text-xs dash-muted">
                          <p>{r.contactEmail}</p>
                          <p className="mt-0.5">{r.contactPhone}</p>
                        </td>
                        <td className="py-3 pr-3 text-xs dash-muted">
                          {events.find((e) => e.id === r.eventId)?.title ?? r.eventId}
                        </td>
                        <td className="py-3 text-xs dash-muted whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}
      </Tabs>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={submit}
            className="w-full max-w-lg dash-card rounded-[2rem] p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-display font-bold text-xl dash-heading mb-4">
              {editingId ? 'Edit event' : 'New event'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                  Event images (up to 8)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    placeholder="Image URL"
                    className="flex-1 rounded-xl dash-input border px-4 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addImageUrl((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/*"
                  onChange={(e) => void handleImageUpload(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl dash-input border px-4 py-2.5 text-xs"
                />
                {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}
                {form.images.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {form.images.map((src, i) => (
                      <div key={`${i}-${src.slice(0, 24)}`} className="relative rounded-lg overflow-hidden border dash-border">
                        <img src={src} alt="" className="w-full h-20 object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                          aria-label="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Starts at</label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => {
                      const startsAt = e.target.value;
                      setForm((f) => {
                        const next = { ...f, startsAt };
                        if (f.signupEnabled && f.signupDaysBefore) {
                          const closes = signupClosesBeforeEventStart(startsAt, Number(f.signupDaysBefore) || 1);
                          return { ...next, signupClosesAt: closes ? toLocalDatetime(closes) : f.signupClosesAt };
                        }
                        return next;
                      });
                    }}
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Ends at</label>
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                  />
                </div>
              </div>
              {form.startsAt && form.endsAt && (
                <p className="text-[10px] dash-muted">
                  Duration preview:{' '}
                  {eventDurationLabel({
                    id: 'preview',
                    title: 'preview',
                    description: '',
                    startsAt: new Date(form.startsAt).toISOString(),
                    endsAt: new Date(form.endsAt).toISOString(),
                    visible: true,
                  })}
                </p>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Branch</label>
                <select
                  value={form.branchId}
                  onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                >
                  <option value="">All branches</option>
                  {eventBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {b.status === 'coming_soon' ? ' (soon)' : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] dash-muted leading-relaxed">
                  All branches = visible at every location; pick one branch for location-specific events.
                </p>
              </div>

              <div className="rounded-xl border dash-border p-4 space-y-3">
                <label className="flex items-center gap-2 text-sm dash-muted font-bold">
                  <input
                    type="checkbox"
                    checked={form.signupEnabled}
                    onChange={(e) => setForm((f) => ({ ...f, signupEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  Enable sign-ups (Name, +63 phone, email)
                </label>

                {form.signupEnabled && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                        Sign-up button label
                      </label>
                      <input
                        value={form.ctaLabel}
                        onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                        placeholder="Sign up"
                        className="w-full rounded-xl dash-input px-4 py-2.5 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                          Closes (days before event)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={365}
                          value={form.signupDaysBefore}
                          onChange={(e) => {
                            const days = e.target.value;
                            setForm((f) => {
                              const next = { ...f, signupDaysBefore: days };
                              if (f.startsAt) {
                                const closes = signupClosesBeforeEventStart(f.startsAt, Number(days) || 0);
                                return { ...next, signupClosesAt: closes ? toLocalDatetime(closes) : '' };
                              }
                              return next;
                            });
                          }}
                          className="w-full rounded-xl dash-input px-4 py-2.5 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => applySignupDuration(form.signupDaysBefore, form.startsAt)}
                          className="mt-1 text-[10px] font-bold text-kado-red hover:underline"
                        >
                          Apply duration preset
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                          Max sign-ups (optional)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={form.maxSignups}
                          onChange={(e) => setForm((f) => ({ ...f, maxSignups: e.target.value }))}
                          placeholder="Unlimited"
                          className="w-full rounded-xl dash-input px-4 py-2.5 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                          Sign-ups open
                        </label>
                        <input
                          type="datetime-local"
                          value={form.signupOpensAt}
                          onChange={(e) => setForm((f) => ({ ...f, signupOpensAt: e.target.value }))}
                          className="w-full rounded-xl dash-input px-4 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                          Sign-ups close
                        </label>
                        <input
                          type="datetime-local"
                          value={form.signupClosesAt}
                          onChange={(e) => setForm((f) => ({ ...f, signupClosesAt: e.target.value }))}
                          className="w-full rounded-xl dash-input px-4 py-2.5 text-sm"
                          required={form.signupEnabled}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                        Registration form
                      </label>
                      <select
                        value={form.signupFormId}
                        onChange={(e) => setForm((f) => ({ ...f, signupFormId: e.target.value }))}
                        className="w-full rounded-xl dash-input px-4 py-2.5 text-sm"
                      >
                        <option value="">Standard (name, phone, email)</option>
                        {formTemplates.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.fields.length} fields)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={openFormTemplatesTab}
                        className="mt-2 text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline"
                      >
                        Manage form templates →
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm dash-muted">
                  <input
                    type="checkbox"
                    checked={form.visible}
                    onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))}
                    className="rounded"
                  />
                  Visible
                </label>
                <label className="flex items-center gap-2 text-sm dash-muted">
                  <input
                    type="checkbox"
                    checked={form.highlight}
                    onChange={(e) => setForm((f) => ({ ...f, highlight: e.target.checked }))}
                    className="rounded"
                  />
                  Featured
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={cancel}
                className="rounded-xl dash-border border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted hover:bg-kado-cream transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
