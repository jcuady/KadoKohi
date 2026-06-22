import { useRef } from 'react';
import { ABOUT_COMMITMENT } from '@/content/aboutPage';
import { AboutCard, AboutSectionHeader } from './AboutUi';
import { useStaggerReveal } from './useAboutMotion';

export default function AboutCommitment() {
  const gridRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(gridRef, '.about-pillar');

  return (
    <section className="relative overflow-hidden border-b border-kado-dark/8 bg-[#FAF7F2] px-6 py-16 md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(25,25,25,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(25,25,25,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 md:mb-16">
          <AboutSectionHeader
            eyebrow={ABOUT_COMMITMENT.eyebrow}
            title={ABOUT_COMMITMENT.title}
            intro={ABOUT_COMMITMENT.intro}
          />
        </div>
        <div ref={gridRef} className="grid gap-6 md:grid-cols-3">
          {ABOUT_COMMITMENT.pillars.map((pillar, i) => (
            <div key={pillar.title} className="about-pillar">
              <AboutCard className="bg-kado-cream/90 p-8">
              <p className="kado-label mb-3 text-kado-dark/40">0{i + 1}</p>
              <div className="mb-4 h-1 w-10 rounded-full bg-kado-red" />
              <h3 className="kado-h3 mb-3 text-kado-dark">{pillar.title}</h3>
              <p className="kado-body-sm text-kado-dark/70">{pillar.body}</p>
            </AboutCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
