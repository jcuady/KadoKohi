import { useState, type FormEvent } from 'react';
import { useSectionStore, type CustomSection, type SectionType } from '../../store/sectionStore';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';

const SECTION_TYPES: SectionType[] = ['hero', 'image-text', 'gallery', 'cta', 'stat'];

type FormData = {
  type: SectionType;
  title: string;
  body: string;
  image: string;
  ctaLabel: string;
  ctaHref: string;
  visible: boolean;
};

const emptyForm: FormData = { type: 'cta', title: '', body: '', image: '', ctaLabel: '', ctaHref: '', visible: true };

export default function AdminSections() {
  const sections = useSectionStore((s) => s.sections);
  const addSection = useSectionStore((s) => s.addSection);
  const updateSection = useSectionStore((s) => s.updateSection);
  const removeSection = useSectionStore((s) => s.removeSection);

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const startAdd = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const startEdit = (s: CustomSection) => {
    setEditingId(s.id);
    setForm({ type: s.type, title: s.title ?? '', body: s.body ?? '', image: s.image ?? '', ctaLabel: s.ctaLabel ?? '', ctaHref: s.ctaHref ?? '', visible: s.visible });
    setShowForm(true);
  };
  const cancel = () => { setShowForm(false); setEditingId(null); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      page: 'home' as const,
      type: form.type,
      title: form.title.trim() || undefined,
      body: form.body.trim() || undefined,
      image: form.image.trim() || undefined,
      ctaLabel: form.ctaLabel.trim() || undefined,
      ctaHref: form.ctaHref.trim() || undefined,
      visible: form.visible,
      order: editingId ? (sections.find((s) => s.id === editingId)?.order ?? sections.length) : sections.length,
    };
    if (editingId) updateSection(editingId, payload);
    else addSection(payload);
    cancel();
  };

  return (
    <div className="dash-page max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading">Custom Sections</h1>
          <p className="dash-muted text-sm mt-1">Compose dynamic sections for the home page without code changes.</p>
        </div>
        <button type="button" onClick={startAdd} className="rounded-xl bg-kado-dark text-kado-cream px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors flex items-center gap-1">
          <Plus className="w-4 h-4" /> New section
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-2xl dash-card border p-8 text-center text-sm dash-muted">No custom sections yet.</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((s) => (
            <li key={s.id} className="rounded-xl dash-card border px-5 py-4 flex items-center gap-3">
              <GripVertical className="w-4 h-4 dash-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm dash-heading">{s.title || `(${s.type})`}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest dash-muted dash-card-alt px-2 py-0.5 rounded-full">{s.type}</span>
                  {!s.visible && <span className="text-[9px] font-bold uppercase tracking-widest dash-muted">Hidden</span>}
                </div>
                {s.body && <p className="text-xs dash-muted truncate mt-0.5">{s.body}</p>}
              </div>
              <button type="button" onClick={() => startEdit(s)} className="dash-muted hover:text-kado-red p-1"><Pencil className="w-4 h-4" /></button>
              <button type="button" onClick={() => removeSection(s.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={submit} className="w-full max-w-lg dash-card rounded-[2rem] p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display font-bold text-xl dash-heading mb-4">{editingId ? 'Edit section' : 'New section'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as SectionType }))} className="w-full rounded-xl dash-input px-4 py-2.5 text-sm">
                  {SECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Title</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-xl dash-input px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Body</label>
                <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={3} className="w-full rounded-xl dash-input px-4 py-2.5 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Image URL</label>
                <input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} className="w-full rounded-xl dash-input px-4 py-2.5 text-sm" placeholder="/images/hero-coffee.png" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">CTA label</label>
                  <input value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} className="w-full rounded-xl dash-input px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">CTA link</label>
                  <input value={form.ctaHref} onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))} className="w-full rounded-xl dash-input px-4 py-2.5 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm dash-muted">
                <input type="checkbox" checked={form.visible} onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))} className="rounded" />
                Visible
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={cancel} className="rounded-xl dash-border border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted hover:bg-kado-cream transition-colors">Cancel</button>
              <button type="submit" className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
