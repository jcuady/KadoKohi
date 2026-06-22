import { motion } from 'motion/react';
import ResilientImage from '@/components/ui/ResilientImage';
import { ABOUT_GALLERY } from '@/content/aboutPage';
import { AboutSectionHeader, AboutSectionShell } from './AboutUi';

export default function AboutGallery() {
  return (
    <AboutSectionShell className="bg-kado-cream">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-2 top-1/2 hidden h-32 -translate-y-1/2 font-display text-6xl font-black text-kado-red/[0.08] sm:block"
        >
          角
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-2 top-1/2 hidden h-32 -translate-y-1/2 font-display text-6xl font-black text-kado-red/[0.08] sm:block"
        >
          コーヒー
        </div>

        <div className="mb-10 md:mb-12">
          <AboutSectionHeader
            eyebrow={ABOUT_GALLERY.eyebrow}
            title={ABOUT_GALLERY.title}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {ABOUT_GALLERY.images.map((img, i) => (
            <motion.div
              key={img.src}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="overflow-hidden rounded-2xl border border-kado-dark/10 bg-white shadow-sm"
            >
              <div className="aspect-square">
                <ResilientImage
                  src={img.src}
                  fallbackSrc={img.fallback}
                  alt={img.alt}
                  className="h-full w-full object-cover"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AboutSectionShell>
  );
}
