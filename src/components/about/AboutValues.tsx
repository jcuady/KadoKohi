import { useRef } from 'react';
import { motion } from 'motion/react';
import ResilientImage from '@/components/ui/ResilientImage';
import { ABOUT_VALUES, ABOUT_SPACE } from '@/content/aboutPage';
import { ABOUT_EDITORIAL } from '@/content/aboutPage';
import { AboutSectionShell } from './AboutUi';
import {
  AboutEditorialGrid,
  EditorialCtaLink,
  EditorialHeadline,
} from './AboutEditorial';
import { useStaggerReveal } from './useAboutMotion';
import { cn } from '@/lib/utils';

export default function AboutValues() {
  const gridRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(gridRef, '.philosophy-card');

  return (
    <>
      {/* Crafting the unconventional — overlapping type + image */}
      <AboutSectionShell className="relative overflow-hidden bg-kado-dark p-0 text-kado-cream sm:py-0" innerClassName="max-w-none">
        <AboutEditorialGrid dark>
          <div className="relative grid min-h-[min(60vh,32rem)] sm:min-h-[min(65vh,34rem)] lg:min-h-[min(70vh,36rem)] lg:grid-cols-12">
            <div className="relative z-10 flex min-w-0 flex-col justify-end px-[max(1rem,env(safe-area-inset-left))] py-12 sm:px-6 sm:py-16 lg:col-span-7 lg:py-24 pr-[max(1rem,env(safe-area-inset-right))]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <EditorialHeadline as="h2" dark lines={ABOUT_EDITORIAL.craftLines} size="section" />
                <p className="kado-label mt-6 text-kado-cream/50">{ABOUT_EDITORIAL.processLabel}</p>
                <div className="mt-8">
                  <EditorialCtaLink dark to={ABOUT_EDITORIAL.discoverCta.to} label={ABOUT_EDITORIAL.discoverCta.label} />
                </div>
              </motion.div>
            </div>
            <div className="relative min-h-[40vh] lg:col-span-5 lg:min-h-[inherit]">
              <ResilientImage
                src={ABOUT_SPACE.imageSrc}
                fallbackSrc={ABOUT_SPACE.imageFallback}
                alt={ABOUT_SPACE.imageAlt}
                className="about-editorial-photo absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-kado-dark via-kado-dark/30 to-transparent lg:bg-gradient-to-r lg:from-kado-dark lg:via-kado-dark/25 lg:to-transparent" />
            </div>
          </div>
        </AboutEditorialGrid>
      </AboutSectionShell>

      {/* Philosophy grid */}
      <AboutSectionShell className="bg-kado-offwhite" id="about-philosophy">
        <AboutEditorialGrid>
          <div className="mb-10 md:mb-14">
            <p className="kado-label mb-3 text-kado-red">{ABOUT_VALUES.eyebrow}</p>
            <EditorialHeadline as="h2" lines={ABOUT_EDITORIAL.philosophyLines} size="section" className="mb-4" />
            <p className="kado-body max-w-2xl text-kado-dark/70">{ABOUT_VALUES.intro}</p>
          </div>

          <div ref={gridRef} className="grid grid-cols-1 gap-px border border-kado-dark/10 bg-kado-dark/10 sm:grid-cols-2">
            {ABOUT_VALUES.items.map((item, i) => (
                <motion.article
                  key={item.title}
                  whileHover={{ backgroundColor: 'var(--color-kado-cream)' }}
                  className={cn(
                    'philosophy-card group bg-white p-6 sm:p-8',
                    i === 0 && 'sm:col-span-2 lg:col-span-1',
                  )}
                >
                  <h3 className="font-display text-lg font-bold uppercase tracking-tight text-kado-dark sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="kado-body-sm mt-3 text-kado-dark/70">{item.body}</p>
                </motion.article>
              ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 border-t border-kado-dark/10 pt-10"
          >
            <EditorialHeadline as="p" parts={ABOUT_EDITORIAL.futureParts} size="inline" className="max-w-4xl" />
          </motion.div>
        </AboutEditorialGrid>
      </AboutSectionShell>
    </>
  );
}
