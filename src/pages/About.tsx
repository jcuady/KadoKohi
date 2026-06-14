import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ArrowRight, CalendarHeart, Coffee, Heart, MapPin, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import ResilientImage from '../components/ui/ResilientImage';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import { LOGO } from '../lib/brandTokens';
import {
  ABOUT_COMMITMENT,
  ABOUT_CTA,
  ABOUT_HERO,
  ABOUT_ORIGINS,
  ABOUT_SPACE,
  ABOUT_TIMELINE,
  ABOUT_VALUES,
} from '../content/aboutPage';
import { cn } from '../lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-8%' },
  transition: { duration: 0.55, ease: 'easeOut' as const },
};

const valueIcons = [Coffee, Heart, Users, Sparkles] as const;

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="kado-label mb-3 text-kado-red">{children}</p>;
}

function PlaceholderFrame({
  src,
  fallbackSrc,
  alt,
  className,
}: {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.25rem] border border-kado-dark/10 bg-kado-cream shadow-[0_20px_50px_rgba(25,25,25,0.08)]',
        className,
      )}
    >
      <ResilientImage
        src={src}
        fallbackSrc={fallbackSrc}
        alt={alt}
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-kado-dark/25 via-transparent to-transparent" />
    </div>
  );
}

export default function About() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-kado-cream text-kado-dark">
      {/* Hero — brand red, stacked wordmark, soft opening */}
      <section className="relative overflow-hidden border-b border-white/10 bg-kado-red pt-28 pb-16 text-kado-cream md:pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 top-16 font-display text-[clamp(8rem,28vw,16rem)] font-black leading-none text-white/[0.06] select-none"
        >
          角
        </div>
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <motion.p {...fadeUp} className="kado-label mb-5 text-kado-cream/80">
            {ABOUT_HERO.eyebrow}
          </motion.p>
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
            <img
              src={LOGO.stackedWordmark}
              alt="Kado Kohi"
              decoding="async"
              className="mx-auto h-auto max-h-[7.5rem] w-auto max-w-[min(320px,88vw)] object-contain brightness-0 invert md:max-h-36"
            />
          </motion.div>
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="mx-auto mt-8 inline-flex flex-col items-center gap-2 sm:flex-row sm:gap-3"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-kado-cream/35 bg-kado-cream/15 px-4 py-2 kado-label text-kado-cream">
              <CalendarHeart className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {ABOUT_HERO.softOpeningLabel}
            </span>
            <span className="kado-body font-semibold text-kado-cream">{ABOUT_HERO.softOpeningDate}</span>
          </motion.div>
          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="kado-body mx-auto mt-6 max-w-2xl text-kado-cream/85"
          >
            {ABOUT_HERO.tagline}
          </motion.p>
          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="kado-body-sm mt-4 inline-flex items-center justify-center gap-1.5 text-kado-cream/65"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {ABOUT_HERO.locationNote}
          </motion.p>
        </div>
      </section>

      {/* Origins */}
      <section className="border-b border-kado-dark/8 px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div {...fadeUp}>
            <PlaceholderFrame
              src={ABOUT_ORIGINS.imageSrc}
              fallbackSrc={ABOUT_ORIGINS.imageFallback}
              alt={ABOUT_ORIGINS.imageAlt}
              className="aspect-[4/5] max-h-[520px] lg:max-h-none"
            />
          </motion.div>
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
            <SectionEyebrow>{ABOUT_ORIGINS.eyebrow}</SectionEyebrow>
            <h2 className="kado-h1 mb-5 text-kado-dark">{ABOUT_ORIGINS.title}</h2>
            <p className="kado-body mb-6 font-semibold text-kado-dark/90">{ABOUT_ORIGINS.lead}</p>
            <div className="space-y-4">
              {ABOUT_ORIGINS.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="kado-body text-kado-dark/70">
                  {p}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="border-b border-kado-dark/8 bg-white px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
            <SectionEyebrow>{ABOUT_COMMITMENT.eyebrow}</SectionEyebrow>
            <h2 className="kado-h2 mb-4 text-kado-dark">{ABOUT_COMMITMENT.title}</h2>
            <p className="kado-body text-kado-dark/70">{ABOUT_COMMITMENT.intro}</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {ABOUT_COMMITMENT.pillars.map((pillar, i) => (
              <motion.article
                key={pillar.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="relative overflow-hidden rounded-[1.25rem] border border-kado-dark/8 bg-kado-cream p-8"
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-kado-red" aria-hidden />
                <p className="kado-label mb-3 text-kado-dark/45">0{i + 1}</p>
                <h3 className="kado-h3 mb-3 text-kado-dark">{pillar.title}</h3>
                <p className="kado-body-sm text-kado-dark/70">{pillar.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="border-b border-kado-dark/8 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mx-auto mb-12 max-w-2xl text-center md:mb-14">
            <SectionEyebrow>{ABOUT_VALUES.eyebrow}</SectionEyebrow>
            <h2 className="kado-h2 mb-4 text-kado-dark">{ABOUT_VALUES.title}</h2>
            <p className="kado-body text-kado-dark/70">{ABOUT_VALUES.intro}</p>
          </motion.div>
          <div className="grid gap-5 sm:grid-cols-2">
            {ABOUT_VALUES.items.map((item, i) => {
              const Icon = valueIcons[i] ?? Coffee;
              return (
                <motion.div
                  key={item.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                  className="group rounded-[1.25rem] border border-kado-dark/8 bg-white p-7 transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(25,25,25,0.07)]"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-kado-cream text-kado-red transition-colors group-hover:bg-kado-red group-hover:text-kado-cream">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="kado-h3 mb-2 text-kado-dark">{item.title}</h3>
                  <p className="kado-body-sm text-kado-dark/70">{item.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-b border-kado-dark/8 bg-white px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <motion.div {...fadeUp} className="mb-12 border-b border-kado-dark/10 pb-10 md:mb-14">
            <SectionEyebrow>{ABOUT_TIMELINE.eyebrow}</SectionEyebrow>
            <h2 className="kado-h2 text-kado-dark">{ABOUT_TIMELINE.title}</h2>
          </motion.div>
          <ol className="relative space-y-0">
            <div className="absolute bottom-4 left-[1.125rem] top-4 w-px bg-kado-dark/12 md:left-[1.375rem]" aria-hidden />
            {ABOUT_TIMELINE.milestones.map((item, i) => {
              const isHighlight = 'highlight' in item && item.highlight === true;
              return (
              <motion.li
                key={`${item.date}-${item.title}`}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                className="relative flex gap-5 pb-10 last:pb-0 md:gap-8"
              >
                <div
                  className={cn(
                    'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 md:h-11 md:w-11',
                    isHighlight
                      ? 'border-kado-red bg-kado-red text-kado-cream shadow-md shadow-kado-red/25'
                      : 'border-kado-dark/15 bg-kado-cream text-kado-dark',
                  )}
                >
                  <span className="font-display text-[10px] font-bold md:text-xs">
                    {isHighlight ? '★' : '·'}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="kado-label mb-1 text-kado-red">{item.date}</p>
                  <h3 className="kado-h3 mb-2 text-kado-dark">{item.title}</h3>
                  <p className="kado-body-sm text-kado-dark/70">{item.body}</p>
                </div>
              </motion.li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* The Space */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div {...fadeUp} className="order-2 lg:order-1">
            <SectionEyebrow>{ABOUT_SPACE.eyebrow}</SectionEyebrow>
            <h2 className="kado-h2 mb-4 text-kado-dark">{ABOUT_SPACE.title}</h2>
            <p className="kado-body text-kado-dark/70">{ABOUT_SPACE.body}</p>
          </motion.div>
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }} className="order-1 lg:order-2">
            <PlaceholderFrame
              src={ABOUT_SPACE.imageSrc}
              fallbackSrc={ABOUT_SPACE.imageFallback}
              alt={ABOUT_SPACE.imageAlt}
              className="aspect-[16/11]"
            />
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-kado-dark/8 bg-kado-dark px-6 py-14 text-kado-cream md:py-16">
        <motion.div
          {...fadeUp}
          className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left"
        >
          <div>
            <h2 className="kado-h2 mb-2 text-kado-cream">{ABOUT_CTA.title}</h2>
            <p className="kado-body max-w-md text-kado-cream/75">{ABOUT_CTA.body}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              to={ABOUT_CTA.primaryTo}
              className="kado-label inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-kado-red px-7 py-3 text-kado-cream transition-colors hover:bg-kado-red-hover"
            >
              <MapPin className="h-4 w-4" aria-hidden />
              {ABOUT_CTA.primaryLabel}
            </Link>
            <Link
              to={ABOUT_CTA.secondaryTo}
              className="kado-label inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-kado-cream/35 px-7 py-3 text-kado-cream transition-colors hover:bg-kado-cream/10"
            >
              {ABOUT_CTA.secondaryLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </motion.div>
      </section>

      <PageSeoBlurb />
    </div>
  );
}
