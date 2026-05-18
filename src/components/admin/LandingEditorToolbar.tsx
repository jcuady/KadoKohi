import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Eye, RotateCcw, Save } from 'lucide-react';
import { useLandingContentStore } from '../../store/landingContentStore';

export default function LandingEditorToolbar() {
  const published = useLandingContentStore((s) => s.published);
  const draft = useLandingContentStore((s) => s.draft);
  const isPreviewMode = useLandingContentStore((s) => s.isPreviewMode);
  const publishDraft = useLandingContentStore((s) => s.publishDraft);
  const discardDraft = useLandingContentStore((s) => s.discardDraft);
  const setPreviewMode = useLandingContentStore((s) => s.setPreviewMode);
  const initDraft = useLandingContentStore((s) => s.initDraft);

  const hasChanges = useMemo(() => {
    if (!draft) return false;
    return JSON.stringify(draft) !== JSON.stringify(published);
  }, [draft, published]);

  const startPreview = () => {
    if (!draft) initDraft();
    setPreviewMode(true);
  };

  const stopPreview = () => setPreviewMode(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-20 mb-6 rounded-2xl border dash-border dash-card p-4 shadow-sm"
    >
      <motion.div
        className="flex flex-col lg:flex-row lg:items-center gap-4"
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold dash-heading">Homepage content</p>
          <p className="text-xs dash-muted mt-0.5">
            Layout is fixed. Edit text and images only, then preview (Zustand draft) or publish to go live.
          </p>
          {hasChanges ? (
            <p className="text-xs text-amber-700 font-semibold mt-1">Unpublished changes in draft</p>
          ) : (
            <p className="text-xs text-green-700/80 font-medium mt-1">Matches live site</p>
          )}
        </div>
        <motion.div className="flex flex-wrap gap-2" layout>
          <button
            type="button"
            onClick={() => {
              if (isPreviewMode) stopPreview();
              else startPreview();
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
              isPreviewMode
                ? 'bg-amber-500 border-amber-600 text-kado-dark'
                : 'dash-card-alt dash-border hover:border-kado-red/40'
            }`}
          >
            <Eye className="w-4 h-4" />
            {isPreviewMode ? 'Preview on' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={() => {
              discardDraft();
              initDraft();
            }}
            disabled={!hasChanges}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider border dash-border disabled:opacity-40 hover:border-kado-red/30"
          >
            <RotateCcw className="w-4 h-4" />
            Revert
          </button>
          <button
            type="button"
            onClick={() => publishDraft()}
            disabled={!draft || !hasChanges}
            className="inline-flex items-center gap-2 rounded-xl bg-kado-red text-kado-cream px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark disabled:opacity-40 transition-colors"
          >
            <Save className="w-4 h-4" />
            Publish
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
