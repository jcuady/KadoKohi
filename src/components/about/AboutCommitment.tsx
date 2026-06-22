import { useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { ABOUT_COMMITMENT } from '@/content/aboutPage';
import { AboutKanjiWatermark, AboutSectionHeader, AboutSectionShell } from './AboutUi';
import { useRevealLines, useStaggerReveal } from './useAboutMotion';

export default function AboutCommitment() {
  const pillarsRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(pillarsRef, '.commitment-pillar');
  useRevealLines(pillarsRef, '.commitment-accent');

  return (
    <AboutSectionShell
      className="relative overflow-hidden border-kado-dark/10 bg-kado-dark py-16 text-kado-cream md:py-24"
      innerClassName="max-w-6xl"
    >
      <AboutKanjiWatermark className="-right-8 top-0 text-[clamp(10rem,32vw,18rem)] text-white/[0.04]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(158,24,29,0.35),transparent_55%)]"
      />

      <div className="relative lg:grid lg:grid-cols-12 lg:items-start lg:gap-10 xl:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.55 }}
          className="mb-8 lg:col-span-4 lg:sticky lg:top-20 lg:mb-0 xl:top-24"
        >
          <AboutSectionHeader
            align="left"
            dark
            eyebrow={ABOUT_COMMITMENT.eyebrow}
            title={ABOUT_COMMITMENT.title}
            intro={ABOUT_COMMITMENT.intro}
          />
          <p className="kado-subtext mt-6 flex items-center gap-2 text-kado-cream/45 lg:hidden">
            Swipe the pillars
            <ChevronRight className="h-3.5 w-3.5 animate-pulse" aria-hidden />
          </p>
        </motion.div>

        <div
          ref={pillarsRef}
          className="about-scroll-rail about-scroll-rail--desktop-stack lg:col-span-8 lg:gap-5"
        >
          {ABOUT_COMMITMENT.pillars.map((pillar, i) => (
            <article
              key={pillar.title}
              className="commitment-pillar group relative w-[min(88vw,22rem)] overflow-hidden rounded-2xl border border-kado-cream/10 bg-kado-cream/[0.06] p-6 backdrop-blur-md sm:w-[min(80vw,24rem)] lg:w-full lg:p-8"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-2 -top-4 font-display text-[clamp(4rem,14vw,6.5rem)] font-black leading-none text-white/[0.07]"
              >
                0{i + 1}
              </span>
              <div
                className="commitment-accent absolute bottom-0 left-0 top-0 w-1 origin-top bg-kado-red"
                aria-hidden
              />
              <p className="kado-label relative mb-3 text-kado-cream/55">Promise 0{i + 1}</p>
              <h3 className="kado-h3 relative mb-3 text-kado-cream">{pillar.title}</h3>
              <p className="kado-body-sm relative text-kado-cream/72">{pillar.body}</p>
              <div
                aria-hidden
                className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_100%_0%,rgba(241,223,186,0.08),transparent_55%)]"
              />
            </article>
          ))}
        </div>
      </div>
    </AboutSectionShell>
  );
}
