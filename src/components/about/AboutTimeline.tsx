import { useRef } from 'react';
import { motion } from 'motion/react';
import { ABOUT_TIMELINE } from '@/content/aboutPage';
import { AboutSectionHeader } from './AboutUi';
import { usePinnedProgress } from './useAboutMotion';
import { cn } from '@/lib/utils';

export default function AboutTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  usePinnedProgress(sectionRef, progressRef);

  return (
    <section
      ref={sectionRef}
      className="border-b border-kado-dark/8 bg-white px-6 py-16 md:py-24"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 border-b border-kado-dark/10 pb-10 md:mb-14">
          <AboutSectionHeader
            align="left"
            eyebrow={ABOUT_TIMELINE.eyebrow}
            title={ABOUT_TIMELINE.title}
          />
        </div>

        <ol className="relative">
          <div className="absolute bottom-4 left-[1.125rem] top-4 w-px bg-kado-dark/10 md:left-[1.375rem]" aria-hidden />
          <div
            ref={progressRef}
            className="absolute left-[1.125rem] top-4 h-[calc(100%-2rem)] w-px origin-top bg-kado-red md:left-[1.375rem]"
            aria-hidden
          />

          {ABOUT_TIMELINE.milestones.map((item, i) => {
            const isHighlight = 'highlight' in item && item.highlight === true;
            return (
              <motion.li
                key={`${item.date}-${item.title}`}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-5%' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="relative flex gap-5 pb-10 last:pb-0 md:gap-8"
              >
                <div
                  className={cn(
                    'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 md:h-11 md:w-11',
                    isHighlight
                      ? 'border-kado-red bg-kado-red text-kado-cream shadow-md shadow-kado-red/25'
                      : 'border-kado-dark/15 bg-kado-cream text-kado-dark',
                  )}
                >
                  <span className="font-display text-[10px] font-bold md:text-xs">
                    {isHighlight ? '★' : '·'}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="kado-label mb-1 text-kado-red">{item.date}</p>
                  <h3 className="kado-h3 mb-2 text-kado-dark">{item.title}</h3>
                  <p className="kado-body-sm text-kado-dark/70">{item.body}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
