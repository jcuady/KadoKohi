import { lazy, Suspense } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { CalendarHeart, MapPin } from 'lucide-react';
import { useRef } from 'react';
import { LOGO } from '@/lib/brandTokens';
import { ABOUT_HERO } from '@/content/aboutPage';
import { AboutChip, AboutKanjiWatermark } from './AboutUi';

const AboutThreeScene = lazy(() => import('./AboutThreeScene'));

export default function AboutHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[min(100svh,56rem)] flex-col justify-center overflow-hidden border-b border-white/10 bg-kado-red pt-24 pb-20 text-kado-cream md:pb-24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(241,223,186,0.14),transparent_55%)]" />
      <AboutKanjiWatermark className="-right-4 top-10 text-[clamp(7rem,24vw,14rem)] md:right-8" />
      <AboutKanjiWatermark className="left-[-2rem] bottom-8 text-[clamp(5rem,18vw,10rem)] opacity-40 rotate-12" />

      <Suspense fallback={null}>
        <AboutThreeScene />
      </Suspense>

      <motion.div style={{ y, opacity }} className="relative z-10 mx-auto w-full max-w-5xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="kado-label mb-5 text-kado-cream/80"
        >
          {ABOUT_HERO.eyebrow}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.05 }}
        >
          <img
            src={LOGO.stackedWordmark}
            alt="Kado Kohi"
            decoding="async"
            className="mx-auto h-auto max-h-[7rem] w-auto max-w-[min(300px,86vw)] object-contain brightness-0 invert md:max-h-32"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="kado-h1 kado-h1-hero mt-8 text-kado-cream"
        >
          {ABOUT_HERO.headline}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
          className="mx-auto mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3"
        >
          <AboutChip variant="cream">
            <CalendarHeart className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {ABOUT_HERO.softOpeningLabel}
          </AboutChip>
          <span className="kado-body font-semibold text-kado-cream">{ABOUT_HERO.softOpeningDate}</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24 }}
          className="kado-body mx-auto mt-6 max-w-2xl text-kado-cream/88"
        >
          {ABOUT_HERO.tagline}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.32 }}
          className="kado-body-sm mt-4 inline-flex items-center justify-center gap-1.5 text-kado-cream/65"
        >
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {ABOUT_HERO.locationNote}
        </motion.p>
      </motion.div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="kado-subtext text-kado-cream/50">Scroll</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="h-8 w-px bg-kado-cream/40"
        />
      </motion.div>
    </section>
  );
}
