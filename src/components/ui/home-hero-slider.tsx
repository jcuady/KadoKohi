import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { HomeHeroSlide } from '../../data/homeHeroMedia';
import { useLandingContentStore, type HeroChrome } from '../../store/landingContentStore';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import CmsStyledText from '../cms/CmsStyledText';
import CmsEditableImage from '../cms/CmsEditableImage';

interface Props {
  slides: HomeHeroSlide[];
  chrome?: HeroChrome;
  cmsEditMode?: boolean;
}

export default function HomeHeroSlider({ slides, chrome, cmsEditMode }: Props) {
  const safeSlides = useMemo(() => slides, [slides]);
  const [index, setIndex] = useState(0);
  const updateHeroChrome = useLandingContentStore((s) => s.updateHeroChrome);
  const updateHeroSlide = useLandingContentStore((s) => s.updateHeroSlide);
  const updateHeroCard = useLandingContentStore((s) => s.updateHeroCard);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (cmsEditMode || safeSlides.length < 2 || prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setIndex((n) => (n + 1) % safeSlides.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [safeSlides.length, cmsEditMode, prefersReducedMotion]);

  useEffect(() => {
    setIndex(0);
  }, [safeSlides.length]);

  if (safeSlides.length === 0) return null;

  const current = safeSlides[index] ?? safeSlides[0];
  const c = chrome;
  const slideIndex = index;
  const cms = cmsEditMode;

  const textProps = (
    field: string,
    label: string,
    value: Parameters<typeof CmsStyledText>[0]['value'],
    onChange: (v: Parameters<typeof CmsStyledText>[0]['value']) => void,
  ) =>
    cms
      ? {
          cmsField: field,
          cmsLabel: label,
          onCmsChange: onChange,
        }
      : {};

  return (
    // 92svh leaves an ~8vh peek of the next section (brand doc §3.4 client revision)
    <section
      id="landing-hero"
      aria-labelledby="hero-main-headline"
      className="landing-hero relative h-[calc(92svh-3.5rem)] min-h-[min(34rem,88svh)] w-full overflow-hidden border-b border-kado-dark/10"
    >
      <AnimatePresence mode="wait">
        {cms ? (
          <div key={current.id} className="absolute inset-0">
            <CmsEditableImage
              cmsField={`hero.slide.${slideIndex}.image`}
              src={current.image}
              alt={current.imageAlt}
              className="h-full w-full"
              onImageChange={(url) => updateHeroSlide(slideIndex, { image: url })}
            />
          </div>
        ) : (
          <motion.img
            key={current.id}
            src={current.image}
            alt={current.imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0.32, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.2, scale: 1.02 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-kado-dark/88 via-kado-dark/60 to-kado-dark/38" />
      <div className="absolute inset-0 bg-gradient-to-t from-kado-dark/50 via-transparent to-kado-dark/18" />

      <div className="landing-hero-inner relative z-10 grid h-full min-h-0 grid-cols-1 items-end gap-6 px-5 pb-28 pt-14 sm:px-8 sm:pb-32 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(200px,0.75fr)] lg:items-end lg:gap-8 lg:px-12 lg:pb-12 lg:pt-16 xl:px-20">
        <div className="min-w-0 max-w-3xl">
          <CmsStyledText
            value={c?.locationBadge ?? 'Kado Kohi · Marikina'}
            as="p"
            className="kado-label mb-3 drop-shadow-md"
            defaultColorClass="text-kado-cream/85"
            {...textProps('hero.chrome.locationBadge', 'Location badge', c?.locationBadge ?? 'Kado Kohi · Marikina', (v) =>
              updateHeroChrome({ locationBadge: v }),
            )}
          />
          <div id="hero-main-headline">
            <CmsStyledText
              value={c?.mainHeadline ?? 'Kado Coffee — Matcha & Specialty Coffee in Marikina'}
              as="h1"
              className="kado-h1 kado-h1-hero drop-shadow-lg"
            defaultColorClass="text-kado-offwhite"
            {...textProps(
              'hero.chrome.mainHeadline',
              'Main headline',
              c?.mainHeadline ?? 'Kado Coffee — Matcha & Specialty Coffee in Marikina',
              (v) => updateHeroChrome({ mainHeadline: v }),
            )}
          />
          </div>
          <div aria-live="polite" aria-atomic="true">
            <CmsStyledText
              value={current.title}
              as="h2"
              className="mt-3 drop-shadow-md"
              defaultSizeClass="kado-h2"
              defaultColorClass="text-kado-cream/95"
              {...textProps(`hero.slide.${slideIndex}.title`, 'Slide title', current.title, (v) =>
                updateHeroSlide(slideIndex, { title: v }),
              )}
            />
            <CmsStyledText
              value={current.subtitle}
              as="p"
              className="mt-4 sm:mt-5 max-w-2xl md:text-base leading-relaxed drop-shadow-md"
              defaultSizeClass="kado-body"
              defaultColorClass="text-kado-cream/90"
              {...textProps(`hero.slide.${slideIndex}.subtitle`, 'Slide subtitle', current.subtitle, (v) =>
                updateHeroSlide(slideIndex, { subtitle: v }),
              )}
            />
          </div>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              to={c?.primaryCtaPath ?? '/menu'}
              className="inline-flex min-h-[48px] sm:min-h-[52px] w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-kado-red px-8 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] text-white transition-all hover:bg-kado-red-hover shadow-lg shadow-kado-red/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark"
            >
              <CmsStyledText
                value={c?.primaryCtaLabel ?? 'Explore Menu'}
                as="span"
                {...textProps('hero.chrome.primaryCtaLabel', 'Primary CTA', c?.primaryCtaLabel ?? 'Explore Menu', (v) =>
                  updateHeroChrome({ primaryCtaLabel: v }),
                )}
              />{' '}
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
            <Link
              to={c?.secondaryCtaPath ?? '/merch'}
              className="inline-flex min-h-[48px] sm:min-h-[52px] w-full sm:w-auto items-center justify-center rounded-full border border-white/40 bg-black/20 backdrop-blur-sm px-8 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] text-white transition-all hover:border-white/80 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark"
            >
              <CmsStyledText
                value={c?.secondaryCtaLabel ?? 'Shop Merch'}
                as="span"
                {...textProps(
                  'hero.chrome.secondaryCtaLabel',
                  'Secondary CTA',
                  c?.secondaryCtaLabel ?? 'Shop Merch',
                  (v) => updateHeroChrome({ secondaryCtaLabel: v }),
                )}
              />
            </Link>
          </div>

          <div className="mt-8 hidden lg:block">
            <CmsStyledText
              value={c?.imageCredit ?? 'Images: Kado Kohi Social + InsideMarikina'}
              as="p"
              className="inline-flex rounded-full border border-white/20 bg-black/35 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur-md"
              defaultColorClass="text-kado-cream/85"
              {...textProps(
                'hero.chrome.imageCredit',
                'Image credit',
                c?.imageCredit ?? 'Images: Kado Kohi Social + InsideMarikina',
                (v) => updateHeroChrome({ imageCredit: v }),
              )}
            />
          </div>
        </div>

        <div className="landing-hero-cards hidden lg:grid grid-cols-2 gap-2.5 xl:gap-3 justify-self-end w-full max-w-[18rem] xl:max-w-[22rem] self-end min-w-0">
          {current.cards.slice(0, 4).map((card, i) => (
            <motion.article
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
              className="overflow-hidden rounded-xl border border-white/15 bg-black/35 backdrop-blur-sm shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
            >
              <div className="aspect-[3/4] w-full overflow-hidden">
                {cms ? (
                  <CmsEditableImage
                    cmsField={`hero.slide.${slideIndex}.card.${i}.src`}
                    src={card.src}
                    alt={card.alt}
                    className="h-full w-full"
                    onImageChange={(url) => updateHeroCard(slideIndex, i, { src: url })}
                  />
                ) : (
                  <img
                    src={card.src}
                    alt={card.alt}
                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="flex min-w-0 items-start justify-between gap-1.5 px-2 py-2 border-t border-white/10">
                <CmsStyledText
                  value={card.title}
                  as="p"
                  className="min-w-0 flex-1 line-clamp-2 text-[8px] font-bold uppercase leading-tight tracking-[0.1em] xl:text-[9px] xl:tracking-[0.12em]"
                  defaultColorClass="text-kado-cream/85"
                  {...textProps(`hero.slide.${slideIndex}.card.${i}.title`, `Card ${i + 1} title`, card.title, (v) =>
                    updateHeroCard(slideIndex, i, { title: v }),
                  )}
                />
                <CmsStyledText
                  value={card.tag}
                  as="span"
                  className="shrink-0 ml-1 text-[8px] font-bold uppercase tracking-wider bg-kado-red/15 px-1.5 py-0.5 rounded-sm"
                  defaultColorClass="text-kado-red/80"
                  {...textProps(`hero.slide.${slideIndex}.card.${i}.tag`, `Card ${i + 1} tag`, card.tag, (v) =>
                    updateHeroCard(slideIndex, i, { tag: v }),
                  )}
                />
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {cms ? (
        <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2">
          {safeSlides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                i === index ? 'bg-white text-kado-dark' : 'bg-black/50 text-white border border-white/30'
              }`}
            >
              Slide {i + 1}
            </button>
          ))}
        </div>
      ) : null}

      <div className="absolute bottom-5 left-5 right-5 z-20 flex flex-row items-end justify-between lg:hidden">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {current.cards.slice(0, 2).map((card) => (
              <img
                key={card.id}
                src={card.src}
                alt={card.alt}
                className="h-14 w-10 rounded-md border border-white/30 object-cover shadow-lg"
                loading="lazy"
              />
            ))}
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-kado-cream/70 max-w-[150px] leading-tight drop-shadow-md">
            {c?.imageCredit ?? 'Images: Kado Kohi Social + InsideMarikina'}
          </p>
        </div>

        <div className="flex items-center gap-2 pb-1">
          <button
            type="button"
            onClick={() => setIndex((n) => (n - 1 + safeSlides.length) % safeSlides.length)}
            className="rounded-full border border-white/25 bg-black/40 backdrop-blur-sm p-2.5 text-white transition-colors hover:border-white/60 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((n) => (n + 1) % safeSlides.length)}
            className="rounded-full border border-white/25 bg-black/40 backdrop-blur-sm p-2.5 text-white transition-colors hover:border-white/60 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="hidden lg:flex absolute bottom-6 right-6 z-20 items-center gap-2">
        <button
          type="button"
          onClick={() => setIndex((n) => (n - 1 + safeSlides.length) % safeSlides.length)}
          className="rounded-full border border-white/25 bg-black/40 backdrop-blur-sm p-2.5 text-white transition-colors hover:border-white/60 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setIndex((n) => (n + 1) % safeSlides.length)}
          className="rounded-full border border-white/25 bg-black/40 backdrop-blur-sm p-2.5 text-white transition-colors hover:border-white/60 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
