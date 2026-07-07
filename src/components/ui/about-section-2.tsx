import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, Facebook, Instagram } from 'lucide-react';
import type { Variants } from 'motion/react';
import { TimelineContent } from '@/components/ui/timeline-animation';
import AccentHeadline from '@/components/ui/AccentHeadline';
import CmsStyledText from '@/components/cms/CmsStyledText';
import CmsEditableImage from '@/components/cms/CmsEditableImage';
import { cmsTextPlain } from '@/lib/cmsTypography';
import { cmsTextProps } from '@/lib/cmsFieldBind';
import ResilientImage from '@/components/ui/ResilientImage';
import { SEO_SOCIAL } from '@/content/seo';
import TikTokIcon from '@/components/icons/TikTokIcon';
import type { BrandStoryCopy } from '@/store/landingContentStore';
import { useLandingContentStore } from '@/store/landingContentStore';

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

type Props = { copy: BrandStoryCopy; cmsEditMode?: boolean };

/**
 * Homepage brand story — editorial pillars + crawlable local SEO copy.
 */
export default function AboutSection2({ copy, cmsEditMode }: Props) {
  const heroRef = useRef<HTMLDivElement>(null);
  const updateStorySeo = useLandingContentStore((s) => s.updateStorySeo);
  const updateStorySeoPillar = useLandingContentStore((s) => s.updateStorySeoPillar);

  return (
    <section
      aria-labelledby="home-brand-story-heading"
      className="landing-section relative overflow-hidden bg-kado-cream"
    >
      <div
        aria-hidden
        className="kado-kanji-watermark -right-4 top-4 text-[clamp(7rem,18vw,12rem)] text-kado-red/[0.05]"
      >
        角
      </div>
      <div className="relative mx-auto max-w-6xl min-w-0 pr-[max(0px,env(safe-area-inset-right))]" ref={heroRef}>
        <TimelineContent
          as="p"
          animationNum={0}
          timelineRef={heroRef}
          customVariants={textVariants}
          className="mb-5 inline-flex rounded-full border border-kado-red/20 bg-kado-red/10 px-3 py-1.5 kado-label text-kado-red sm:mb-6"
        >
          <CmsStyledText
            value={copy.badge}
            as="span"
            defaultSizeClass="kado-label"
            defaultColorClass="text-kado-red"
            {...cmsTextProps(cmsEditMode, 'story.badge', 'Section badge', (v) => updateStorySeo({ badge: v }))}
          />
        </TimelineContent>

        <TimelineContent
          as="h2"
          id="home-brand-story-heading"
          animationNum={1}
          timelineRef={heroRef}
          customVariants={revealVariants}
          className="max-w-4xl kado-h2 text-kado-dark"
        >
          <AccentHeadline
            copy={copy.headline}
            cmsEditMode={cmsEditMode}
            fieldPrefix="story.headline"
            onPartChange={(key, value) =>
              updateStorySeo({ headline: { ...copy.headline, [key]: value } })
            }
          />
        </TimelineContent>

        <TimelineContent
          as="p"
          animationNum={2}
          timelineRef={heroRef}
          customVariants={textVariants}
          className="mt-6 max-w-2xl kado-body text-kado-dark/70 sm:mt-8 sm:text-base"
        >
          <CmsStyledText
            value={copy.intro}
            as="span"
            defaultSizeClass="kado-body"
            defaultColorClass="text-kado-dark/70"
            {...cmsTextProps(cmsEditMode, 'story.intro', 'Intro paragraph', (v) => updateStorySeo({ intro: v }))}
          />
        </TimelineContent>

        <div className="relative mt-8 sm:mt-10">
          <div
            className="scrollbar-hide -mx-[max(1rem,env(safe-area-inset-left))] flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-[max(1rem,env(safe-area-inset-left))] pb-1 scroll-pl-[max(1rem,env(safe-area-inset-left))] scroll-pr-10 touch-pan-x lg:mx-0 lg:grid lg:grid-cols-2 lg:grid-rows-2 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0"
            aria-label="Brand story highlights"
          >
            {copy.pillars.map((pillar, i) => (
              <TimelineContent
                key={`${cmsTextPlain(pillar.title)}-${cmsTextPlain(pillar.subtitle)}`}
                as="article"
                animationNum={3 + i}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className={`${pillarCard} w-[min(85vw,18rem)] shrink-0 snap-center lg:w-auto lg:shrink ${i === 0 ? 'lg:row-span-2 lg:min-h-[520px]' : 'lg:min-h-[240px]'}`}
              >
              {cmsEditMode ? (
                <CmsEditableImage
                  cmsField={`story.pillar.${i}.image`}
                  cmsLabel={`Pillar ${i + 1} image`}
                  src={pillar.imageUrl}
                  alt={pillar.imageAlt}
                  className="absolute inset-0 h-full w-full"
                  onImageChange={(url) => updateStorySeoPillar(i, { imageUrl: url })}
                />
              ) : (
                <ResilientImage
                  src={pillar.imageUrl}
                  alt={pillar.imageAlt}
                  className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-kado-dark via-kado-dark/50 to-kado-dark/10" />
              <div className="relative mt-auto p-4 sm:p-5 lg:p-6">
                <CmsStyledText
                  value={pillar.subtitle}
                  as="p"
                  className="kado-label"
                  defaultColorClass="text-kado-cream/60"
                  {...cmsTextProps(cmsEditMode, `story.pillar.${i}.subtitle`, `Pillar ${i + 1} subtitle`, (v) =>
                    updateStorySeoPillar(i, { subtitle: v }),
                  )}
                />
                <CmsStyledText
                  value={pillar.title}
                  as="h3"
                  className="mt-1 kado-h3"
                  defaultColorClass="text-kado-cream"
                  {...cmsTextProps(cmsEditMode, `story.pillar.${i}.title`, `Pillar ${i + 1} title`, (v) =>
                    updateStorySeoPillar(i, { title: v }),
                  )}
                />
                {pillar.body ? (
                  <CmsStyledText
                    value={pillar.body}
                    as="p"
                    className="mt-2"
                    defaultSizeClass="kado-body-sm"
                    defaultColorClass="text-kado-cream/80"
                    {...cmsTextProps(cmsEditMode, `story.pillar.${i}.body`, `Pillar ${i + 1} body`, (v) =>
                      updateStorySeoPillar(i, { body: v }),
                    )}
                  />
                ) : null}
              </div>
            </TimelineContent>
          ))}
          </div>
          {copy.pillars.length > 1 ? (
            <div className="mt-3 flex items-center justify-center gap-1.5 lg:hidden">
              <ChevronRight className="h-3 w-3 text-kado-dark/30" aria-hidden />
              <p className="kado-subtext text-[10px] font-semibold uppercase tracking-[0.16em] text-kado-dark/40">
                Swipe for more
              </p>
            </div>
          ) : null}
        </div>

        <TimelineContent
          as="p"
          animationNum={6}
          timelineRef={heroRef}
          customVariants={textVariants}
          className="mt-8 max-w-2xl kado-body text-kado-dark/65 sm:mt-10"
        >
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
            <CmsStyledText
              value={copy.footerTagline1}
              as="p"
              className="sm:text-base"
              defaultSizeClass="kado-body"
              defaultColorClass="text-kado-dark/60"
              {...cmsTextProps(cmsEditMode, 'story.footerTagline1', 'Footer line 1', (v) =>
                updateStorySeo({ footerTagline1: v }),
              )}
            />
            <CmsStyledText
              value={copy.footerTagline2}
              as="p"
              className="kado-h3 uppercase tracking-wide"
              defaultColorClass="text-kado-red"
              {...cmsTextProps(cmsEditMode, 'story.footerTagline2', 'Footer line 2', (v) =>
                updateStorySeo({ footerTagline2: v }),
              )}
            />
          </TimelineContent>

          <TimelineContent as="div" animationNum={8} timelineRef={heroRef} customVariants={textVariants}>
            <Link
              to="/menu"
              className="inline-flex h-12 w-full min-h-[44px] items-center justify-center gap-2 rounded-full bg-kado-red px-8 text-sm font-semibold text-kado-cream shadow-lg shadow-kado-red/20 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
            >
              <CmsStyledText
                value={copy.ctaLabel}
                as="span"
                {...cmsTextProps(cmsEditMode, 'story.ctaLabel', 'CTA label', (v) => updateStorySeo({ ctaLabel: v }))}
              />
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
          <p className="mb-4 kado-label text-kado-dark/40">
            <CmsStyledText
              value={copy.socialHeading}
              as="span"
              {...cmsTextProps(cmsEditMode, 'story.socialHeading', 'Social heading', (v) =>
                updateStorySeo({ socialHeading: v }),
              )}
            />
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
                  <span className="min-w-0 truncate kado-body font-semibold">{handle}</span>
                </a>
              </li>
            ))}
          </ul>
        </TimelineContent>
      </div>
    </section>
  );
}
