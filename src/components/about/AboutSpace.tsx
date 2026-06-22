import { useRef } from 'react';
import { motion } from 'motion/react';
import ResilientImage from '@/components/ui/ResilientImage';
import { ABOUT_SPACE } from '@/content/aboutPage';
import { AboutSectionShell } from './AboutUi';
import { AboutEditorialGrid, EditorialHeadline } from './AboutEditorial';
import { useParallaxY } from './useAboutMotion';

export default function AboutSpace() {
  const primaryRef = useRef<HTMLDivElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);
  useParallaxY(primaryRef, 12);
  useParallaxY(secondaryRef, -8);

  return (
    <AboutSectionShell className="bg-kado-dark text-kado-cream">
      <AboutEditorialGrid dark>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="order-2 min-w-0 lg:order-1"
          >
            <p className="kado-label mb-3 text-kado-cream/55">{ABOUT_SPACE.eyebrow}</p>
            <EditorialHeadline
              as="h2"
              dark
              lines={[[{ text: 'Your ', accent: false }, { text: 'Corner', accent: true }, { text: ' Awaits', accent: false }]]}
              size="section"
              className="mb-5"
            />
            <p className="kado-body text-kado-cream/75">{ABOUT_SPACE.body}</p>
          </motion.div>

          <div className="relative order-1 min-h-[18rem] min-w-0 sm:min-h-[22rem] lg:order-2 lg:min-h-[26rem]">
            <div ref={primaryRef} className="relative z-10 overflow-hidden border border-kado-cream/10">
              <div className="aspect-[16/11]">
                <ResilientImage
                  src={ABOUT_SPACE.imageSrc}
                  fallbackSrc={ABOUT_SPACE.imageFallback}
                  alt={ABOUT_SPACE.imageAlt}
                  className="about-editorial-photo h-full w-full object-cover"
                />
              </div>
            </div>
            <div
              ref={secondaryRef}
              className="absolute -bottom-4 -left-2 z-20 w-[58%] max-w-[11rem] overflow-hidden border-4 border-kado-dark sm:-left-4 sm:max-w-none sm:w-[55%]"
            >
              <div className="aspect-[4/5]">
                <ResilientImage
                  src={ABOUT_SPACE.secondaryImageSrc}
                  fallbackSrc={ABOUT_SPACE.secondaryImageFallback}
                  alt={ABOUT_SPACE.secondaryImageAlt}
                  className="about-editorial-photo h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </AboutEditorialGrid>
    </AboutSectionShell>
  );
}
