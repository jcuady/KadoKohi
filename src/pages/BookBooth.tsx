import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';
import BookingSteps from '../components/booking/BookingSteps';
import BookingWizard, { type BookingWizardStage } from '../components/booking/BookingWizard';
import { useBoothShowcaseStore } from '../store/boothShowcaseStore';
import { useMatchaShowcaseStore } from '../store/matchaShowcaseStore';
import { useBoothCatalogStore } from '../store/boothCatalogStore';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import CmsStyledText from '../components/cms/CmsStyledText';
import { boothChipKey } from '../lib/boothPageContent';
import { BOOKING_PAGE_LABELS, type BookingPageKind } from '../lib/bookingPageKinds';

const BOOTH_HERO_IMAGES = [
  { src: '/booth-photos/booth-1.jpg', alt: 'Kado Kohi coffee cart event' },
  { src: '/booth-photos/booth-2.jpg', alt: 'Kado Kohi coffee cart setup' },
  { src: '/booth-photos/booth-3.jpg', alt: 'Kado Kohi coffee cart guests' },
  { src: '/booth-photos/booth-4.jpg', alt: 'Kado Kohi event drinks' },
  { src: '/booth-photos/booth-5.jpg', alt: 'Kado Kohi event venue' },
  { src: '/booth-photos/booth-1.jpg', alt: 'Kado Kohi coffee cart' },
] as const;

const MATCHA_HERO_IMAGES = [
  { src: '/social/matcha-series.png', alt: 'Kado Kohi matcha bar setup' },
  { src: '/social/matcha-latte.png', alt: 'Matcha drinks at Kado Kohi events' },
  { src: '/booth-photos/booth-3.jpg', alt: 'Guests at a Kado Kohi event bar' },
] as const;

type Props = { kind?: BookingPageKind };

export default function BookBoothPage({ kind = 'coffee-cart' }: Props) {
  const isMatcha = kind === 'matcha-bar';
  const coffeeMedia = useBoothShowcaseStore((s) => s.media);
  const coffeePageCopy = useBoothShowcaseStore((s) => s.pageCopy);
  const hydrateCoffee = useBoothShowcaseStore((s) => s.hydrateFromRemote);
  const matchaMedia = useMatchaShowcaseStore((s) => s.media);
  const matchaPageCopy = useMatchaShowcaseStore((s) => s.pageCopy);
  const hydrateMatcha = useMatchaShowcaseStore((s) => s.hydrateFromRemote);
  const hydrateCatalog = useBoothCatalogStore((s) => s.hydrateFromRemote);
  const [, setWizardStage] = useState<BookingWizardStage>('form');

  const pageCopy = isMatcha ? matchaPageCopy : coffeePageCopy;
  const showcaseMediaRaw = isMatcha ? matchaMedia : coffeeMedia;
  const heroImages = isMatcha ? MATCHA_HERO_IMAGES : BOOTH_HERO_IMAGES;

  useEffect(() => {
    void hydrateCatalog();
    if (isMatcha) void hydrateMatcha();
    else void hydrateCoffee();
  }, [hydrateCatalog, hydrateCoffee, hydrateMatcha, isMatcha]);

  const showcaseMedia = useMemo(
    () =>
      [...showcaseMediaRaw]
        .filter((item) => item.visible)
        .sort((a, b) => a.order - b.order),
    [showcaseMediaRaw],
  );

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen">
      <section className="relative w-full overflow-hidden bg-kado-dark" style={{ minHeight: 'min(92svh, 680px)' }}>
        <div className={`absolute inset-0 gap-0.5 opacity-60 ${isMatcha ? 'grid grid-cols-2 lg:grid-cols-3' : 'grid grid-cols-12 grid-rows-6'}`}>
          {isMatcha
            ? heroImages.map((img) => (
                <div key={img.src} className="overflow-hidden min-h-[12rem] lg:min-h-0">
                  <img src={img.src} alt={img.alt} className="w-full h-full min-h-[inherit] object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
                </div>
              ))
            : heroImages.map((img, i) => {
                const gridClass =
                  i === 0
                    ? 'col-span-4 row-span-3'
                    : i === 1
                      ? 'col-span-5 row-span-4'
                      : i === 2
                        ? 'col-span-3 row-span-2'
                        : i === 3
                          ? 'col-span-4 row-span-3'
                          : i === 4
                            ? 'col-span-3 row-span-2'
                            : 'col-span-5 row-span-2';
                return (
                  <div key={`${img.src}-${i}`} className={`${gridClass} overflow-hidden`}>
                    <img
                      src={img.src}
                      alt={img.alt}
                      className={`w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out ${i === 5 ? 'object-top' : ''}`}
                    />
                  </div>
                );
              })}
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
            {!isMatcha ? null : (
              <p className="sr-only">{BOOKING_PAGE_LABELS[kind]}</p>
            )}
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
              {pageCopy.chips.map((label, i) => (
                <span
                  key={boothChipKey(label, i)}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm text-[10px] sm:text-xs font-bold uppercase tracking-wider text-kado-cream/90"
                >
                  <CmsStyledText value={label} as="span" />
                </span>
              ))}
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
      <BookingWizard onStageChange={setWizardStage} bookingKind={kind} />
      <PageSeoBlurb />
    </div>
  );
}
