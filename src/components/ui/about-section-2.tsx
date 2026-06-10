import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Facebook, Instagram } from 'lucide-react';
import type { Variants } from 'motion/react';
import { TimelineContent } from '@/components/ui/timeline-animation';
import { SEO_SOCIAL } from '@/content/seo';
import { KADO_GOOGLE_LISTING } from '@/content/kadoGoogleReviews';
import TikTokIcon from '@/components/icons/TikTokIcon';

const revealVariants: Variants = {
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { delay: i * 0.28, duration: 0.65 },
  }),
  hidden: { filter: 'blur(10px)', y: 32, opacity: 0 },
};

const textVariants: Variants = {
  visible: (i: number) => ({
    filter: 'blur(0px)',
    opacity: 1,
    transition: { delay: i * 0.16, duration: 0.6 },
  }),
  hidden: { filter: 'blur(8px)', opacity: 0 },
};

/** Dotted emphasis — compact on mobile so lines don’t break awkwardly */
const highlight =
  'inline rounded-md border-2 border-dotted border-kado-red/45 px-1.5 py-0.5 font-semibold text-kado-red sm:px-2';

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

const linkClass =
  'font-semibold text-kado-red underline-offset-2 decoration-kado-red/40 hover:underline';

/**
 * Homepage brand + local SEO — natural copy (no absolute “#1” claims) with crawlable keywords.
 */
export default function AboutSection2() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { rating, reviewCount, mapsUrl } = KADO_GOOGLE_LISTING;

  return (
    <section
      aria-labelledby="home-brand-story-heading"
      className="border-t border-kado-dark/8 bg-kado-offwhite px-4 py-14 sm:px-6 sm:py-20 md:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-6xl" ref={heroRef}>
        <div className="w-full">
          <TimelineContent
            as="h2"
            id="home-brand-story-heading"
            animationNum={0}
            timelineRef={heroRef}
            customVariants={revealVariants}
            className="max-w-3xl font-display text-[1.45rem] font-bold leading-[1.22] tracking-tight text-kado-dark sm:text-3xl sm:leading-[1.18] md:text-4xl lg:text-[2.65rem] lg:leading-[1.14]"
          >
            <TimelineContent
              as="span"
              animationNum={1}
              timelineRef={heroRef}
              customVariants={textVariants}
              className={highlight}
            >
              Kado Coffee
            </TimelineContent>
            {' '}
            — one of the best specialty cafes in{' '}
            <TimelineContent
              as="span"
              animationNum={2}
              timelineRef={heroRef}
              customVariants={textVariants}
              className={highlight}
            >
              Marikina
            </TimelineContent>
            , right here in{' '}
            <TimelineContent
              as="span"
              animationNum={3}
              timelineRef={heroRef}
              customVariants={textVariants}
              className={highlight}
            >
              Sta. Elena
            </TimelineContent>
          </TimelineContent>

          <TimelineContent
            as="p"
            animationNum={4}
            timelineRef={heroRef}
            customVariants={textVariants}
            className="mt-5 max-w-3xl font-sans text-[0.95rem] leading-[1.7] text-kado-dark/75 sm:mt-6 sm:text-base md:text-lg md:leading-relaxed"
          >
            Our Coffee, Our Rules.{' '}
            <strong className="font-semibold text-kado-dark">Kado Kohi</strong> is a Japanese-inspired
            specialty coffee shop and neighborhood tambayan on J.P. Laurel corner Mt. Everest — for
            guests who want honest craft, not hype.
          </TimelineContent>

          <TimelineContent
            as="p"
            animationNum={5}
            timelineRef={heroRef}
            customVariants={textVariants}
            className="mt-4 max-w-3xl font-sans text-[0.95rem] leading-[1.7] text-kado-dark/65 sm:text-base md:text-lg md:leading-relaxed"
          >
            Searching for <strong className="font-semibold text-kado-dark">Kado Coffee</strong>,{' '}
            <strong className="font-semibold text-kado-dark">Marikina coffee</strong>, or{' '}
            <strong className="font-semibold text-kado-dark">coffee near me</strong> in Sta. Elena?
            We&apos;re rated {rating}★ on Google ({reviewCount} reviews). Browse our{' '}
            <Link to="/menu" className={linkClass}>
              specialty coffee menu
            </Link>
            , see{' '}
            <Link to="/branches" className={linkClass}>
              hours &amp; location
            </Link>
            , check{' '}
            <Link to="/events" className={linkClass}>
              tambayan events
            </Link>
            , or{' '}
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
              open directions on Google Maps
            </a>
            .
          </TimelineContent>

          <div className="mt-8 flex flex-col gap-5 sm:mt-10 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <TimelineContent
              as="div"
              animationNum={6}
              timelineRef={heroRef}
              customVariants={textVariants}
            >
              <p className="font-sans text-sm font-medium text-kado-dark/75 sm:text-base">
                We are Kado Kohi and we will
              </p>
              <p className="font-display text-base font-bold uppercase tracking-wide text-kado-red sm:text-lg md:text-xl">
                brew it honest
              </p>
            </TimelineContent>

            <TimelineContent
              as="div"
              animationNum={7}
              timelineRef={heroRef}
              customVariants={textVariants}
              className="w-full sm:w-auto"
            >
              <Link
                to="/menu"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-kado-red px-6 text-sm font-semibold text-kado-cream shadow-lg shadow-kado-red/20 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:inline-flex sm:w-auto"
              >
                <Coffee className="h-4 w-4 shrink-0" aria-hidden />
                Explore Menu
              </Link>
            </TimelineContent>
          </div>

          <TimelineContent
            as="nav"
            animationNum={8}
            timelineRef={heroRef}
            customVariants={textVariants}
            aria-label="Kado Coffee social media"
            className="mt-8 border-t border-kado-dark/8 pt-6 sm:mt-10 sm:pt-8"
          >
            <p className="mb-4 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-kado-dark/45">
              Follow Kado Coffee
            </p>
            <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-3">
              {SOCIAL_LINKS.map(({ key, href, label, handle, Icon }) => (
                <li key={key} className="min-w-0">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="group inline-flex min-h-[44px] w-full max-w-full items-center gap-3 text-kado-dark transition-colors hover:text-kado-red sm:w-auto"
                    aria-label={label}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-kado-dark/12 bg-white transition-colors group-hover:border-kado-red group-hover:bg-kado-red group-hover:text-kado-cream">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 truncate font-sans text-sm font-semibold sm:text-base">
                      {handle}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </TimelineContent>
        </div>
      </div>
    </section>
  );
}
