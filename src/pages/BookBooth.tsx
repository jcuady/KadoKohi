import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CalendarHeart, Users, Clock3, BadgeCheck, ArrowDown } from 'lucide-react';
import BookingSteps from '../components/booking/BookingSteps';
import BookingWizard, { type BookingWizardStage } from '../components/booking/BookingWizard';
import { useBoothShowcaseStore } from '../store/boothShowcaseStore';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import CmsStyledText from '../components/cms/CmsStyledText';
import { boothChipKey } from '../lib/boothPageContent';

const CHIP_ICONS = [CalendarHeart, Users, Clock3, BadgeCheck] as const;

export default function BookBooth() {
  const showcaseMediaRaw = useBoothShowcaseStore((s) => s.media);
  const pageCopy = useBoothShowcaseStore((s) => s.pageCopy);
  const hydrateFromRemote = useBoothShowcaseStore((s) => s.hydrateFromRemote);
  const [, setWizardStage] = useState<BookingWizardStage>('form');

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

  const showcaseMedia = useMemo(
    () =>
      [...showcaseMediaRaw]
        .filter((item) => item.visible)
        .sort((a, b) => a.order - b.order),
    [showcaseMediaRaw],
  );

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-kado-dark" style={{ minHeight: 'min(92svh, 680px)' }}>
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-0.5 opacity-60">
          <div className="col-span-4 row-span-3 overflow-hidden">
            <img src="/booth-photos/booth-1.jpg" alt="Kado Kohi booth event" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-5 row-span-4 overflow-hidden">
            <img src="/booth-photos/booth-2.jpg" alt="Kado Kohi booth setup" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-3 row-span-2 overflow-hidden">
            <img src="/booth-photos/booth-3.jpg" alt="Kado Kohi booth guests" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-4 row-span-3 overflow-hidden">
            <img src="/booth-photos/booth-4.jpg" alt="Kado Kohi event drinks" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-3 row-span-2 overflow-hidden">
            <img src="/booth-photos/booth-5.jpg" alt="Kado Kohi event venue" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-5 row-span-2 overflow-hidden">
            <img src="/booth-photos/booth-1.jpg" alt="Kado Kohi booth" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-kado-dark/95 via-kado-dark/75 to-kado-dark/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-kado-dark/80 via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col justify-end h-full px-6 sm:px-10 md:px-16 pb-12 sm:pb-16" style={{ minHeight: 'inherit' }}>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <CmsStyledText
              value={pageCopy.heroEyebrow}
              as="p"
              className="text-[10px] sm:text-xs font-black uppercase tracking-[0.28em] mb-4"
              defaultColorClass="text-kado-red"
            />
            <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-black leading-[0.95] tracking-tight uppercase mb-5 drop-shadow-lg">
              <CmsStyledText value={pageCopy.heroTitleLine1} as="span" defaultColorClass="text-white" />
              <br />
              <CmsStyledText value={pageCopy.heroTitleLine2} as="span" defaultColorClass="text-white" />
            </h1>
            <CmsStyledText
              value={pageCopy.heroDescription}
              as="p"
              className="text-base sm:text-lg leading-relaxed max-w-xl mb-8"
              defaultColorClass="text-kado-cream/85"
            />

            <div className="flex flex-wrap gap-3 mb-8">
              {pageCopy.chips.map((label, i) => {
                const Icon = CHIP_ICONS[i] ?? CalendarHeart;
                return (
                <span key={boothChipKey(label, i)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm text-[10px] sm:text-xs font-bold uppercase tracking-wider text-kado-cream/90">
                  <Icon className="w-3 h-3 text-kado-red shrink-0" /><CmsStyledText value={label} as="span" />
                </span>
                );
              })}
            </div>

            <a
              href="#booking-form"
              className="inline-flex items-center gap-2.5 min-h-[52px] px-8 bg-kado-red text-white text-xs font-bold uppercase tracking-[0.15em] rounded-sm shadow-lg shadow-kado-red/30 hover:bg-kado-red-hover transition-colors"
            >
              <CmsStyledText value={pageCopy.heroCtaLabel} as="span" /> <ArrowDown className="w-4 h-4 shrink-0" />
            </a>
          </motion.div>
        </div>
      </section>

      {showcaseMedia.length > 0 && (
        <section className="py-10 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {showcaseMedia.map((media, i) => (
                <motion.article
                  key={media.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="rounded-2xl overflow-hidden border border-kado-dark/10 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <img
                    src={media.image}
                    alt={media.title}
                    className="w-full aspect-[4/3] object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-4">
                    <h3 className="font-display text-lg font-bold text-kado-dark">{media.title}</h3>
                    {media.caption && <p className="text-sm text-kado-dark/60 mt-1">{media.caption}</p>}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      <BookingSteps
        eyebrow={pageCopy.howItWorksEyebrow}
        title={pageCopy.howItWorksTitle}
        steps={pageCopy.howItWorksSteps}
      />
      <BookingWizard onStageChange={setWizardStage} />
      <PageSeoBlurb />
    </div>
  );
}
