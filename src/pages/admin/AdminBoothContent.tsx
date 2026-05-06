import { useMemo, useState, type FormEvent } from 'react';
import type { BookingEstimate } from '../../types/domain';
import { useBoothShowcaseStore } from '../../store/boothShowcaseStore';
import { useBookingEstimateStore } from '../../store/bookingEstimateStore';
import { useBranchStore } from '../../store/branchStore';
import { formatPhp } from '../../lib/money';
import { newId } from '../../lib/id';
import { Plus, Pencil, Trash2 } from 'lucide-react';

type MediaForm = {
  title: string;
  caption: string;
  image: string;
  visible: boolean;
};

type EstimateForm = {
  branchId: string;
  label: string;
  total: string;
  status: BookingEstimate['status'];
};

const EMPTY_MEDIA_FORM: MediaForm = { title: '', caption: '', image: '', visible: true };

export default function AdminBoothContent() {
  const media = useBoothShowcaseStore((s) => s.media);
  const addMedia = useBoothShowcaseStore((s) => s.addMedia);
  const updateMedia = useBoothShowcaseStore((s) => s.updateMedia);
  const removeMedia = useBoothShowcaseStore((s) => s.removeMedia);

  const estimates = useBookingEstimateStore((s) => s.estimates);
  const saveEstimate = useBookingEstimateStore((s) => s.saveEstimate);
  const removeEstimate = useBookingEstimateStore((s) => s.removeEstimate);
  const branches = useBranchStore((s) => s.branches);

  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaForm, setMediaForm] = useState<MediaForm>(EMPTY_MEDIA_FORM);

  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [estimateForm, setEstimateForm] = useState<EstimateForm>({
    branchId: branches[0]?.id ?? 'branch_marikina',
    label: '',
    total: '',
    status: 'sent',
  });

  const sortedMedia = useMemo(() => [...media].sort((a, b) => a.order - b.order), [media]);
  const recentEstimates = useMemo(
    () => [...estimates].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 12),
    [estimates],
  );

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

  const submitEstimate = (e: FormEvent) => {
    e.preventDefault();
    const total = Math.max(0, Number(estimateForm.total));
    if (!estimateForm.label.trim() || !Number.isFinite(total)) return;
    const now = new Date().toISOString();
    saveEstimate({
      id: newId(),
      shortCode: `EST-${Math.floor(1000 + Math.random() * 9000)}`,
      branchId: estimateForm.branchId,
      lineItems: [
        {
          id: newId(),
          sourceType: 'custom',
          labelSnapshot: estimateForm.label.trim(),
          qty: 1,
          unitPrice: total,
          lineTotal: total,
        },
      ],
      subtotal: total,
      tax: 0,
      total,
      status: estimateForm.status,
      assumptions: ['Admin-crafted sample'],
      createdAt: now,
      updatedAt: now,
    });
    setShowEstimateModal(false);
    setEstimateForm((s) => ({ ...s, label: '', total: '' }));
  };

  return (
    <div className="max-w-6xl dash-page">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Booth Page Content</h1>
      <p className="dash-muted mb-6">Customize gallery and estimate cards shown on the public booth booking page.</p>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-bold dash-heading">Showcase Gallery</h2>
          <button onClick={openNewMedia} className="rounded-xl bg-kado-dark text-kado-cream px-4 py-2 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1">
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
                <button onClick={() => openEditMedia(item.id)} className="p-1.5 dash-muted hover:text-kado-red"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => removeMedia(item.id)} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-bold dash-heading">Sample Estimate Cards</h2>
          <button onClick={() => setShowEstimateModal(true)} className="rounded-xl border dash-border px-4 py-2 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1">
            <Plus className="w-4 h-4" /> Estimate
          </button>
        </div>
        <div className="space-y-2.5">
          {recentEstimates.map((estimate) => (
            <article key={estimate.id} className="rounded-2xl dash-card border p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-display font-bold dash-heading">{estimate.shortCode}</p>
                <p className="text-xs dash-muted">{estimate.lineItems.map((line) => line.labelSnapshot).join(' · ')}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-kado-red">{formatPhp(estimate.total)}</span>
                <button onClick={() => removeEstimate(estimate.id)} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
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
              <button type="button" onClick={() => setShowMediaModal(false)} className="rounded-xl border dash-border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted">Cancel</button>
              <button type="submit" className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider">{editingMediaId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      {showEstimateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitEstimate} className="w-full max-w-lg dash-card rounded-[2rem] p-6 md:p-8 space-y-4 shadow-2xl">
            <h3 className="font-display text-xl font-bold dash-heading">New Sample Estimate</h3>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Branch</label>
              <select value={estimateForm.branchId} onChange={(e) => setEstimateForm((s) => ({ ...s, branchId: e.target.value }))} className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm">
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <Field label="Label" value={estimateForm.label} onChange={(v) => setEstimateForm((s) => ({ ...s, label: v }))} required />
            <Field label="Total (PHP)" type="number" value={estimateForm.total} onChange={(v) => setEstimateForm((s) => ({ ...s, total: v }))} required />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Status</label>
              <select value={estimateForm.status} onChange={(e) => setEstimateForm((s) => ({ ...s, status: e.target.value as BookingEstimate['status'] }))} className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm">
                <option value="draft">draft</option>
                <option value="sent">sent</option>
                <option value="accepted">accepted</option>
                <option value="rejected">rejected</option>
                <option value="expired">expired</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowEstimateModal(false)} className="rounded-xl border dash-border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted">Cancel</button>
              <button type="submit" className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider">Create</button>
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
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: 'text' | 'number';
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
      />
    </div>
  );
}
