import { useMemo, useState, type FormEvent } from 'react';
import CmsTextField from './CmsTextField';
import { boothChipKey, type BoothPageCopy } from '../../lib/boothPageContent';
import type { BookingShowcaseMedia } from '../../types/domain';
import type { CmsText } from '../../lib/cmsTypography';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { uploadCmsImageFile } from '../../lib/cmsImageUpload';
import CmsReorderList from './CmsReorderList';

type MediaForm = {
  title: string;
  caption: string;
  image: string;
  visible: boolean;
};

const EMPTY_MEDIA_FORM: MediaForm = { title: '', caption: '', image: '', visible: true };

export type BoothPageContentFormProps = {
  media: BookingShowcaseMedia[];
  pageCopy: BoothPageCopy;
  updatePageCopy: (patch: Partial<BoothPageCopy>) => void;
  updateHowItWorksStep: (index: number, patch: Partial<{ title: CmsText; body: CmsText }>) => void;
  updateChip: (index: number, value: CmsText) => void;
  addMedia: (input: Omit<BookingShowcaseMedia, 'id'> & { id?: string }) => void;
  updateMedia: (id: string, patch: Partial<BookingShowcaseMedia>) => void;
  removeMedia: (id: string) => void;
  reorderMedia: (fromIndex: number, toIndex: number) => void;
};

export default function BoothPageContentForm({
  media,
  pageCopy,
  updatePageCopy,
  updateHowItWorksStep,
  updateChip,
  addMedia,
  updateMedia,
  removeMedia,
  reorderMedia,
}: BoothPageContentFormProps) {
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaForm, setMediaForm] = useState<MediaForm>(EMPTY_MEDIA_FORM);
  const [mediaUploadError, setMediaUploadError] = useState('');

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

  return (
    <>
      <section className="rounded-2xl dash-card border p-5 md:p-6 mb-8 space-y-4">
        <h2 className="font-display text-xl font-bold dash-heading">Hero</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <CmsTextField label="Eyebrow" value={pageCopy.heroEyebrow} onChange={(v) => updatePageCopy({ heroEyebrow: v })} />
          <CmsTextField label="CTA label" value={pageCopy.heroCtaLabel} onChange={(v) => updatePageCopy({ heroCtaLabel: v })} />
          <CmsTextField label="Title line 1" value={pageCopy.heroTitleLine1} onChange={(v) => updatePageCopy({ heroTitleLine1: v })} />
          <CmsTextField label="Title line 2" value={pageCopy.heroTitleLine2} onChange={(v) => updatePageCopy({ heroTitleLine2: v })} />
        </div>
        <CmsTextField label="Description" value={pageCopy.heroDescription} onChange={(v) => updatePageCopy({ heroDescription: v })} multiline />
        <div className="grid md:grid-cols-2 gap-4">
          {pageCopy.chips.map((chip, i) => (
            <div key={boothChipKey(chip, i)}>
              <CmsTextField label={`Chip ${i + 1}`} value={chip} onChange={(v) => updateChip(i, v)} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl dash-card border p-5 md:p-6 mb-8 space-y-4">
        <h2 className="font-display text-xl font-bold dash-heading">How it works</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <CmsTextField label="Eyebrow" value={pageCopy.howItWorksEyebrow} onChange={(v) => updatePageCopy({ howItWorksEyebrow: v })} />
          <CmsTextField label="Section title" value={pageCopy.howItWorksTitle} onChange={(v) => updatePageCopy({ howItWorksTitle: v })} />
        </div>
        {pageCopy.howItWorksSteps.map((step, i) => (
          <div key={boothChipKey(step.title, i)} className="rounded-xl border dash-border p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider dash-muted">Step {i + 1}</p>
            <CmsTextField label="Title" value={step.title} onChange={(v) => updateHowItWorksStep(i, { title: v })} />
            <CmsTextField label="Body" value={step.body} onChange={(v) => updateHowItWorksStep(i, { body: v })} multiline />
          </div>
        ))}
      </section>

      <section className="rounded-2xl dash-card border p-5 md:p-6 mb-8 space-y-4">
        <h2 className="font-display text-xl font-bold dash-heading">Proposal form</h2>
        <CmsTextField label="Form title" value={pageCopy.proposalTitle} onChange={(v) => updatePageCopy({ proposalTitle: v })} />
        <CmsTextField label="Form description" value={pageCopy.proposalDescription} onChange={(v) => updatePageCopy({ proposalDescription: v })} multiline />
        <CmsTextField label="Submit button" value={pageCopy.proposalCtaLabel} onChange={(v) => updatePageCopy({ proposalCtaLabel: v })} />
        <CmsTextField label="Footer note" value={pageCopy.proposalEmailNote} onChange={(v) => updatePageCopy({ proposalEmailNote: v })} multiline />
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
        <p className="text-xs dash-muted mb-3">
          Visible images (in this order) also fill the booking page hero collage. Drag to reorder.
        </p>
        <CmsReorderList<BookingShowcaseMedia>
          items={sortedMedia}
          onReorder={reorderMedia}
          keyFn={(item) => item.id}
          renderItem={(item) => (
            <div className="flex items-start gap-4">
              <img src={item.image} alt={item.title} className="w-28 h-20 rounded-xl object-cover border dash-border" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold dash-heading">{item.title}</p>
                {item.caption && <p className="text-sm dash-muted">{item.caption}</p>}
                {!item.visible ? (
                  <p className="text-[10px] font-bold uppercase tracking-wider dash-muted mt-1">Hidden</p>
                ) : null}
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => openEditMedia(item.id)} className="p-1.5 dash-muted hover:text-kado-red">
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => removeMedia(item.id)} className="p-1.5 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        />
      </section>

      {showMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitMedia} className="w-full max-w-lg dash-card rounded-[2rem] p-6 md:p-8 space-y-4 shadow-2xl">
            <h3 className="font-display text-xl font-bold dash-heading">{editingMediaId ? 'Edit Media' : 'New Media'}</h3>
            <Field label="Title" value={mediaForm.title} onChange={(v) => setMediaForm((s) => ({ ...s, title: v }))} required />
            <Field label="Caption" value={mediaForm.caption} onChange={(v) => setMediaForm((s) => ({ ...s, caption: v }))} />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Image URL</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={mediaForm.image}
                  required
                  onChange={(e) => setMediaForm((s) => ({ ...s, image: e.target.value }))}
                  placeholder="/path, https://…, or upload"
                  className="flex-1 min-w-0 rounded-xl dash-input border px-4 py-2.5 text-sm"
                />
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border dash-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted hover:border-kado-red/40 shrink-0">
                  <Upload className="w-4 h-4" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      setMediaUploadError('');
                      const key = editingMediaId ?? 'new';
                      void uploadCmsImageFile(file, `booth/showcase/${key}`)
                        .then((url) => setMediaForm((s) => ({ ...s, image: url })))
                        .catch((err) =>
                          setMediaUploadError(err instanceof Error ? err.message : 'Could not upload image.'),
                        );
                    }}
                  />
                </label>
              </div>
              {mediaUploadError ? <p className="mt-1 text-xs text-red-600">{mediaUploadError}</p> : null}
            </div>
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
    </>
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
