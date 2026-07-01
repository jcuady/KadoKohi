import { useEffect, useState } from 'react';
import { Upload, ExternalLink } from 'lucide-react';
import { usePastriesContentStore } from '../../store/pastriesContentStore';
import { uploadCmsImageFile } from '../../lib/cmsImageUpload';

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
      <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm min-h-[88px]"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
        />
      )}
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  prefix,
  onError,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix: string;
  onError: (msg: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">{label}</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
              void uploadCmsImageFile(file, prefix)
                .then(onChange)
                .catch((err) => onError(err instanceof Error ? err.message : 'Could not upload image.'));
            }}
          />
        </label>
      </div>
    </div>
  );
}

export default function AdminPastries() {
  const content = usePastriesContentStore((s) => s.content);
  const updateHero = usePastriesContentStore((s) => s.updateHero);
  const updatePoster = usePastriesContentStore((s) => s.updatePoster);
  const updateCta = usePastriesContentStore((s) => s.updateCta);
  const saveToRemote = usePastriesContentStore((s) => s.saveToRemote);
  const saving = usePastriesContentStore((s) => s.saving);
  const saveError = usePastriesContentStore((s) => s.saveError);
  const hydrated = usePastriesContentStore((s) => s.hydrated);
  const hydrateFromRemote = usePastriesContentStore((s) => s.hydrateFromRemote);

  const [savedMsg, setSavedMsg] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

  const handlePublish = async () => {
    if (!hydrated) return;
    setSavedMsg('');
    try {
      await saveToRemote();
      setSavedMsg('Pastries page published.');
    } catch {
      // saveError set in store
    }
  };

  return (
    <div className="max-w-6xl dash-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Pastries Page</h1>
          <p className="dash-muted text-sm">
            Edit hero copy and poster images for{' '}
            <a href="/pastries" target="_blank" rel="noreferrer" className="text-kado-red underline-offset-2 hover:underline inline-flex items-center gap-1">
              /pastries <ExternalLink className="w-3.5 h-3.5" />
            </a>
            . Product grid still comes from Menu admin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={saving || !hydrated}
          className="shrink-0 rounded-xl bg-kado-red text-kado-cream px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark disabled:opacity-60"
        >
          {saving ? 'Publishing…' : !hydrated ? 'Loading…' : 'Publish pastries page'}
        </button>
      </div>

      {!hydrated ? (
        <p className="mb-4 text-sm dash-muted">Loading pastries content from the database…</p>
      ) : null}
      {saveError ? <p className="mb-4 text-sm text-red-600 font-medium">{saveError}</p> : null}
      {savedMsg ? <p className="mb-4 text-sm text-emerald-700 font-medium">{savedMsg}</p> : null}
      {uploadError ? <p className="mb-4 text-sm text-red-600 font-medium">{uploadError}</p> : null}

      <section className="rounded-2xl dash-card border p-5 md:p-6 mb-8 space-y-4">
        <h2 className="font-display text-xl font-bold dash-heading">Hero</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Eyebrow" value={content.hero.eyebrow} onChange={(v) => updateHero({ eyebrow: v })} />
          <Field label="Headline top" value={content.hero.headlineTop} onChange={(v) => updateHero({ headlineTop: v })} />
          <Field label="Headline bottom" value={content.hero.headlineBottom} onChange={(v) => updateHero({ headlineBottom: v })} />
          <Field label="Badge" value={content.hero.badge} onChange={(v) => updateHero({ badge: v })} />
          <Field label="Badge note" value={content.hero.badgeNote} onChange={(v) => updateHero({ badgeNote: v })} />
        </div>
        <Field label="Subhead" value={content.hero.subhead} onChange={(v) => updateHero({ subhead: v })} multiline />
      </section>

      <section className="rounded-2xl dash-card border p-5 md:p-6 mb-8 space-y-4">
        <h2 className="font-display text-xl font-bold dash-heading">Poster images</h2>
        <ImageField
          label="Primary image"
          value={content.poster.primaryImage}
          onChange={(v) => updatePoster({ primaryImage: v })}
          prefix="pastries/poster/primary"
          onError={setUploadError}
        />
        <ImageField
          label="Secondary image"
          value={content.poster.secondaryImage}
          onChange={(v) => updatePoster({ secondaryImage: v })}
          prefix="pastries/poster/secondary"
          onError={setUploadError}
        />
      </section>

      <section className="rounded-2xl dash-card border p-5 md:p-6 mb-8 space-y-4">
        <h2 className="font-display text-xl font-bold dash-heading">Product grid intro</h2>
        <Field label="Section title" value={content.cta.title} onChange={(v) => updateCta({ title: v })} />
        <Field label="Body" value={content.cta.body} onChange={(v) => updateCta({ body: v })} multiline />
      </section>
    </div>
  );
}
