import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Facebook, Instagram } from 'lucide-react';
import type { Variants } from 'motion/react';
import { TimelineContent } from '@/components/ui/timeline-animation';
import AccentHeadline from '@/components/ui/AccentHeadline';
import ResilientImage from '@/components/ui/ResilientImage';
import { SEO_SOCIAL } from '@/content/seo';
import { KADO_GOOGLE_LISTING } from '@/content/kadoGoogleReviews';
import TikTokIcon from '@/components/icons/TikTokIcon';
import type { BrandStoryCopy } from '@/store/landingContentStore';

const revealVariants: Variants = {
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { delay: i * 0.22, duration: 0.6 },
  }),
  hidden: { filter: 'blur(10px)', y: 28, opacity: 0 },
};

const textVariants: Variants = {
  visible: (i: number) => ({
    filter: 'blur(0px)',
    opacity: 1,
    transition: { delay: i * 0.14, duration: 0.55 },
  }),
  hidden: { filter: 'blur(8px)', opacity: 0 },
};

const SOCIAL_LINKS = [
  {
    key: 'instagram',
    href: SEO_SOCIAL.instagram,
    label: 'Kado Coffee on Instagram — @kadocoffeeph',
    handle: '@kadocoffeeph',
    Icon: Instagram,
  },
  {
    key: 'tiktok',
    href: SEO_SOCIAL.tiktok,
    label: 'Kado Coffee on TikTok — @kadokohiph',
    handle: '@kadokohiph',
    Icon: TikTokIcon,
  },
  {
    key: 'facebook',
    href: SEO_SOCIAL.facebook,
    label: 'Kado Coffee on Facebook — KadoKohi',
    handle: 'KadoKohi',
    Icon: Facebook,
  },
] as const;

const linkClass = 'font-semibold text-kado-red underline-offset-4 hover:underline';

const pillarCard =
  'group relative flex min-h-[220px] flex-col overflow-hidden rounded-[1.25rem] border border-kado-dark/8 bg-kado-dark sm:min-h-[260px] lg:min-h-[300px] [@media(orientation:landscape)_and_(max-height:30rem)]:min-h-[180px]';

type Props = { copy: BrandStoryCopy };

/**
 * Homepage brand story — editorial pillars + crawlable local SEO copy.
 */
export default function AboutSection2({ copy }: Props) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { rating, reviewCount } = KADO_GOOGLE_LISTING;

  return (
    <section
      aria-labelledby="home-brand-story-heading"
      className="customer-menu-page border-t border-kado-dark/6 bg-kado-cream px-[max(1rem,env(safe-area-inset-left))] py-12 sm:px-6 sm:py-16 md:px-12 md:py-20 lg:px-24 lg:py-24 [@media(orientation:landscape)_and_(max-height:30rem)]:py-8"
    >
      <div className="mx-auto max-w-6xl min-w-0 pr-[max(0px,env(safe-area-inset-right))]" ref={heroRef}>
        <TimelineContent
          as="p"
          animationNum={0}
          timelineRef={heroRef}
          customVariants={textVariants}
          className="mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-kado-red sm:mb-6"
        >
          {copy.badge}
        </TimelineContent>

        <TimelineContent
          as="h2"
          id="home-brand-story-heading"
          animationNum={1}
          timelineRef={heroRef}
          customVariants={revealVariants}
          className="max-w-4xl font-display text-[clamp(1.5rem,4.5vw,2.75rem)] font-bold leading-[1.16] tracking-tight text-kado-dark [@media(orientation:landscape)_and_(max-height:30rem)]:text-[clamp(1.35rem,4vw,2rem)]"
        >
          <AccentHeadline copy={copy.headline} />
        </TimelineContent>

        <TimelineContent
          as="p"
          animationNum={2}
          timelineRef={heroRef}
          customVariants={textVariants}
          className="mt-6 max-w-2xl font-sans text-[0.9375rem] leading-[1.75] text-kado-dark/70 sm:mt-8 sm:text-base sm:leading-[1.8]"
        >
          {copy.intro}
        </TimelineContent>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 [@media(orientation:landscape)_and_(max-height:30rem)]:grid-cols-3 [@media(orientation:landscape)_and_(max-height:30rem)]:gap-3">
          {copy.pillars.map((pillar, i) => (
            <TimelineContent
              key={`${pillar.title}-${pillar.subtitle}`}
              as="article"
              animationNum={3 + i}
              timelineRef={heroRef}
              customVariants={revealVariants}
              className={pillarCard}
            >
              <ResilientImage
                src={pillar.imageUrl}
                alt={pillar.imageAlt}
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-kado-dark via-kado-dark/50 to-kado-dark/10" />
              <div className="relative mt-auto p-4 sm:p-5 lg:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-kado-cream/60">
                  {pillar.subtitle}
                </p>
                <h3 className="mt-1 font-display text-lg font-bold text-kado-cream sm:text-xl lg:text-2xl">
                  {pillar.title}
                </h3>
                {pillar.body ? (
                  <p className="mt-2 text-xs leading-relaxed text-kado-cream/80 sm:text-sm">{pillar.body}</p>
                ) : null}
              </div>
            </TimelineContent>
          ))}
        </div>

        <TimelineContent
          as="p"
          animationNum={6}
          timelineRef={heroRef}
          customVariants={textVariants}
          className="mt-8 max-w-2xl font-sans text-sm leading-relaxed text-kado-dark/65 sm:mt-10 sm:text-[0.9375rem] sm:leading-[1.75]"
        >
          Rated {rating}★ on Google ({reviewCount} reviews).{' '}
          <Link to="/menu" className={linkClass}>
            See the menu
          </Link>
          {' · '}
          <Link to="/branches" className={linkClass}>
            Visit us
          </Link>
          {' · '}
          <Link to="/events" className={linkClass}>
            Events
          </Link>
        </TimelineContent>

        <div className="mt-8 flex flex-col gap-6 sm:mt-10 sm:flex-row sm:items-end sm:justify-between">
          <TimelineContent as="div" animationNum={7} timelineRef={heroRef} customVariants={textVariants}>
            <p className="font-sans text-sm font-medium text-kado-dark/60 sm:text-base">{copy.footerTagline1}</p>
            <p className="font-display text-lg font-bold uppercase tracking-wide text-kado-red sm:text-xl">
              {copy.footerTagline2}
            </p>
          </TimelineContent>

          <TimelineContent as="div" animationNum={8} timelineRef={heroRef} customVariants={textVariants}>
            <Link
              to="/menu"
              className="inline-flex h-12 w-full min-h-[44px] items-center justify-center gap-2 rounded-full bg-kado-red px-8 text-sm font-semibold text-kado-cream shadow-lg shadow-kado-red/20 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
            >
              {copy.ctaLabel}
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          </TimelineContent>
        </div>

        <TimelineContent
          as="nav"
          animationNum={9}
          timelineRef={heroRef}
          customVariants={textVariants}
          aria-label="Kado Coffee social media"
          className="mt-10 border-t border-kado-dark/8 pt-8 sm:mt-12"
        >
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-kado-dark/40">
            {copy.socialHeading}
          </p>
          <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            {SOCIAL_LINKS.map(({ key, href, label, handle, Icon }) => (
              <li key={key} className="min-w-0">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="group inline-flex min-h-[44px] w-full max-w-full items-center gap-3 rounded-2xl border border-kado-dark/8 bg-kado-offwhite/80 px-4 py-2.5 text-kado-dark transition-colors hover:border-kado-red/25 hover:text-kado-red sm:w-auto"
                  aria-label={label}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-kado-dark/10 bg-white transition-colors group-hover:border-kado-red group-hover:bg-kado-red group-hover:text-kado-cream">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 truncate font-sans text-sm font-semibold">{handle}</span>
                </a>
              </li>
            ))}
          </ul>
        </TimelineContent>
      </div>
    </section>
  );
}
