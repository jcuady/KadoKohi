import { useState, type FormEvent } from 'react';
import type { Event } from '../../types/domain';
import { useEventStore } from '../../store/eventStore';
import { useBranchStore } from '../../store/branchStore';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';

type EventFormData = {
  title: string;
  description: string;
  branchId: string;
  startsAt: string;
  endsAt: string;
  visible: boolean;
  highlight: boolean;
  ctaLabel: string;
  ctaHref: string;
};

const emptyForm: EventFormData = {
  title: '',
  description: '',
  branchId: '',
  startsAt: '',
  endsAt: '',
  visible: true,
  highlight: false,
  ctaLabel: '',
  ctaHref: '',
};

export default function AdminEvents() {
  const events = useEventStore((s) => s.events);
  const addEvent = useEventStore((s) => s.addEvent);
  const updateEvent = useEventStore((s) => s.updateEvent);
  const removeEvent = useEventStore((s) => s.removeEvent);
  const branches = useBranchStore((s) => s.branches);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormData>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (evt: Event) => {
    setEditingId(evt.id);
    setForm({
      title: evt.title,
      description: evt.description,
      branchId: evt.branchId ?? '',
      startsAt: evt.startsAt.slice(0, 16),
      endsAt: evt.endsAt?.slice(0, 16) ?? '',
      visible: evt.visible,
      highlight: evt.highlight ?? false,
      ctaLabel: evt.cta?.label ?? '',
      ctaHref: evt.cta?.href ?? '',
    });
    setShowForm(true);
  };

  const cancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startsAt) return;

    const payload: Omit<Event, 'id'> = {
      title: form.title.trim(),
      description: form.description.trim(),
      branchId: form.branchId || null,
      startsAt: form.startsAt,
      endsAt: form.endsAt || undefined,
      visible: form.visible,
      highlight: form.highlight,
      cta: form.ctaLabel.trim() ? { label: form.ctaLabel.trim(), href: form.ctaHref.trim() || '#' } : undefined,
    };

    if (editingId) {
      updateEvent(editingId, payload);
    } else {
      addEvent(payload);
    }
    cancel();
  };

  return (
    <div className="dash-page max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading">Events</h1>
          <p className="dash-muted text-sm mt-1">{events.length} event(s) — manage what shows on the public site.</p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="rounded-xl bg-kado-dark text-kado-cream px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> New event
        </button>
      </div>

      {/* List */}
      <ul className="space-y-3 mb-8">
        {events.map((evt) => (
          <li key={evt.id} className="rounded-2xl dash-card border p-5 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display font-bold dash-heading">{evt.title}</span>
                {evt.highlight && <Star className="w-3.5 h-3.5 text-kado-red fill-kado-red" />}
                {!evt.visible && (
                  <span className="text-[9px] font-bold uppercase tracking-widest dash-muted dash-card-alt px-2 py-0.5 rounded-full">Hidden</span>
                )}
              </div>
              <p className="text-xs dash-muted truncate">{evt.description}</p>
              <p className="text-[10px] dash-muted mt-1">
                {new Date(evt.startsAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                {evt.branchId ? ` · ${branches.find((b) => b.id === evt.branchId)?.name ?? evt.branchId}` : ' · All branches'}
              </p>
            </div>
            <button type="button" onClick={() => startEdit(evt)} className="dash-muted hover:text-kado-red p-1">
              <Pencil className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => removeEvent(evt.id)} className="text-red-400 hover:text-red-600 p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>

      {/* Form modal */}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Starts at</label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
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
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Branch</label>
                <select
                  value={form.branchId}
                  onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                >
                  <option value="">All branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">CTA label</label>
                  <input
                    value={form.ctaLabel}
                    onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                    placeholder="e.g. RSVP Now"
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">CTA link</label>
                  <input
                    value={form.ctaHref}
                    onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))}
                    placeholder="/contact"
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                  />
                </div>
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
                  Featured / Highlight
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
    </div>
  );
}
