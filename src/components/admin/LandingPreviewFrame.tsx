import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import HomePageContent from '../home/HomePageContent';
import { useLandingContentStore, useLandingDraftContent } from '../../store/landingContentStore';
import { writeLandingPreviewDraft } from '../../lib/landingPreviewSession';

type Props = {
  active: boolean;
  /** Scroll the preview panel to this homepage section (matches active CMS tab). */
  scrollToSectionId?: string;
};

function PreviewBody() {
  const landing = useLandingDraftContent();
  return <HomePageContent landing={landing} previewBanner />;
}

export default function LandingPreviewFrame({ active, scrollToSectionId }: Props) {
  const scrollRootRef = useRef<HTMLDivElement>(null);

  const openPreviewTab = () => {
    const { draft, published } = useLandingContentStore.getState();
    writeLandingPreviewDraft(draft ?? published);
  };

  useEffect(() => {
    if (!active || !scrollToSectionId) return;
    const root = scrollRootRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(`#${CSS.escape(scrollToSectionId)}`);
    if (!target) return;
    const frame = window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active, scrollToSectionId]);

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
            <div className="px-4 py-2 border-b dash-border flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wider dash-muted">
                Live preview (draft) — jumps to the tab you are editing
              </p>
              <a
                href="/?preview=1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-kado-red hover:underline shrink-0"
                onClick={openPreviewTab}
              >
                Open full page
              </a>
            </div>
            <div
              ref={scrollRootRef}
              className="max-h-[min(72vh,900px)] overflow-y-auto overflow-x-hidden bg-kado-cream scroll-smooth"
            >
              <PreviewBody />
            </div>
          </motion.div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
