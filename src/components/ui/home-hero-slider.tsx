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

      <div className="relative z-10 grid h-full grid-cols-1 items-end gap-8 px-4 pb-8 pt-10 sm:px-6 md:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.8fr)] md:px-12 md:pb-12 lg:px-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-kado-cream/75">
            {c?.locationBadge ?? 'Kado Kohi · Marikina'}
          </p>
          <h1 className="font-display text-[clamp(2.2rem,7vw,5.2rem)] font-bold leading-[0.94] tracking-[-0.015em] text-white">
            {current.title}
          </h1>
          <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-kado-cream/88 sm:text-base md:text-lg">
            {current.subtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to={c?.primaryCtaPath ?? '/menu'}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-sm bg-kado-red px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#7d1115]"
            >
              {c?.primaryCtaLabel ?? 'Explore Menu'} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={c?.secondaryCtaPath ?? '/merch'}
              className="inline-flex min-h-[46px] items-center justify-center rounded-sm border border-white/35 bg-black/20 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white/95 transition-colors hover:border-white/70 hover:text-white"
            >
              {c?.secondaryCtaLabel ?? 'Shop Merch'}
            </Link>
          </div>

          <p className="mt-5 inline-flex rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-kado-cream/85">
            {c?.imageCredit ?? 'Images: Kado Kohi Social + InsideMarikina'}
          </p>
        </div>

        <div className="hidden md:grid grid-cols-2 gap-3 justify-self-end w-full max-w-md">
          {current.cards.slice(0, 3).map((card) => (
            <article
              key={card.id}
              className="overflow-hidden rounded-xl border border-white/20 bg-black/30 shadow-[0_10px_25px_rgba(0,0,0,0.35)]"
            >
              <div className="aspect-[4/5] w-full overflow-hidden">
                <img src={card.src} alt={card.alt} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="flex items-center justify-between px-2.5 py-2">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-kado-cream/90">{card.title}</p>
                <span className="text-[9px] font-medium text-kado-cream/65">{card.tag}</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={() => setIndex((n) => (n - 1 + safeSlides.length) % safeSlides.length)}
          className="rounded-full border border-white/25 bg-black/40 p-2 text-white transition-colors hover:border-white/60"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setIndex((n) => (n + 1) % safeSlides.length)}
          className="rounded-full border border-white/25 bg-black/40 p-2 text-white transition-colors hover:border-white/60"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-20 flex gap-1.5 md:hidden">
        {current.cards.slice(0, 2).map((card) => (
          <img
            key={card.id}
            src={card.src}
            alt={card.alt}
            className="h-16 w-12 rounded-md border border-white/30 object-cover shadow-md"
            loading="lazy"
          />
        ))}
      </div>
    </section>
  );
}
