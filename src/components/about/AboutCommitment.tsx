import { useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { ABOUT_COMMITMENT } from '@/content/aboutPage';
import { ABOUT_EDITORIAL } from '@/content/aboutPage';
import { AboutKanjiWatermark, AboutSectionShell } from './AboutUi';
import { AboutEditorialGrid, EditorialHeadline } from './AboutEditorial';
import { useRevealLines, useStaggerReveal } from './useAboutMotion';

export default function AboutCommitment() {
  const pillarsRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(pillarsRef, '.commitment-pillar');
  useRevealLines(pillarsRef, '.commitment-accent');

  return (
    <AboutSectionShell
      className="relative overflow-x-clip border-kado-cream/10 bg-kado-dark py-16 text-kado-cream md:py-24"
      innerClassName="max-w-6xl"
      id="about-commitment"
    >
      <AboutEditorialGrid dark className="absolute inset-0 opacity-100" aria-hidden />
      <AboutKanjiWatermark className="hidden text-[clamp(10rem,24vw,16rem)] text-white/[0.035] xl:block xl:-right-4 xl:top-4" />

      <div className="relative flex flex-col gap-10 xl:grid xl:grid-cols-12 xl:items-start xl:gap-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.55 }}
          className="min-w-0 max-w-full xl:col-span-4 xl:sticky xl:top-24"
        >
          <p className="kado-label mb-4 text-kado-cream/55">{ABOUT_COMMITMENT.eyebrow}</p>
          <EditorialHeadline
            as="h2"
            dark
            lines={ABOUT_EDITORIAL.commitmentLines}
            size="sidebar"
            className="about-commitment-headline mb-5"
          />
          <p className="kado-body max-w-prose text-kado-cream/72">{ABOUT_COMMITMENT.intro}</p>
          <p className="kado-subtext mt-6 flex items-center gap-2 text-kado-cream/40 md:hidden">
            Swipe
            <ChevronRight className="h-3.5 w-3.5 animate-pulse" aria-hidden />
          </p>
        </motion.div>

        <div
          ref={pillarsRef}
          className="about-scroll-rail about-scroll-rail--md-stack min-w-0 xl:col-span-8 xl:gap-0"
        >
          {ABOUT_COMMITMENT.pillars.map((pillar, i) => (
            <article
              key={pillar.title}
              className="commitment-pillar group relative w-[min(88vw,22rem)] border border-kado-cream/10 bg-kado-cream/[0.04] p-6 sm:w-[min(80vw,24rem)] md:w-full md:border-l-0 md:border-t md:p-8 md:first:border-t-0 xl:p-8"
            >
              <div
                className="commitment-accent commitment-accent-h absolute left-0 top-0 hidden h-1 w-full origin-left bg-kado-red md:block"
                aria-hidden
              />
              <div
                className="commitment-accent absolute bottom-0 left-0 top-0 w-1 origin-top bg-kado-red md:hidden"
                aria-hidden
              />
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-display text-4xl font-black text-kado-cream/15 sm:text-5xl">
                  0{i + 1}
                </p>
                <p className="kado-label text-kado-cream/45">Promise</p>
              </div>
              <h3 className="kado-h3 mt-4 mb-3 text-kado-cream">{pillar.title}</h3>
              <p className="kado-body-sm text-kado-cream/70">{pillar.body}</p>
            </article>
          ))}
        </div>
      </div>
    </AboutSectionShell>
  );
}
