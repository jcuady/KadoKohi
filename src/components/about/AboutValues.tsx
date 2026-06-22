import { useRef } from 'react';
import { motion } from 'motion/react';
import { Coffee, Heart, Sparkles, Users } from 'lucide-react';
import { ABOUT_VALUES } from '@/content/aboutPage';
import { AboutKanjiWatermark, AboutSectionHeader, AboutSectionShell } from './AboutUi';
import { useStaggerReveal } from './useAboutMotion';
import { cn } from '@/lib/utils';

const icons = [Coffee, Heart, Users, Sparkles] as const;

const bentoLayout = [
  'md:col-span-2 lg:col-span-7 lg:row-span-2',
  'lg:col-span-5',
  'lg:col-span-5',
  'md:col-span-2 lg:col-span-12',
] as const;

export default function AboutValues() {
  const gridRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(gridRef, '.philosophy-card');

  return (
    <AboutSectionShell className="relative overflow-hidden bg-kado-cream" id="about-philosophy">
      <AboutKanjiWatermark className="left-[-3rem] top-1/2 -translate-y-1/2 text-[clamp(8rem,28vw,14rem)] text-kado-dark/[0.04]" />

      <div className="relative mb-10 md:mb-14">
        <AboutSectionHeader
          eyebrow={ABOUT_VALUES.eyebrow}
          title={ABOUT_VALUES.title}
          intro={ABOUT_VALUES.intro}
        />
      </div>

      <div
        ref={gridRef}
        className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5"
      >
        {ABOUT_VALUES.items.map((item, i) => {
          const Icon = icons[i] ?? Coffee;
          const featured = i === 0;
          const strip = i === 3;

          return (
            <motion.article
              key={item.title}
              whileHover={{ y: featured ? -2 : -4 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className={cn(
                'philosophy-card group relative overflow-hidden rounded-2xl border p-6 sm:p-7',
                bentoLayout[i],
                featured
                  ? 'min-h-[240px] border-kado-red/25 bg-gradient-to-br from-kado-red via-kado-red to-[#6d1216] text-kado-cream shadow-[0_24px_60px_rgba(158,24,29,0.28)] sm:min-h-[280px] lg:min-h-[320px] lg:p-9'
                  : strip
                    ? 'border-kado-dark/8 bg-white sm:flex sm:items-center sm:justify-between sm:gap-8 lg:p-8'
                    : 'border-kado-dark/8 bg-white shadow-sm',
              )}
            >
              {!featured ? (
                <div
                  aria-hidden
                  className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-kado-red/[0.04] transition-transform duration-500 group-hover:scale-125"
                />
              ) : null}

              <div className={cn('relative', strip && 'sm:max-w-xl')}>
                <div
                  className={cn(
                    'mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
                    featured
                      ? 'bg-kado-cream/15 text-kado-cream'
                      : 'bg-kado-cream text-kado-red group-hover:bg-kado-red group-hover:text-kado-cream',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3
                  className={cn(
                    'mb-2 font-display font-semibold',
                    featured ? 'text-2xl sm:text-3xl text-kado-cream' : 'kado-h3 text-kado-dark',
                    strip && 'sm:mb-1',
                  )}
                >
                  {item.title}
                </h3>
                <p
                  className={cn(
                    'kado-body-sm',
                    featured ? 'max-w-md text-kado-cream/85' : 'text-kado-dark/70',
                    strip && 'sm:text-base',
                  )}
                >
                  {item.body}
                </p>
              </div>

              {strip ? (
                <p
                  aria-hidden
                  className="mt-4 font-display text-5xl font-black text-kado-red/10 sm:mt-0 sm:shrink-0 sm:text-6xl"
                >
                  角
                </p>
              ) : null}

              {featured ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-10 -right-6 font-display text-[clamp(5rem,18vw,9rem)] font-black leading-none text-white/[0.08]"
                >
                  角
                </div>
              ) : null}
            </motion.article>
          );
        })}
      </div>
    </AboutSectionShell>
  );
}
