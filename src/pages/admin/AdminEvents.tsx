import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Event, EventRegistration } from '../../types/domain';
import { useEventStore } from '../../store/eventStore';
import { useBranchStore } from '../../store/branchStore';
import { readImageDataUrl } from '../../lib/readImageDataUrl';
import { eventDurationLabel, eventImages, signupClosesBeforeEventStart } from '../../lib/eventTiming';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { Plus, Pencil, Trash2, Star, ImageIcon, X, Users } from 'lucide-react';

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
  const addEvent = useEventStore((s) => s.addEvent);
  const updateEvent = useEventStore((s) => s.updateEvent);
  const removeEvent = useEventStore((s) => s.removeEvent);
  const branches = useBranchStore((s) => s.branches);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormData>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [imageError, setImageError] = useState('');
  const [registrationsEventId, setRegistrationsEventId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<EventRegistration[]>([]);
  const [registrationQuery, setRegistrationQuery] = useState('');
  const [registrationEventFilter, setRegistrationEventFilter] = useState<string>('all');
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});

  const loadCounts = () => {
    void orderingRepo.fetchEventRegistrationCounts().then(setRegCounts).catch(() => {});
  };

  const loadAllRegistrations = () => {
    void orderingRepo.fetchAllEventRegistrations().then(setAllRegistrations).catch(() => {});
  };

  useEffect(() => {
    loadCounts();
    loadAllRegistrations();
  }, [events.length]);

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
      signupDaysBefore: '1',
      maxSignups: evt.maxSignups != null ? String(evt.maxSignups) : '',
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
    const result = await readImageDataUrl(file);
    if ('dataUrl' in result) {
      setForm((f) => ({ ...f, images: [...f.images, result.dataUrl] }));
    } else {
      setImageError(result.error);
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

  const submit = (e: FormEvent) => {
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
      cta: form.ctaLabel.trim() ? { label: form.ctaLabel.trim(), href: '/events' } : undefined,
    };

    if (editingId) {
      updateEvent(editingId, payload);
    } else {
      addEvent(payload);
    }
    loadCounts();
    loadAllRegistrations();
    cancel();
  };

  const openRegistrations = async (eventId: string) => {
    setRegistrationsEventId(eventId);
    try {
      const rows = await orderingRepo.fetchEventRegistrations(eventId);
      setRegistrations(rows);
    } catch {
      setRegistrations([]);
    }
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

  return (
    <div className="dash-page max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading">Kado Events</h1>
          <p className="dash-muted text-sm mt-1">{events.length} event(s) — manage listings, images, and sign-ups.</p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="rounded-xl bg-kado-dark text-kado-cream px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> New event
        </button>
      </div>

      <ul className="space-y-3 mb-8">
        {events.map((evt) => {
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
                </div>
                <p className="text-xs dash-muted truncate">{evt.description}</p>
                <p className="text-[10px] dash-muted mt-1">
                  {new Date(evt.startsAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {evt.branchId ? ` · ${branches.find((b) => b.id === evt.branchId)?.name ?? evt.branchId}` : ' · All branches'}
                  {evt.signupEnabled && evt.signupClosesAt
                    ? ` · Sign-up until ${new Date(evt.signupClosesAt).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}`
                    : ''}
                </p>
                {eventDurationLabel(evt) && (
                  <p className="text-[10px] dash-muted mt-1">Duration: {eventDurationLabel(evt)}</p>
                )}
                {evt.signupEnabled && (
                  <button
                    type="button"
                    onClick={() => void openRegistrations(evt.id)}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline"
                  >
                    <Users className="w-3 h-3" /> {count} registration{count !== 1 ? 's' : ''} (view list)
                  </button>
                )}
              </div>
              <button type="button" onClick={() => startEdit(evt)} className="dash-muted hover:text-kado-red p-1">
                <Pencil className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => removeEvent(evt.id)} className="text-red-400 hover:text-red-600 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <section className="rounded-2xl dash-card border p-5 mb-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-display font-bold text-xl dash-heading">Registration forms</h2>
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
              <option key={evt.id} value={evt.id}>{evt.title}</option>
            ))}
          </select>
        </div>
        {filteredRegistrations.length === 0 ? (
          <p className="text-sm dash-muted">No registrations found for the selected filters.</p>
        ) : (
          <ul className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredRegistrations.map((r) => (
              <li key={r.id} className="rounded-xl border dash-border p-3 text-sm">
                <p className="font-bold dash-heading">{r.contactName}</p>
                <p className="dash-muted text-xs">{r.contactEmail}</p>
                <p className="dash-muted text-xs">{r.contactPhone}</p>
                <p className="text-[10px] dash-muted mt-1">
                  Event: {events.find((e) => e.id === r.eventId)?.title ?? r.eventId}
                </p>
                <p className="text-[10px] dash-muted mt-0.5">
                  Submitted: {new Date(r.createdAt).toLocaleString('en-PH')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

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
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
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
                className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {registrationsEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md dash-card rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg dash-heading">Registrations</h2>
              <button type="button" onClick={() => setRegistrationsEventId(null)} className="dash-muted hover:text-kado-dark">
                <X className="w-5 h-5" />
              </button>
            </div>
            {registrations.length === 0 ? (
              <p className="text-sm dash-muted">No registrations yet.</p>
            ) : (
              <ul className="space-y-3">
                {registrations.map((r) => (
                  <li key={r.id} className="rounded-xl border dash-border p-3 text-sm">
                    <p className="font-bold dash-heading">{r.contactName}</p>
                    <p className="dash-muted text-xs">{r.contactEmail}</p>
                    <p className="dash-muted text-xs">{r.contactPhone}</p>
                    <p className="text-[10px] dash-muted mt-1">
                      {new Date(r.createdAt).toLocaleString('en-PH')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
