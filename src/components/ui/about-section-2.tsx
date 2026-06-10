import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram } from 'lucide-react';
import type { Variants } from 'motion/react';
import { TimelineContent } from '@/components/ui/timeline-animation';
import { SEO_SOCIAL } from '@/content/seo';
import { KADO_GOOGLE_LISTING } from '@/content/kadoGoogleReviews';
import TikTokIcon from '@/components/icons/TikTokIcon';

const revealVariants: Variants = {
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  }),
  hidden: { y: 24, opacity: 0 },
};

const SOCIAL_LINKS = [
  { key: 'instagram', href: SEO_SOCIAL.instagram, label: 'Instagram', Icon: Instagram },
  { key: 'tiktok', href: SEO_SOCIAL.tiktok, label: 'TikTok', Icon: TikTokIcon },
  { key: 'facebook', href: SEO_SOCIAL.facebook, label: 'Facebook', Icon: Facebook },
] as const;

const linkClass =
  'font-display text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-kado-red underline-offset-4 decoration-kado-red/35 hover:underline';

export default function AboutSection2() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { rating, reviewCount, mapsUrl } = KADO_GOOGLE_LISTING;

  return (
    <section
      aria-labelledby="home-brand-story-heading"
      className="border-t border-kado-dark/8 bg-kado-cream px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-12 lg:py-28"
      ref={containerRef}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-start gap-10 md:gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          {/* Left: headline + image pair (no overlap on text) */}
          <div className="min-w-0">
            <TimelineContent
              as="p"
              animationNum={0}
              timelineRef={containerRef}
              customVariants={revealVariants}
              className="mb-4 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-kado-dark/45"
            >
              // No fluff. Just coffee.
            </TimelineContent>

            <TimelineContent
              as="h2"
              id="home-brand-story-heading"
              animationNum={1}
              timelineRef={containerRef}
              customVariants={revealVariants}
              className="max-w-[14ch] font-display text-[clamp(2.25rem,7vw,4.5rem)] font-black leading-[0.95] tracking-tighter text-kado-red"
            >
              Our Coffee,
              <br />
              Our Rules.
            </TimelineContent>

            <TimelineContent
              as="div"
              animationNum={2}
              timelineRef={containerRef}
              customVariants={revealVariants}
              className="mt-8 flex items-end gap-4 sm:mt-10 sm:gap-6"
            >
              <div className="h-36 w-36 shrink-0 overflow-hidden rounded-full border-4 border-kado-cream shadow-lg sm:h-44 sm:w-44 md:h-48 md:w-48">
                <img
                  src="/featuredmarikina/kadom1.jpg"
                  alt="Kado Kohi cafe exterior at night"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="mb-2 h-44 w-32 shrink-0 overflow-hidden rounded-[4rem] border-4 border-kado-cream shadow-lg sm:mb-4 sm:h-52 sm:w-36 md:h-56 md:w-40">
                <img
                  src="/featuredmarikina/kadom2.jpg"
                  alt="Guests inside Kado Kohi Marikina"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </TimelineContent>
          </div>

          {/* Right: editorial copy */}
          <div className="flex min-w-0 flex-col justify-center lg:pt-4">
            <TimelineContent
              as="p"
              animationNum={3}
              timelineRef={containerRef}
              customVariants={revealVariants}
              className="font-sans text-base leading-[1.75] text-kado-dark sm:text-lg md:text-xl md:leading-relaxed"
            >
              We&apos;re not a franchise. We&apos;re not chasing trends. We roast, grind, and brew for
              people who want real coffee — honest craft from Sta. Elena, Marikina.
            </TimelineContent>

            <TimelineContent
              as="p"
              animationNum={4}
              timelineRef={containerRef}
              customVariants={revealVariants}
              className="mt-5 max-w-xl font-sans text-sm leading-[1.7] text-kado-dark/65 sm:mt-6 sm:text-base"
            >
              Kado Kohi is a Japanese-inspired specialty cafe on J.P. Laurel. For{' '}
              <strong className="font-semibold text-kado-dark">best matcha in Marikina</strong>,{' '}
              <strong className="font-semibold text-kado-dark">hojicha oat latte</strong>, or{' '}
              <strong className="font-semibold text-kado-dark">coffee near me</strong>, we&apos;re rated{' '}
              {rating}★ on Google ({reviewCount} reviews).{' '}
              <Link to="/menu" className={linkClass}>
                Browse the menu
              </Link>
              ,{' '}
              <Link to="/branches" className={linkClass}>
                see hours
              </Link>
              , or{' '}
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                get directions
              </a>
              .
            </TimelineContent>

            <TimelineContent
              as="div"
              animationNum={5}
              timelineRef={containerRef}
              customVariants={revealVariants}
              className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6"
            >
              <Link
                to="/menu"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-kado-red px-6 text-xs font-bold uppercase tracking-[0.16em] text-kado-cream shadow-md shadow-kado-red/20 transition-colors hover:bg-kado-dark sm:w-auto sm:min-w-[11rem]"
              >
                Explore menu
              </Link>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border-2 border-kado-dark/15 px-6 text-xs font-bold uppercase tracking-[0.16em] text-kado-dark transition-colors hover:border-kado-red hover:text-kado-red sm:w-auto sm:min-w-[11rem]"
              >
                Find us
              </a>
            </TimelineContent>

            <TimelineContent
              as="nav"
              animationNum={6}
              timelineRef={containerRef}
              customVariants={revealVariants}
              aria-label="Kado Coffee social media"
              className="mt-10 flex flex-col gap-4 border-t border-kado-dark/10 pt-8 sm:mt-12 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-kado-dark/40">
                Follow Kado Coffee
              </span>
              <div className="flex gap-3">
                {SOCIAL_LINKS.map(({ key, href, label, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer me"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-kado-dark/12 bg-kado-offwhite text-kado-dark/60 transition-colors hover:border-kado-red hover:bg-kado-red hover:text-kado-cream"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </a>
                ))}
              </div>
            </TimelineContent>
          </div>
        </div>
      </div>
    </section>
  );
}
