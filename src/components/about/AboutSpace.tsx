import { useRef } from 'react';
import { motion } from 'motion/react';
import ResilientImage from '@/components/ui/ResilientImage';
import { ABOUT_SPACE } from '@/content/aboutPage';
import { AboutSectionHeader } from './AboutUi';
import { useParallaxY } from './useAboutMotion';

export default function AboutSpace() {
  const primaryRef = useRef<HTMLDivElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);
  useParallaxY(primaryRef, 14);
  useParallaxY(secondaryRef, -10);

  return (
    <section className="border-b border-kado-dark/8 bg-kado-cream px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="order-2 lg:order-1"
        >
          <AboutSectionHeader
            align="left"
            eyebrow={ABOUT_SPACE.eyebrow}
            title={ABOUT_SPACE.title}
          />
          <p className="kado-body mt-5 text-kado-dark/70">{ABOUT_SPACE.body}</p>
        </motion.div>

        <div className="relative order-1 min-h-[20rem] lg:order-2 lg:min-h-[28rem]">
          <div
            ref={primaryRef}
            className="relative z-10 overflow-hidden rounded-2xl border border-kado-dark/10 shadow-[0_20px_50px_rgba(25,25,25,0.1)]"
          >
            <div className="aspect-[16/11]">
              <ResilientImage
                src={ABOUT_SPACE.imageSrc}
                fallbackSrc={ABOUT_SPACE.imageFallback}
                alt={ABOUT_SPACE.imageAlt}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div
            ref={secondaryRef}
            className="absolute -bottom-6 -left-4 z-20 w-[55%] overflow-hidden rounded-xl border-4 border-kado-cream shadow-xl md:-left-8"
          >
            <div className="aspect-[4/5]">
              <ResilientImage
                src={ABOUT_SPACE.secondaryImageSrc}
                fallbackSrc={ABOUT_SPACE.secondaryImageFallback}
                alt={ABOUT_SPACE.secondaryImageAlt}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
