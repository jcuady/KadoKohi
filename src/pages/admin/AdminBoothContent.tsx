import { useMemo, useState, type FormEvent } from 'react';
import { useBoothShowcaseStore } from '../../store/boothShowcaseStore';
import { Plus, Pencil, Trash2 } from 'lucide-react';

type MediaForm = {
  title: string;
  caption: string;
  image: string;
  visible: boolean;
};

const EMPTY_MEDIA_FORM: MediaForm = { title: '', caption: '', image: '', visible: true };

export default function AdminBoothContent() {
  const media = useBoothShowcaseStore((s) => s.media);
  const pageCopy = useBoothShowcaseStore((s) => s.pageCopy);
  const updatePageCopy = useBoothShowcaseStore((s) => s.updatePageCopy);
  const updateHowItWorksStep = useBoothShowcaseStore((s) => s.updateHowItWorksStep);
  const updateChip = useBoothShowcaseStore((s) => s.updateChip);
  const addMedia = useBoothShowcaseStore((s) => s.addMedia);
  const updateMedia = useBoothShowcaseStore((s) => s.updateMedia);
  const removeMedia = useBoothShowcaseStore((s) => s.removeMedia);
  const saveToRemote = useBoothShowcaseStore((s) => s.saveToRemote);
  const saving = useBoothShowcaseStore((s) => s.saving);
  const saveError = useBoothShowcaseStore((s) => s.saveError);

  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaForm, setMediaForm] = useState<MediaForm>(EMPTY_MEDIA_FORM);
  const [savedMsg, setSavedMsg] = useState('');

  const sortedMedia = useMemo(() => [...media].sort((a, b) => a.order - b.order), [media]);

  const openNewMedia = () => {
    setEditingMediaId(null);
    setMediaForm(EMPTY_MEDIA_FORM);
    setShowMediaModal(true);
  };

  const openEditMedia = (id: string) => {
    const item = sortedMedia.find((m) => m.id === id);
    if (!item) return;
    setEditingMediaId(id);
    setMediaForm({
      title: item.title,
      caption: item.caption ?? '',
      image: item.image,
      visible: item.visible,
    });
    setShowMediaModal(true);
  };

  const submitMedia = (e: FormEvent) => {
    e.preventDefault();
    if (!mediaForm.title.trim() || !mediaForm.image.trim()) return;
    const payload = {
      title: mediaForm.title.trim(),
      caption: mediaForm.caption.trim() || undefined,
      image: mediaForm.image.trim(),
      visible: mediaForm.visible,
      tags: [],
    };
    if (editingMediaId) {
      updateMedia(editingMediaId, payload);
    } else {
      addMedia({ ...payload, order: sortedMedia.length });
    }
    setShowMediaModal(false);
  };

  const handlePublish = async () => {
    setSavedMsg('');
    try {
      await saveToRemote();
      setSavedMsg('Booth page published.');
    } catch {
      // saveError set in store
    }
  };

  return (
    <div className="max-w-6xl dash-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Booth Page Content</h1>
          <p className="dash-muted text-sm">
            Edit hero copy, how-it-works steps, proposal form text, and showcase gallery for /book/booth. Publish to save
            to the database.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={saving}
          className="shrink-0 rounded-xl bg-kado-red text-kado-cream px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark disabled:opacity-60"
        >
          {saving ? 'Publishing…' : 'Publish booth page'}
        </button>
      </div>

      {saveError ? <p className="mb-4 text-sm text-red-600 font-medium">{saveError}</p> : null}
      {savedMsg ? <p className="mb-4 text-sm text-emerald-700 font-medium">{savedMsg}</p> : null}

      <section className="rounded-2xl dash-card border p-5 md:p-6 mb-8 space-y-4">
        <h2 className="font-display text-xl font-bold dash-heading">Hero</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Eyebrow" value={pageCopy.heroEyebrow} onChange={(v) => updatePageCopy({ heroEyebrow: v })} />
          <Field label="CTA label" value={pageCopy.heroCtaLabel} onChange={(v) => updatePageCopy({ heroCtaLabel: v })} />
          <Field label="Title line 1" value={pageCopy.heroTitleLine1} onChange={(v) => updatePageCopy({ heroTitleLine1: v })} />
          <Field label="Title line 2" value={pageCopy.heroTitleLine2} onChange={(v) => updatePageCopy({ heroTitleLine2: v })} />
        </div>
        <TextArea label="Description" value={pageCopy.heroDescription} onChange={(v) => updatePageCopy({ heroDescription: v })} />
        <div className="grid md:grid-cols-2 gap-4">
          {pageCopy.chips.map((chip, i) => (
            <div key={i}>
              <Field label={`Chip ${i + 1}`} value={chip} onChange={(v) => updateChip(i, v)} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl dash-card border p-5 md:p-6 mb-8 space-y-4">
        <h2 className="font-display text-xl font-bold dash-heading">How it works</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Eyebrow" value={pageCopy.howItWorksEyebrow} onChange={(v) => updatePageCopy({ howItWorksEyebrow: v })} />
          <Field label="Section title" value={pageCopy.howItWorksTitle} onChange={(v) => updatePageCopy({ howItWorksTitle: v })} />
        </div>
        {pageCopy.howItWorksSteps.map((step, i) => (
          <div key={step.title} className="rounded-xl border dash-border p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider dash-muted">Step {i + 1}</p>
            <Field label="Title" value={step.title} onChange={(v) => updateHowItWorksStep(i, { title: v })} />
            <TextArea label="Body" value={step.body} onChange={(v) => updateHowItWorksStep(i, { body: v })} />
          </div>
        ))}
      </section>

      <section className="rounded-2xl dash-card border p-5 md:p-6 mb-8 space-y-4">
        <h2 className="font-display text-xl font-bold dash-heading">Proposal form</h2>
        <Field label="Form title" value={pageCopy.proposalTitle} onChange={(v) => updatePageCopy({ proposalTitle: v })} />
        <TextArea label="Form description" value={pageCopy.proposalDescription} onChange={(v) => updatePageCopy({ proposalDescription: v })} />
        <Field label="Submit button" value={pageCopy.proposalCtaLabel} onChange={(v) => updatePageCopy({ proposalCtaLabel: v })} />
        <TextArea label="Footer note" value={pageCopy.proposalEmailNote} onChange={(v) => updatePageCopy({ proposalEmailNote: v })} />
        <p className="text-xs dash-muted">Proposal emails use Contact Email from Settings.</p>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-bold dash-heading">Showcase Gallery</h2>
          <button
            type="button"
            onClick={openNewMedia}
            className="rounded-xl bg-kado-dark text-kado-cream px-4 py-2 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Media
          </button>
        </div>
        <div className="space-y-2.5">
          {sortedMedia.map((item) => (
            <article key={item.id} className="rounded-2xl dash-card border p-4 flex items-start gap-4">
              <img src={item.image} alt={item.title} className="w-28 h-20 rounded-xl object-cover border dash-border" />
              <div className="flex-1">
                <p className="font-display font-bold dash-heading">{item.title}</p>
                {item.caption && <p className="text-sm dash-muted">{item.caption}</p>}
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => openEditMedia(item.id)} className="p-1.5 dash-muted hover:text-kado-red">
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => removeMedia(item.id)} className="p-1.5 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitMedia} className="w-full max-w-lg dash-card rounded-[2rem] p-6 md:p-8 space-y-4 shadow-2xl">
            <h3 className="font-display text-xl font-bold dash-heading">{editingMediaId ? 'Edit Media' : 'New Media'}</h3>
            <Field label="Title" value={mediaForm.title} onChange={(v) => setMediaForm((s) => ({ ...s, title: v }))} required />
            <Field label="Caption" value={mediaForm.caption} onChange={(v) => setMediaForm((s) => ({ ...s, caption: v }))} />
            <Field label="Image URL" value={mediaForm.image} onChange={(v) => setMediaForm((s) => ({ ...s, image: v }))} required />
            <label className="text-xs dash-muted flex items-center gap-2">
              <input type="checkbox" checked={mediaForm.visible} onChange={(e) => setMediaForm((s) => ({ ...s, visible: e.target.checked }))} />
              Visible
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowMediaModal(false)} className="rounded-xl border dash-border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider">
                {editingMediaId ? 'Update' : 'Create'}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">{label}</label>
      <input
        type="text"
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm resize-none"
      />
    </div>
  );
}
