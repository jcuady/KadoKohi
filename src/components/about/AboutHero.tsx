import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { CalendarHeart, MapPin } from 'lucide-react';
import ResilientImage from '@/components/ui/ResilientImage';
import { ABOUT_HERO, ABOUT_STATS } from '@/content/aboutPage';
import { AboutChip } from './AboutUi';
import { AboutEditorialGrid, EditorialHeadline, type EditorialLine } from './AboutEditorial';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cmsTextPlain } from '@/lib/cmsTypography';
import { cmsTextProps } from '@/lib/cmsFieldBind';
import CmsStyledText from '@/components/cms/CmsStyledText';
import CmsEditableImage from '@/components/cms/CmsEditableImage';
import {
  useLandingContentStore,
  type AboutPageCopy,
} from '@/store/landingContentStore';

type Props = {
  /** Admin preview / draft override. Public page uses published store. */
  copy?: AboutPageCopy;
  cmsEditMode?: boolean;
};

function heroLinesFromCopy(copy: AboutPageCopy): EditorialLine[] {
  return [
    [
      { text: cmsTextPlain(copy.line1Before) || 'Rooted in ', accent: false },
      { text: cmsTextPlain(copy.line1Accent) || 'Matcha', accent: true },
    ],
    [
      { text: cmsTextPlain(copy.line2Before) || 'Reshaping ', accent: false },
      { text: cmsTextPlain(copy.line2Accent) || 'Ritual', accent: true },
    ],
  ];
}

export default function AboutHero({ copy: copyProp, cmsEditMode = false }: Props) {
  const published = useLandingContentStore((s) => s.published.aboutPage);
  const updateAboutPage = useLandingContentStore((s) => s.updateAboutPage);
  const copy = copyProp ?? published;

  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [compactViewport, setCompactViewport] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape) and (max-height: 40rem)');
    const sync = () => setCompactViewport(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const disableParallax = prefersReducedMotion || compactViewport;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], disableParallax ? [0, 0] : [0, 64]);
  const copyY = useTransform(scrollYProgress, [0, 1], disableParallax ? [0, 0] : [0, 28]);

  const lines = useMemo(() => heroLinesFromCopy(copy), [copy]);

  const heroSrc = copy.heroImageSrc?.trim() || ABOUT_HERO.heroImageSrc;

  return (
    <section
      ref={ref}
      className="about-hero-section relative overflow-x-clip border-b border-kado-cream/10 bg-kado-dark text-kado-cream"
    >
      <AboutEditorialGrid dark className="min-h-[inherit]">
        <div className="about-hero-grid grid lg:grid-cols-12">
          {/* Copy — isolated column; never overlaps photo */}
          <motion.div
            style={{ y: copyY }}
            className="about-hero-parallax-off about-hero-copy relative z-20 flex min-w-0 flex-col justify-end overflow-hidden bg-kado-dark px-[max(1rem,env(safe-area-inset-left))] pb-8 pt-[calc(var(--public-nav-height)+1.25rem)] sm:px-6 sm:pb-12 lg:col-span-7 lg:pb-14 pr-[max(1rem,env(safe-area-inset-right))] lg:pr-8"
          >
            <motion.div
              initial={disableParallax ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 sm:mb-5"
            >
              <CmsStyledText
                value={copy.eyebrow}
                as="p"
                className="kado-label text-kado-cream/60"
                defaultColorClass="text-kado-cream/60"
                {...cmsTextProps(cmsEditMode, 'about.eyebrow', 'Eyebrow', (v) =>
                  updateAboutPage({ eyebrow: v }),
                )}
              />
            </motion.div>

            <motion.div
              initial={disableParallax ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.06 }}
              className="about-editorial-headline-scale"
            >
              {cmsEditMode ? (
                <div className="space-y-1">
                  <p className="about-editorial-headline about-editorial-headline-display max-w-full text-kado-cream">
                    <span className="about-editorial-line">
                      <CmsStyledText
                        value={copy.line1Before}
                        as="span"
                        defaultColorClass="text-kado-cream"
                        {...cmsTextProps(cmsEditMode, 'about.line1Before', 'Line 1', (v) =>
                          updateAboutPage({ line1Before: v }),
                        )}
                      />
                      <CmsStyledText
                        value={copy.line1Accent}
                        as="span"
                        className="text-kado-red"
                        defaultColorClass="text-kado-red"
                        {...cmsTextProps(cmsEditMode, 'about.line1Accent', 'Line 1 accent', (v) =>
                          updateAboutPage({ line1Accent: v }),
                        )}
                      />
                    </span>
                    <span className="about-editorial-line">
                      <CmsStyledText
                        value={copy.line2Before}
                        as="span"
                        defaultColorClass="text-kado-cream"
                        {...cmsTextProps(cmsEditMode, 'about.line2Before', 'Line 2', (v) =>
                          updateAboutPage({ line2Before: v }),
                        )}
                      />
                      <CmsStyledText
                        value={copy.line2Accent}
                        as="span"
                        className="text-kado-red"
                        defaultColorClass="text-kado-red"
                        {...cmsTextProps(cmsEditMode, 'about.line2Accent', 'Line 2 accent', (v) =>
                          updateAboutPage({ line2Accent: v }),
                        )}
                      />
                    </span>
                  </p>
                </div>
              ) : (
                <EditorialHeadline as="h1" dark lines={lines} />
              )}
            </motion.div>

            <motion.div
              initial={disableParallax ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-5 max-w-xl sm:mt-6"
            >
              <CmsStyledText
                value={copy.tagline}
                as="p"
                className="kado-body text-pretty text-kado-cream/78"
                defaultColorClass="text-kado-cream/78"
                {...cmsTextProps(cmsEditMode, 'about.tagline', 'Tagline', (v) =>
                  updateAboutPage({ tagline: v }),
                )}
              />
            </motion.div>

            <motion.div
              initial={disableParallax ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="mt-5 flex flex-wrap items-center gap-3"
            >
              <AboutChip variant="cream">
                <CalendarHeart className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <CmsStyledText
                  value={copy.softOpeningLabel}
                  as="span"
                  {...cmsTextProps(cmsEditMode, 'about.softOpeningLabel', 'Chip label', (v) =>
                    updateAboutPage({ softOpeningLabel: v }),
                  )}
                />
              </AboutChip>
              <CmsStyledText
                value={copy.softOpeningDate}
                as="span"
                className="kado-body-sm font-semibold"
                {...cmsTextProps(cmsEditMode, 'about.softOpeningDate', 'Date', (v) =>
                  updateAboutPage({ softOpeningDate: v }),
                )}
              />
            </motion.div>

            <motion.div
              initial={disableParallax ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="kado-body-sm mt-4 flex items-start gap-1.5 text-kado-cream/55"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <CmsStyledText
                value={copy.locationNote}
                as="span"
                {...cmsTextProps(cmsEditMode, 'about.locationNote', 'Location', (v) =>
                  updateAboutPage({ locationNote: v }),
                )}
              />
            </motion.div>
          </motion.div>

          {/* Photo — stays in its column (no negative pull under copy) */}
          <motion.div
            style={{ y: imageY }}
            className="about-hero-parallax-off about-hero-media relative z-0 min-h-[min(42svh,18rem)] sm:min-h-[22rem] lg:col-span-5 lg:min-h-full"
          >
            <div className="absolute inset-0 overflow-hidden">
              {cmsEditMode ? (
                <CmsEditableImage
                  cmsField="about.heroImage"
                  cmsLabel="About hero photo"
                  src={heroSrc}
                  alt={cmsTextPlain(copy.heroImageAlt) || ABOUT_HERO.heroImageAlt}
                  className="about-editorial-photo h-full w-full object-cover object-center"
                  onImageChange={(url) => updateAboutPage({ heroImageSrc: url })}
                />
              ) : (
                <ResilientImage
                  src={heroSrc}
                  fallbackSrc={ABOUT_HERO.heroImageFallback}
                  alt={cmsTextPlain(copy.heroImageAlt) || ABOUT_HERO.heroImageAlt}
                  className="about-editorial-photo h-full w-full object-cover object-center"
                />
              )}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-kado-dark via-kado-dark/25 to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-kado-dark/40"
              />
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 border-t border-kado-cream/10 bg-kado-dark/90 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-px md:grid-cols-4">
            {ABOUT_STATS.map((stat) => (
              <div
                key={stat.label}
                className="border-kado-cream/10 px-4 py-4 sm:px-6 sm:py-5 md:border-l first:md:border-l-0"
              >
                <p className="font-display text-lg font-bold text-kado-cream sm:text-xl">{stat.value}</p>
                <p className="kado-label mt-1 text-kado-cream/55">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </AboutEditorialGrid>
    </section>
  );
}
