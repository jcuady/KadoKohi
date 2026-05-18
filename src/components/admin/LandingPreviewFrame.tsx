import { motion, AnimatePresence } from 'motion/react';
import HomePageContent from '../home/HomePageContent';
import { useLandingContentStore, useLandingDraftContent } from '../../store/landingContentStore';
import { writeLandingPreviewDraft } from '../../lib/landingPreviewSession';

type Props = {
  active: boolean;
};

function PreviewBody() {
  const landing = useLandingDraftContent();
  return <HomePageContent landing={landing} previewBanner />;
}

export default function LandingPreviewFrame({ active }: Props) {
  const openPreviewTab = () => {
    const { draft, published } = useLandingContentStore.getState();
    writeLandingPreviewDraft(draft ?? published);
  };

  return (
    <AnimatePresence>
      {active ? (
        <motion.section
          key="landing-preview"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 overflow-hidden"
        >
          <motion.div
            className="rounded-2xl border dash-border overflow-hidden bg-kado-dark/5"
            layout
          >
            <div className="px-4 py-2 border-b dash-border flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider dash-muted">Live preview (draft)</p>
              <a
                href="/?preview=1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-kado-red hover:underline"
                onClick={openPreviewTab}
              >
                Open in new tab
              </a>
            </div>
            <div className="max-h-[min(72vh,900px)] overflow-y-auto overflow-x-hidden bg-kado-cream">
              <PreviewBody />
            </div>
          </motion.div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
