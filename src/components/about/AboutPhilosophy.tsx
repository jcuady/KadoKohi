import { lazy, Suspense, useRef } from 'react';
import { motion } from 'motion/react';
import { ABOUT_PHILOSOPHY, ABOUT_VALUES } from '@/content/aboutPage';
import { AboutSectionShell } from './AboutUi';
import { useParallaxY } from './useAboutMotion';

const AboutThreeScene = lazy(() => import('./AboutThreeScene'));

export default function AboutPhilosophy() {
  const cupRef = useRef<HTMLDivElement>(null);
  useParallaxY(cupRef, 20);

  return (
    <AboutSectionShell
      className="about-cloud-section relative overflow-hidden border-kado-dark/6 py-16 md:py-28"
      id="about-philosophy"
    >
      <div className="relative grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7 }}
          className="min-w-0 text-center lg:col-span-5 lg:text-left"
        >
          <p className="kado-label mb-3 text-kado-red">{ABOUT_PHILOSOPHY.eyebrow}</p>
          <h2 className="font-display text-[clamp(1.75rem,5vw,2.75rem)] font-bold leading-tight text-kado-dark">
            {ABOUT_PHILOSOPHY.titleLine1}
            <span className="mt-1 block text-kado-red">{ABOUT_PHILOSOPHY.titleLine2}</span>
          </h2>
          <p className="kado-body mt-5 text-kado-dark/72">{ABOUT_PHILOSOPHY.body}</p>
        </motion.div>

        <div className="relative flex min-h-[16rem] items-center justify-center sm:min-h-[20rem] lg:col-span-7">
          <motion.div
            ref={cupRef}
            initial={{ opacity: 0, scale: 0.88 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative h-[min(52vw,18rem)] w-[min(52vw,18rem)] sm:h-72 sm:w-72"
          >
            <Suspense fallback={null}>
              <AboutThreeScene />
            </Suspense>
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-8 rounded-full bg-kado-red/10 blur-3xl"
            />
          </motion.div>
        </div>
      </div>

      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
        {ABOUT_VALUES.items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.07 }}
            className="rounded-xl border border-kado-dark/8 bg-white/70 px-4 py-4 backdrop-blur-sm"
          >
            <p className="kado-label mb-1 text-kado-red/80">0{i + 1}</p>
            <p className="font-display text-sm font-semibold text-kado-dark">{item.title}</p>
          </motion.div>
        ))}
      </div>
    </AboutSectionShell>
  );
}
