/**
 * Homepage hero — Figma cream full-bleed Heroes (desktop) + Heroes/Mobile portraits (<lg).
 *
 * Aesthetic: campaign banner art carries product + brand; live UI is left copy,
 * CTAs, and trust pills over a soft left vignette for contrast.
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
import { toWebpSrc } from '../../lib/toWebpSrc';

/** Match Tailwind `lg` — portrait Heroes/Mobile below this. */
const MOBILE_HERO_MQ = '(max-width: 1023px)';

interface Props {
  slides: HomeHeroSlide[];
  chrome?: HeroChrome;
  cmsEditMode?: boolean;
}

function rasterFallback(src: string): string {
  return src.replace(/\.webp$/i, '.png');
}

function upsertHeroPreload(dataAttr: string, href: string, media: string) {
  let link = document.querySelector<HTMLLinkElement>(`link[${dataAttr}]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.type = 'image/webp';
    link.setAttribute(dataAttr, '1');
    document.head.appendChild(link);
  }
  link.href = href;
  link.media = media;
  link.setAttribute('fetchpriority', 'high');
}

export default function HomeHeroSlider({ slides, chrome, cmsEditMode }: Props) {
  const safeSlides = useMemo(() => slides, [slides]);
  const [index, setIndex] = useState(0);
  const updateHeroChrome = useLandingContentStore((s) => s.updateHeroChrome);
  const updateHeroSlide = useLandingContentStore((s) => s.updateHeroSlide);
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

  // LCP: index.html already preloads seed espresso. Only re-hint when CMS swaps the first slide.
  useEffect(() => {
    const first = safeSlides[0];
    if (!first) return;
    const mobileHref = toWebpSrc(first.imageMobile) || first.imageMobile;
    const desktopHref = toWebpSrc(first.image) || first.image;
    const seedMobile = '/heroes/mobile/espresso.webp';
    const seedDesktop = '/heroes/espresso.webp';
    if (mobileHref === seedMobile && desktopHref === seedDesktop) return;
    upsertHeroPreload('data-kado-lcp-hero-mobile', mobileHref, MOBILE_HERO_MQ);
    upsertHeroPreload('data-kado-lcp-hero-desktop', desktopHref, '(min-width: 1024px)');
  }, [safeSlides]);

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

  const desktopWebp = toWebpSrc(current.image) || current.image;
  const desktopPng = rasterFallback(current.image);
  const mobileWebp = toWebpSrc(current.imageMobile) || current.imageMobile;
  const mobilePng = rasterFallback(current.imageMobile);

  return (
    <section
      id="landing-hero"
      aria-labelledby="hero-main-headline"
      className="landing-hero relative w-full overflow-hidden bg-[#E8D9C4]"
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
          <motion.div
            key={current.id}
            className="absolute inset-0"
            // ponytail: never fade the LCP image in — PSI mobile charged ~1.85s render delay
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0.35, scale: 1.02 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: 'easeOut' }}
          >
            <picture className="absolute inset-0 block h-full w-full">
              <source media={MOBILE_HERO_MQ} type="image/webp" srcSet={mobileWebp} />
              <source media={MOBILE_HERO_MQ} srcSet={mobilePng} />
              <source type="image/webp" srcSet={desktopWebp} />
              <img
                src={desktopPng}
                alt={current.imageAlt}
                className="landing-hero-media absolute inset-0 h-full w-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority={index === 0 ? 'high' : 'auto'}
                width={1920}
                height={1080}
                sizes="100vw"
                onError={(e) => {
                  const el = e.currentTarget;
                  if (el.src !== desktopPng && desktopPng !== desktopWebp) {
                    el.src = desktopPng;
                    return;
                  }
                  if (el.src !== current.image) el.src = current.image;
                }}
              />
            </picture>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left vignette only — keep Figma right-side product art readable */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-kado-dark/78 via-kado-dark/42 to-transparent lg:from-kado-dark/72 lg:via-kado-dark/28 lg:to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-kado-dark/45 to-transparent lg:h-1/4 lg:from-kado-dark/25"
      />

      <div className="landing-hero-inner relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-center px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-8 lg:px-12 lg:py-8 xl:px-16">
        <div className="landing-hero-copy min-w-0 max-w-xl lg:max-w-2xl">
          <motion.div {...reveal(0)}>
            <CmsStyledText
              value={c?.locationBadge ?? 'Kado Coffee — Marikina'}
              as="p"
              className="kado-label mb-2 inline-flex rounded-md border border-kado-red/55 bg-kado-red/90 px-3 py-1.5 text-kado-cream shadow-md sm:mb-3"
              defaultColorClass="text-kado-cream"
              {...textProps('hero.chrome.locationBadge', 'Location badge', c?.locationBadge ?? 'Kado Coffee — Marikina', (v) =>
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
              className="mt-2 max-w-xl text-sm leading-snug drop-shadow-md sm:mt-3 sm:text-base sm:leading-relaxed md:text-base"
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
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-kado-cream/55 bg-kado-dark/25 px-6 py-3 kado-label text-kado-cream backdrop-blur-sm transition-all hover:border-kado-cream hover:bg-kado-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark sm:min-h-[52px] sm:w-auto sm:px-8 sm:tracking-[0.15em]"
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

          <motion.div
            {...reveal(0.32)}
            className="mt-4 flex flex-col items-start gap-2 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5"
          >
            <a
              href={KADO_GOOGLE_LISTING.reviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] flex-wrap items-center gap-x-2.5 gap-y-1 rounded-full border border-white/20 bg-black/40 px-4 py-2 backdrop-blur-sm transition-colors hover:border-kado-cream/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark"
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
            </a>
            <CmsStyledText
              value={c?.imageCredit ?? 'Images: Kado Kohi Social + InsideMarikina'}
              as="p"
              className="inline-flex rounded-full border border-white/20 bg-black/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur-md"
              defaultColorClass="text-kado-cream/85"
              {...textProps(
                'hero.chrome.imageCredit',
                'Image credit',
                c?.imageCredit ?? 'Images: Kado Kohi Social + InsideMarikina',
                (v) => updateHeroChrome({ imageCredit: v }),
              )}
            />
          </motion.div>
        </div>

        <div className="landing-hero-mobile-bar mt-auto flex shrink-0 items-center justify-end gap-2 pt-6 lg:hidden">
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
