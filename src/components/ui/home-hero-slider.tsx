import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { HomeHeroSlide } from '../../data/homeHeroMedia';
import type { HeroChrome } from '../../store/landingContentStore';

interface Props {
  slides: HomeHeroSlide[];
  chrome?: HeroChrome;
}

export default function HomeHeroSlider({ slides, chrome }: Props) {
  const safeSlides = useMemo(() => slides, [slides]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (safeSlides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((n) => (n + 1) % safeSlides.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [safeSlides.length]);

  useEffect(() => {
    setIndex(0);
  }, [safeSlides.length]);

  if (safeSlides.length === 0) return null;

  const current = safeSlides[index] ?? safeSlides[0];
  const c = chrome;

  return (
    <section className="relative h-[calc(100svh-3.5rem)] md:h-[calc(100svh-3.75rem)] min-h-[34rem] w-full overflow-hidden border-b border-kado-dark/10">
      <AnimatePresence mode="wait">
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
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/88 via-[#141414]/60 to-[#141414]/38" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/18" />

      <div className="relative z-10 grid h-full grid-cols-1 items-end gap-6 md:gap-8 px-5 pb-28 pt-16 sm:px-8 sm:pb-32 md:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.8fr)] md:px-12 md:pb-12 lg:px-20">
        <div className="max-w-3xl">
          <p className="mb-3 text-[10px] sm:text-xs font-bold uppercase tracking-[0.24em] text-kado-cream/85 drop-shadow-md">
            {c?.locationBadge ?? 'Kado Kohi · Marikina'}
          </p>
          <h1 className="font-display text-[clamp(2.5rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.015em] text-white drop-shadow-lg">
            {current.title}
          </h1>
          <p className="mt-4 sm:mt-5 max-w-2xl text-sm sm:text-base md:text-lg font-medium leading-relaxed text-kado-cream/90 drop-shadow-md">
            {current.subtitle}
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              to={c?.primaryCtaPath ?? '/menu'}
              className="inline-flex min-h-[48px] sm:min-h-[52px] w-full sm:w-auto items-center justify-center gap-2 rounded-sm bg-kado-red px-8 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] text-white transition-all hover:bg-[#7d1115] shadow-lg shadow-kado-red/30"
            >
              {c?.primaryCtaLabel ?? 'Explore Menu'} <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
            <Link
              to={c?.secondaryCtaPath ?? '/merch'}
              className="inline-flex min-h-[48px] sm:min-h-[52px] w-full sm:w-auto items-center justify-center rounded-sm border border-white/40 bg-black/20 backdrop-blur-sm px-8 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] text-white transition-all hover:border-white/80 hover:bg-white/10"
            >
              {c?.secondaryCtaLabel ?? 'Shop Merch'}
            </Link>
          </div>
          
          <div className="mt-8 hidden md:block">
            <p className="inline-flex rounded-full border border-white/20 bg-black/35 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-kado-cream/85 backdrop-blur-md">
              {c?.imageCredit ?? 'Images: Kado Kohi Social + InsideMarikina'}
            </p>
          </div>
        </div>

        <div className="hidden md:grid grid-cols-2 gap-3 justify-self-end w-full max-w-[22rem] lg:max-w-sm self-end">
          {current.cards.slice(0, 4).map((card, i) => (
            <motion.article
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
              className="overflow-hidden rounded-xl border border-white/15 bg-black/35 backdrop-blur-sm shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
            >
              <div className="aspect-[3/4] w-full overflow-hidden">
                <img
                  src={card.src}
                  alt={card.alt}
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
              </div>
              <div className="flex items-center justify-between px-2.5 py-2 border-t border-white/10">
                <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-kado-cream/85">{card.title}</p>
                <span className="shrink-0 ml-1 text-[8px] font-bold uppercase tracking-wider text-kado-red/80 bg-kado-red/15 px-1.5 py-0.5 rounded-sm">{card.tag}</span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <div className="absolute bottom-5 left-5 right-5 z-20 flex flex-row items-end justify-between md:hidden">
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
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-kado-cream/70 max-w-[150px] leading-tight drop-shadow-md">
            {c?.imageCredit ?? 'Images: Kado Kohi Social + InsideMarikina'}
          </p>
        </div>

        <div className="flex items-center gap-2 pb-1">
          <button
            type="button"
            onClick={() => setIndex((n) => (n - 1 + safeSlides.length) % safeSlides.length)}
            className="rounded-full border border-white/25 bg-black/40 backdrop-blur-sm p-2.5 text-white transition-colors hover:border-white/60 shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((n) => (n + 1) % safeSlides.length)}
            className="rounded-full border border-white/25 bg-black/40 backdrop-blur-sm p-2.5 text-white transition-colors hover:border-white/60 shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="hidden md:flex absolute bottom-6 right-6 z-20 items-center gap-2">
        <button
          type="button"
          onClick={() => setIndex((n) => (n - 1 + safeSlides.length) % safeSlides.length)}
          className="rounded-full border border-white/25 bg-black/40 backdrop-blur-sm p-2.5 text-white transition-colors hover:border-white/60 shadow-lg"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setIndex((n) => (n + 1) % safeSlides.length)}
          className="rounded-full border border-white/25 bg-black/40 backdrop-blur-sm p-2.5 text-white transition-colors hover:border-white/60 shadow-lg"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
