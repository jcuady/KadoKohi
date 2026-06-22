import { useRef } from 'react';
import { motion } from 'motion/react';
import { ABOUT_COMMITMENT } from '@/content/aboutPage';
import { AboutArchFrame } from './AboutArchFrame';
import { AboutSectionHeader, AboutSectionShell } from './AboutUi';
import { useStaggerReveal } from './useAboutMotion';

export default function AboutCommitment() {
  const gridRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(gridRef, '.commitment-pillar');

  return (
    <AboutSectionShell className="border-kado-dark/10 bg-kado-dark text-kado-cream">
      <div className="mb-10 md:mb-14">
        <AboutSectionHeader
          dark
          eyebrow={ABOUT_COMMITMENT.eyebrow}
          title={ABOUT_COMMITMENT.title}
          intro={ABOUT_COMMITMENT.intro}
        />
      </div>

      <div
        ref={gridRef}
        className="about-scroll-rail about-scroll-rail--desktop-stack lg:grid lg:grid-cols-3 lg:gap-6"
      >
        {ABOUT_COMMITMENT.pillars.map((pillar, i) => (
          <motion.article
            key={pillar.title}
            className="commitment-pillar w-[min(82vw,18rem)] lg:w-auto"
          >
            <AboutArchFrame aspect="wide" className="bg-gradient-to-b from-kado-cream/20 to-kado-red/30">
              <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                <span className="font-display text-5xl font-black text-kado-cream/25">0{i + 1}</span>
                <p className="kado-label mt-2 text-kado-cream/80">Promise</p>
              </div>
            </AboutArchFrame>
            <div className="mt-5 px-1">
              <h3 className="kado-h3 text-kado-cream">{pillar.title}</h3>
              <p className="kado-body-sm mt-2 text-kado-cream/72">{pillar.body}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </AboutSectionShell>
  );
}
