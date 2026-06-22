import { lazy, Suspense, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { CalendarHeart, MapPin } from 'lucide-react';
import ResilientImage from '@/components/ui/ResilientImage';
import { LOGO } from '@/lib/brandTokens';
import { ABOUT_HERO } from '@/content/aboutPage';
import { AboutChip, AboutKanjiWatermark } from './AboutUi';

const AboutThreeScene = lazy(() => import('./AboutThreeScene'));

export default function AboutHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const portalY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] overflow-hidden bg-kado-cream px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]"
    >
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-110">
        <ResilientImage
          src={ABOUT_HERO.heroImage}
          fallbackSrc={ABOUT_HERO.heroImageFallback}
          alt=""
          className="h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-kado-dark/55 via-kado-dark/25 to-kado-cream" />
      </motion.div>

      <AboutKanjiWatermark className="right-0 top-16 text-[clamp(6rem,22vw,12rem)] text-kado-cream/[0.07]" />

      <motion.div
        style={{ opacity: textOpacity }}
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-4xl flex-col items-center justify-end pb-12 pt-28 sm:pb-16"
      >
        <motion.div style={{ y: portalY }} className="about-arch-portal w-full max-w-md sm:max-w-lg">
          <div className="relative aspect-[4/5] max-h-[min(52vh,28rem)] w-full sm:max-h-[32rem]">
            <ResilientImage
              src={ABOUT_HERO.heroImage}
              fallbackSrc={ABOUT_HERO.heroImageFallback}
              alt={ABOUT_HERO.heroImageAlt}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-kado-dark/50 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <img
                src={LOGO.wordmark}
                alt="Kado Kohi"
                className="h-8 w-auto brightness-0 invert opacity-95 sm:h-9"
              />
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="kado-label mt-8 text-kado-red"
        >
          {ABOUT_HERO.eyebrow}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.06 }}
          className="mt-4 text-center font-display text-[clamp(2rem,6vw,3.75rem)] font-bold leading-[1.05] tracking-tight text-kado-dark"
        >
          {ABOUT_HERO.headline}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="kado-body mt-4 max-w-xl text-center text-kado-dark/75"
        >
          {ABOUT_HERO.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:gap-3"
        >
          <AboutChip variant="red">
            <CalendarHeart className="h-3.5 w-3.5" aria-hidden />
            {ABOUT_HERO.softOpeningLabel} · {ABOUT_HERO.softOpeningDate}
          </AboutChip>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="kado-body-sm mt-4 inline-flex items-center gap-1.5 text-kado-dark/55"
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {ABOUT_HERO.locationNote}
        </motion.p>
      </motion.div>

      <Suspense fallback={null}>
        <div className="pointer-events-none absolute right-0 top-1/4 hidden h-64 w-64 opacity-40 lg:block">
          <AboutThreeScene />
        </div>
      </Suspense>
    </section>
  );
}
