import { useRef } from 'react';
import { motion } from 'motion/react';
import ResilientImage from '@/components/ui/ResilientImage';
import { ABOUT_WISDOM } from '@/content/aboutPage';
import { useParallaxY } from './useAboutMotion';

export default function AboutWisdom() {
  const imageRef = useRef<HTMLDivElement>(null);
  useParallaxY(imageRef, 16);

  return (
    <section className="relative overflow-hidden border-b border-kado-dark/8">
      <div className="relative min-h-[28rem] sm:min-h-[32rem]">
        <div ref={imageRef} className="absolute inset-0">
          <ResilientImage
            src={ABOUT_WISDOM.imageSrc}
            fallbackSrc={ABOUT_WISDOM.imageFallback}
            alt={ABOUT_WISDOM.imageAlt}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-kado-dark/88 via-kado-dark/55 to-kado-dark/25" />
        </div>

        <div className="relative z-10 flex min-h-[28rem] items-center px-[max(1rem,env(safe-area-inset-left))] py-14 pr-[max(1rem,env(safe-area-inset-right))] sm:min-h-[32rem] sm:px-8 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="max-w-xl"
          >
            <p className="kado-label mb-4 text-kado-cream/75">{ABOUT_WISDOM.eyebrow}</p>
            <blockquote className="font-display text-[clamp(1.75rem,5vw,3rem)] font-bold leading-tight text-kado-cream">
              “{ABOUT_WISDOM.quote}”
            </blockquote>
            <p className="kado-body mt-6 text-kado-cream/80">{ABOUT_WISDOM.body}</p>
          </motion.div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-6 right-6 font-display text-[clamp(4rem,12vw,7rem)] font-black text-kado-cream/[0.08]"
        >
          角
        </div>
      </div>
    </section>
  );
}
