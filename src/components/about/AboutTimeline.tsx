import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ABOUT_TIMELINE } from '@/content/aboutPage';
import { ABOUT_EDITORIAL } from '@/content/aboutPage';
import { AboutSectionShell } from './AboutUi';
import { AboutEditorialGrid, EditorialHeadline } from './AboutEditorial';
import { usePinnedProgress } from './useAboutMotion';
import { cn } from '@/lib/utils';

export default function AboutTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const mobileRailRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  usePinnedProgress(sectionRef, progressRef);

  const onMobileScroll = () => {
    const rail = mobileRailRef.current;
    if (!rail) return;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>('[data-milestone]'));
    if (cards.length === 0) return;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;
    cards.forEach((card: HTMLElement, idx) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - cardCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = idx;
      }
    });
    setActiveIndex(closest);
  };

  return (
    <AboutSectionShell
      ref={sectionRef}
      className="bg-kado-cream"
      innerClassName="max-w-5xl"
      id="about-journey"
    >
      <AboutEditorialGrid>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 border-b border-kado-dark/10 pb-8 md:mb-12 md:pb-10"
        >
          <p className="kado-label mb-3 text-kado-red">{ABOUT_TIMELINE.eyebrow}</p>
          <EditorialHeadline as="h2" lines={ABOUT_EDITORIAL.journeyLines} size="section" />
        </motion.div>

        {/* Mobile — horizontal snap */}
        <div className="lg:hidden">
          <div
            ref={mobileRailRef}
            onScroll={onMobileScroll}
            className="about-scroll-rail -mx-1 px-1 pb-2"
            aria-label="Kado Kohi journey milestones"
          >
            {ABOUT_TIMELINE.milestones.map((item) => {
              const isHighlight = 'highlight' in item && item.highlight === true;
              return (
                <article
                  key={`${item.date}-mobile`}
                  data-milestone
                  className={cn(
                    'w-[min(86vw,19.5rem)] border p-5 sm:p-6',
                    isHighlight
                      ? 'border-kado-red bg-kado-red text-kado-cream'
                      : 'border-kado-dark/15 bg-white',
                  )}
                >
                  <p
                    className={cn(
                      'font-display text-3xl font-extrabold uppercase tracking-tight',
                      isHighlight ? 'text-kado-cream' : 'text-kado-red',
                    )}
                  >
                    {item.date}
                  </p>
                  <h3
                    className={cn(
                      'mt-2 mb-2 font-display text-base font-bold uppercase tracking-tight',
                      isHighlight ? 'text-kado-cream' : 'text-kado-dark',
                    )}
                  >
                    {item.title}
                  </h3>
                  <p className={cn('kado-body-sm', isHighlight ? 'text-kado-cream/85' : 'text-kado-dark/70')}>
                    {item.body}
                  </p>
                  {isHighlight ? (
                    <span className="kado-label mt-4 inline-flex border border-kado-cream/30 px-3 py-1 text-kado-cream/90">
                      Now open
                    </span>
                  ) : null}
                </article>
              );
            })}
          </div>
          <div className="mt-4 flex justify-center gap-2" aria-hidden>
            {ABOUT_TIMELINE.milestones.map((item, i) => (
              <span
                key={`dot-${item.date}`}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === activeIndex ? 'w-6 bg-kado-red' : 'w-1.5 bg-kado-dark/20',
                )}
              />
            ))}
          </div>
        </div>

        {/* Desktop — alternating editorial timeline */}
        <ol className="relative hidden lg:block">
          <div
            className="absolute bottom-6 left-1/2 top-4 w-px -translate-x-1/2 bg-kado-dark/12"
            aria-hidden
          />
          <div
            ref={progressRef}
            className="absolute left-1/2 top-4 h-[calc(100%-3rem)] w-px origin-top -translate-x-1/2 bg-kado-red"
            aria-hidden
          />

          {ABOUT_TIMELINE.milestones.map((item, i) => {
            const isHighlight = 'highlight' in item && item.highlight === true;
            const isLeft = i % 2 === 0;

            return (
              <motion.li
                key={`${item.date}-${item.title}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-8%' }}
                transition={{ duration: 0.55, delay: i * 0.05 }}
                className="relative mb-12 grid grid-cols-[1fr_auto_1fr] items-start gap-8 last:mb-0"
              >
                <div className={cn('pt-1', isLeft ? 'text-right' : 'order-3 text-left')}>
                  <article
                    className={cn(
                      'inline-block w-full max-w-md border p-6 text-left',
                      isHighlight
                        ? 'border-kado-red bg-kado-red text-kado-cream'
                        : 'border-kado-dark/12 bg-white',
                      isLeft ? 'ml-auto' : 'mr-auto',
                    )}
                  >
                    <p
                      className={cn(
                        'font-display text-2xl font-extrabold uppercase tracking-tight',
                        isHighlight ? 'text-kado-cream' : 'text-kado-red',
                      )}
                    >
                      {item.date}
                    </p>
                    <h3
                      className={cn(
                        'mt-2 mb-2 font-display text-sm font-bold uppercase tracking-wide',
                        isHighlight ? 'text-kado-cream' : 'text-kado-dark',
                      )}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={cn(
                        'kado-body-sm',
                        isHighlight ? 'text-kado-cream/85' : 'text-kado-dark/70',
                      )}
                    >
                      {item.body}
                    </p>
                  </article>
                </div>

                <div className="relative z-10 order-2 flex flex-col items-center pt-2">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center border-2 font-display text-[10px] font-bold',
                      isHighlight
                        ? 'border-kado-cream bg-kado-red text-kado-cream'
                        : 'border-kado-dark/20 bg-kado-cream text-kado-dark',
                    )}
                  >
                    {isHighlight ? '★' : String(i + 1).padStart(2, '0')}
                  </div>
                </div>

                <div className={cn(isLeft ? 'order-3' : 'order-1')} aria-hidden />
              </motion.li>
            );
          })}
        </ol>
      </AboutEditorialGrid>
    </AboutSectionShell>
  );
}
