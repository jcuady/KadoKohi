import { useRef } from 'react';
import { motion } from 'motion/react';
import ResilientImage from '@/components/ui/ResilientImage';
import { ABOUT_ORIGINS } from '@/content/aboutPage';
import { AboutSectionHeader } from './AboutUi';
import { useParallaxY } from './useAboutMotion';

export default function AboutOrigins() {
  const imageWrapRef = useRef<HTMLDivElement>(null);
  useParallaxY(imageWrapRef, 18);

  return (
    <section className="border-b border-kado-dark/8 px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-8%' }}
          transition={{ duration: 0.65 }}
          className="relative"
        >
          <div
            ref={imageWrapRef}
            className="relative overflow-hidden rounded-2xl border border-kado-dark/10 bg-kado-cream shadow-[0_24px_60px_rgba(25,25,25,0.12)]"
          >
            <div className="aspect-[4/5] max-h-[520px] lg:max-h-none">
              <ResilientImage
                src={ABOUT_ORIGINS.imageSrc}
                fallbackSrc={ABOUT_ORIGINS.imageFallback}
                alt={ABOUT_ORIGINS.imageAlt}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-kado-dark/30 via-transparent to-transparent" />
          </div>
          <div
            aria-hidden
            className="absolute -bottom-4 -right-4 hidden h-24 w-24 rounded-2xl border border-kado-red/20 bg-kado-red/10 backdrop-blur md:block"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-8%' }}
          transition={{ duration: 0.65, delay: 0.08 }}
        >
          <AboutSectionHeader
            align="left"
            eyebrow={ABOUT_ORIGINS.eyebrow}
            title={ABOUT_ORIGINS.title}
          />
          <p className="kado-body mb-6 mt-5 font-semibold text-kado-dark/90">{ABOUT_ORIGINS.lead}</p>
          <div className="space-y-4">
            {ABOUT_ORIGINS.paragraphs.map((p) => (
              <p key={p.slice(0, 48)} className="kado-body text-kado-dark/70">
                {p}
              </p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
