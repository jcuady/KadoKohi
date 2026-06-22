import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { CalendarHeart, MapPin } from 'lucide-react';
import ResilientImage from '@/components/ui/ResilientImage';
import { ABOUT_HERO, ABOUT_STATS } from '@/content/aboutPage';
import { ABOUT_EDITORIAL } from '@/content/aboutPage';
import { AboutChip } from './AboutUi';
import { AboutEditorialGrid, EditorialHeadline } from './AboutEditorial';

export default function AboutHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <section
      ref={ref}
      className="relative min-h-[min(100svh,54rem)] overflow-hidden border-b border-kado-cream/10 bg-kado-dark text-kado-cream"
    >
      <AboutEditorialGrid dark className="min-h-[inherit]">
        <div className="grid min-h-[inherit] lg:grid-cols-12">
          <motion.div
            style={{ y: copyY }}
            className="relative z-10 flex flex-col justify-end px-[max(1rem,env(safe-area-inset-left))] pb-8 pt-28 sm:px-6 sm:pb-12 lg:col-span-7 lg:pb-16 lg:pt-32 pr-[max(1rem,env(safe-area-inset-right))]"
          >
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="kado-label mb-6 text-kado-cream/60"
            >
              {ABOUT_HERO.eyebrow}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.06 }}
            >
              <EditorialHeadline as="h1" dark lines={ABOUT_EDITORIAL.heroLines} />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="kado-body mt-6 max-w-xl text-kado-cream/78 md:mt-8"
            >
              {ABOUT_HERO.tagline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="mt-5 flex flex-wrap items-center gap-3"
            >
              <AboutChip variant="cream">
                <CalendarHeart className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {ABOUT_HERO.softOpeningLabel}
              </AboutChip>
              <span className="kado-body-sm font-semibold">{ABOUT_HERO.softOpeningDate}</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="kado-body-sm mt-4 flex items-center gap-1.5 text-kado-cream/55"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {ABOUT_HERO.locationNote}
            </motion.p>
          </motion.div>

          <motion.div
            style={{ y: imageY }}
            className="relative min-h-[42vh] lg:col-span-5 lg:min-h-[inherit]"
          >
            <div className="absolute inset-0 lg:-left-16 lg:top-12 lg:bottom-0">
              <ResilientImage
                src={ABOUT_HERO.heroImageSrc}
                fallbackSrc={ABOUT_HERO.heroImageFallback}
                alt={ABOUT_HERO.heroImageAlt}
                className="about-editorial-photo h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-kado-dark via-kado-dark/20 to-transparent lg:bg-gradient-to-l lg:from-kado-dark lg:via-transparent lg:to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Stats strip — editorial footer bar */}
        <div className="border-t border-kado-cream/10 bg-kado-dark/80 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-px border-kado-cream/10 md:grid-cols-4">
            {ABOUT_STATS.map((stat) => (
              <div
                key={stat.label}
                className="border-kado-cream/10 px-4 py-4 sm:px-6 sm:py-5 md:border-l first:md:border-l-0"
              >
                <p className="font-display text-lg font-bold text-kado-cream sm:text-xl">{stat.value}</p>
                <p className="kado-label mt-1 text-kado-cream/55">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </AboutEditorialGrid>
    </section>
  );
}
