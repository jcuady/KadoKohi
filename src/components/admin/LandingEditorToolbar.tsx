import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, RotateCcw, Save } from 'lucide-react';
import { useLandingContentStore } from '../../store/landingContentStore';

type Props = {
  onOpenFullPreview?: () => void;
};

export default function LandingEditorToolbar({ onOpenFullPreview }: Props) {
  const published = useLandingContentStore((s) => s.published);
  const draft = useLandingContentStore((s) => s.draft);
  const publishDraft = useLandingContentStore((s) => s.publishDraft);
  const publishError = useLandingContentStore((s) => s.publishError);
  const clearPublishError = useLandingContentStore((s) => s.clearPublishError);
  const discardDraft = useLandingContentStore((s) => s.discardDraft);
  const initDraft = useLandingContentStore((s) => s.initDraft);
  const [publishing, setPublishing] = useState(false);

  const hasChanges = useMemo(() => {
    if (!draft) return false;
    return JSON.stringify(draft) !== JSON.stringify(published);
  }, [draft, published]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-20 mb-2 rounded-2xl border dash-border dash-card p-4 shadow-sm"
    >
      <motion.div
        className="flex flex-col lg:flex-row lg:items-center gap-4"
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold dash-heading">Homepage CMS</p>
          <p className="text-xs dash-muted mt-0.5">
            Preview each section, click Edit for inline text/images or the options panel. Publish when ready.
          </p>
          {publishError ? (
            <p className="text-xs text-red-700 font-semibold mt-1" role="alert">
              Publish failed: {publishError}
            </p>
          ) : hasChanges ? (
            <p className="text-xs text-amber-700 font-semibold mt-1">Unpublished changes in draft</p>
          ) : (
            <p className="text-xs text-green-700/80 font-medium mt-1">Matches live site</p>
          )}
        </div>
        <motion.div className="flex flex-wrap gap-2" layout>
          {onOpenFullPreview ? (
            <a
              href="/?preview=1"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onOpenFullPreview}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider border dash-border hover:border-kado-red/40"
            >
              <ExternalLink className="w-4 h-4" />
              Full page
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => {
              clearPublishError();
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
            onClick={() => {
              clearPublishError();
              setPublishing(true);
              void publishDraft().finally(() => setPublishing(false));
            }}
            disabled={!draft || !hasChanges || publishing}
            className="inline-flex items-center gap-2 rounded-xl bg-kado-red text-kado-cream px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark disabled:opacity-40 transition-colors"
          >
            <Save className="w-4 h-4" />
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
