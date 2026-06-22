import { useRef } from 'react';
import { motion } from 'motion/react';
import ResilientImage from '@/components/ui/ResilientImage';
import { ABOUT_ORIGINS } from '@/content/aboutPage';
import { ABOUT_EDITORIAL } from '@/content/aboutPage';
import { AboutSectionShell } from './AboutUi';
import {
  AboutEditorialGrid,
  EditorialColumns,
  EditorialHeadline,
} from './AboutEditorial';
import { useParallaxY } from './useAboutMotion';

export default function AboutOrigins() {
  const imageWrapRef = useRef<HTMLDivElement>(null);
  useParallaxY(imageWrapRef, 14);

  return (
    <AboutSectionShell className="bg-kado-cream" innerClassName="max-w-none">
      <AboutEditorialGrid className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-0">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-8%' }}
            transition={{ duration: 0.6 }}
            className="relative lg:col-span-5 lg:pr-8"
          >
            <div
              ref={imageWrapRef}
              className="relative aspect-[4/5] max-h-[min(520px,65vh)] overflow-hidden border border-kado-dark/10 lg:max-h-none"
            >
              <ResilientImage
                src={ABOUT_ORIGINS.imageSrc}
                fallbackSrc={ABOUT_ORIGINS.imageFallback}
                alt={ABOUT_ORIGINS.imageAlt}
                className="about-editorial-photo h-full w-full object-cover"
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-3 -right-3 hidden h-20 w-20 border-2 border-kado-red bg-kado-red/10 lg:block"
            />
          </motion.div>

          <div className="flex flex-col justify-center lg:col-span-7 lg:border-l lg:border-kado-dark/10 lg:pl-10 xl:pl-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <p className="kado-label mb-4 text-kado-red">{ABOUT_ORIGINS.eyebrow}</p>
              <EditorialHeadline as="h2" lines={ABOUT_EDITORIAL.aboutLines} size="section" className="mb-6" />
              <p className="kado-body mb-8 font-semibold text-kado-dark/90">{ABOUT_ORIGINS.lead}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <EditorialColumns>
                {ABOUT_ORIGINS.paragraphs.map((p) => (
                  <p key={p.slice(0, 48)}>{p}</p>
                ))}
              </EditorialColumns>
            </motion.div>
          </div>
        </div>
      </AboutEditorialGrid>
    </AboutSectionShell>
  );
}
