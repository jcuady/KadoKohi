/**
 * Homepage hero — redesign per UiUX.md 11-element framework + BRANDING doc.
 *
 * Aesthetic direction: Editorial & Magazine × Japanese campaign collage
 *  - Display: Zalando Sans Expanded (fixed by brand), body: M PLUS 1
 *  - Palette: kado-cream dominant, kado-red accent, kado-dark base
 *  - Motion: one orchestrated staggered entrance (badge → H1 → slide copy →
 *    CTAs → social proof), scroll-free; respects prefers-reduced-motion
 *  - Spatial: asymmetric copy/collage grid, oversized 角 kanji overlay
 *  - Height: fills viewport below nav (100dvh − nav); grows if content needs more
 */
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { HomeHeroSlide } from '../../data/homeHeroMedia';
import { useLandingContentStore, type HeroChrome } from '../../store/landingContentStore';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { KADO_GOOGLE_LISTING } from '../../content/kadoGoogleReviews';
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
  const skipEntrance = prefersReducedMotion || cms;

  /** Orchestrated entrance — staggered reveal per UiUX.md motion strategy. */
  const reveal = (delay: number) =>
    skipEntrance
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

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
    <section
      id="landing-hero"
      aria-labelledby="hero-main-headline"
      className="landing-hero relative w-full overflow-hidden bg-kado-dark"
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
            className="absolute inset-0 h-full w-full object-cover object-[center_35%] lg:object-center"
            initial={{ opacity: 0.32, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.2, scale: 1.02 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-kado-dark/80 via-kado-dark/55 to-kado-dark/88 lg:bg-gradient-to-r lg:from-kado-dark/88 lg:via-kado-dark/60 lg:to-kado-dark/38" />
      <div className="absolute inset-0 bg-gradient-to-t from-kado-dark/65 via-transparent to-kado-dark/25 lg:from-kado-dark/50 lg:to-kado-dark/18" />

      {/* Brand kanji overlay — campaign collage layer */}
      <div
        aria-hidden
        className="kado-kanji-watermark -right-4 top-8 text-[clamp(9rem,26vw,20rem)] text-white/[0.06] sm:right-2 lg:right-10 lg:top-4"
      >
        角
      </div>

      <div className="landing-hero-inner relative z-10 mx-auto w-full max-w-[1400px] px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-8 lg:gap-10 lg:px-12 lg:py-8 xl:px-16">
        <div className="landing-hero-copy min-w-0 max-w-3xl">
          <motion.div {...reveal(0)}>
            <CmsStyledText
              value={c?.locationBadge ?? 'Kado Kohi · Marikina'}
              as="p"
              className="kado-label mb-2 inline-flex rounded-full border border-kado-red/50 bg-kado-red/20 px-3 py-1.5 backdrop-blur-sm drop-shadow-md sm:mb-3"
              defaultColorClass="text-kado-cream/95"
              {...textProps('hero.chrome.locationBadge', 'Location badge', c?.locationBadge ?? 'Kado Kohi · Marikina', (v) =>
                updateHeroChrome({ locationBadge: v }),
              )}
            />
          </motion.div>
          <motion.div id="hero-main-headline" {...reveal(0.08)}>
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
          </motion.div>
          <motion.div aria-live="polite" aria-atomic="true" {...reveal(0.16)}>
            <CmsStyledText
              value={current.title}
              as="h2"
              className="kado-h2 mt-2 drop-shadow-md sm:mt-3"
              defaultColorClass="text-kado-cream/95"
              {...textProps(`hero.slide.${slideIndex}.title`, 'Slide title', current.title, (v) =>
                updateHeroSlide(slideIndex, { title: v }),
              )}
            />
            <CmsStyledText
              value={current.subtitle}
              as="p"
              className="mt-2 max-w-2xl text-sm leading-snug drop-shadow-md sm:mt-3 sm:text-base sm:leading-relaxed md:text-base"
              defaultSizeClass="kado-body"
              defaultColorClass="text-kado-cream/90"
              {...textProps(`hero.slide.${slideIndex}.subtitle`, 'Slide subtitle', current.subtitle, (v) =>
                updateHeroSlide(slideIndex, { subtitle: v }),
              )}
            />
          </motion.div>

          <motion.div
            {...reveal(0.24)}
            className="mt-4 flex flex-col items-stretch gap-2.5 sm:mt-6 sm:flex-row sm:items-center sm:gap-3 lg:mt-8"
          >
            <Link
              to={c?.primaryCtaPath ?? '/menu'}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-kado-red px-6 py-3 kado-label text-kado-cream shadow-lg shadow-kado-red/30 transition-all hover:scale-[1.03] hover:bg-kado-red-hover hover:shadow-xl hover:shadow-kado-red/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark sm:min-h-[52px] sm:w-auto sm:px-8 sm:tracking-[0.15em]"
            >
              <CmsStyledText
                value={c?.primaryCtaLabel ?? 'Explore Menu'}
                as="span"
                {...textProps('hero.chrome.primaryCtaLabel', 'Primary CTA', c?.primaryCtaLabel ?? 'Explore Menu', (v) =>
                  updateHeroChrome({ primaryCtaLabel: v }),
                )}
              />{' '}
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to={c?.secondaryCtaPath ?? '/merch'}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-kado-cream/40 bg-kado-dark/20 px-6 py-3 kado-label text-kado-cream backdrop-blur-sm transition-all hover:border-kado-cream/80 hover:bg-kado-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark sm:min-h-[52px] sm:w-auto sm:px-8 sm:tracking-[0.15em]"
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
          </motion.div>

          {/* Social proof — Google rating in hero (UiUX.md element 5) */}
          <motion.a
            {...reveal(0.32)}
            href={KADO_GOOGLE_LISTING.reviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-[44px] flex-wrap items-center gap-x-2.5 gap-y-1 rounded-full border border-white/15 bg-black/30 px-4 py-2 backdrop-blur-sm transition-colors hover:border-kado-cream/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark sm:mt-6"
            aria-label={`Rated ${KADO_GOOGLE_LISTING.rating} stars from ${KADO_GOOGLE_LISTING.reviewCount} Google reviews`}
          >
            <span className="flex items-center gap-0.5" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-kado-cream text-kado-cream" />
              ))}
            </span>
            <span className="kado-h3 text-kado-cream">{KADO_GOOGLE_LISTING.rating}</span>
            <span className="kado-label text-kado-cream/70">
              {KADO_GOOGLE_LISTING.reviewCount} Google reviews
            </span>
          </motion.a>

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

        <div className="landing-hero-mobile-bar flex shrink-0 items-end justify-between gap-3 sm:gap-4 lg:hidden">
          <div className="min-w-0 flex flex-col gap-2">
            <div className="flex gap-2">
              {current.cards.slice(0, 2).map((card) => (
                <img
                  key={card.id}
                  src={card.src}
                  alt={card.alt}
                  className="h-12 w-9 rounded-md border border-white/30 object-cover shadow-lg sm:h-14 sm:w-10"
                  loading="lazy"
                />
              ))}
            </div>
            <p className="max-w-[9.5rem] text-[9px] font-semibold uppercase leading-tight tracking-[0.1em] text-kado-cream/70 drop-shadow-md sm:max-w-[10.5rem] sm:text-[10px] sm:tracking-[0.12em]">
              {c?.imageCredit ?? 'Images: Kado Kohi Social + InsideMarikina'}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIndex((n) => (n - 1 + safeSlides.length) % safeSlides.length)}
              className="rounded-full border border-white/25 bg-black/40 p-2.5 text-white shadow-lg backdrop-blur-sm transition-colors hover:border-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((n) => (n + 1) % safeSlides.length)}
              className="rounded-full border border-white/25 bg-black/40 p-2.5 text-white shadow-lg backdrop-blur-sm transition-colors hover:border-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="landing-hero-cards hidden min-w-0 w-full max-w-[18rem] grid-cols-2 gap-2.5 justify-self-end self-end lg:grid xl:max-w-[22rem] xl:gap-3">
          {current.cards.slice(0, 4).map((card, i) => (
            <motion.article
              key={card.id}
              initial={skipEntrance ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
              className="overflow-hidden rounded-xl border border-white/15 bg-black/35 shadow-[0_8px_20px_rgba(0,0,0,0.4)] backdrop-blur-sm"
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
                    className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="flex min-w-0 items-start justify-between gap-1.5 border-t border-white/10 px-2 py-2">
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
                  className="ml-1 shrink-0 rounded-sm bg-kado-red/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
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
                i === index ? 'bg-white text-kado-dark' : 'border border-white/30 bg-black/50 text-white'
              }`}
            >
              Slide {i + 1}
            </button>
          ))}
        </div>
      ) : null}

      <div className="absolute bottom-6 right-6 z-20 hidden items-center gap-2 lg:flex">
        <button
          type="button"
          onClick={() => setIndex((n) => (n - 1 + safeSlides.length) % safeSlides.length)}
          className="rounded-full border border-white/25 bg-black/40 p-2.5 text-white shadow-lg backdrop-blur-sm transition-colors hover:border-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setIndex((n) => (n + 1) % safeSlides.length)}
          className="rounded-full border border-white/25 bg-black/40 p-2.5 text-white shadow-lg backdrop-blur-sm transition-colors hover:border-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
