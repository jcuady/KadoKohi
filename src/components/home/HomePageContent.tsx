import { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MapPin, CalendarDays, ArrowUpRight, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedTestimonials } from '../ui/animated-testimonials';
import { KadoOrderingCarousel } from '../ui/animated-feature-carousel';
import KadoCircleCTA from '../ui/cta-with-text-marquee';
import HomeFaqSection from './HomeFaqSection';
import HomeHeroSlider from '../ui/home-hero-slider';
import HomeSeoIntro from './HomeSeoIntro';
import HomePageSeoSection from '../seo/HomePageSeoSection';
import FeaturedCoffeesSection from './FeaturedCoffeesSection';
import { useBranchStore } from '../../store/branchStore';
import { useEventStore } from '../../store/eventStore';
import { hydrateEvents } from '../../lib/bootstrapHydration';
import { useCountdown } from '../../hooks/useCountdown';
import {
  eventDurationLabel,
  eventImages,
  getEventLifecyclePhase,
  getEventSignupPhase,
  pickCurrentOrUpcoming,
  signupCountdownTarget,
} from '../../lib/eventTiming';
import { KADO_GOOGLE_LISTING } from '../../content/kadoGoogleReviews';
import type { EventsCopy, BranchesStripCopy, LandingContentState } from '../../store/landingContentStore';
import CmsStyledText from '../cms/CmsStyledText';
import CmsEditableImage from '../cms/CmsEditableImage';
import { cmsTextProps } from '../../lib/cmsFieldBind';
import { useLandingContentStore } from '../../store/landingContentStore';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import type { LandingTabId } from '../../lib/landingCmsTabs';

type Props = {
  landing: LandingContentState;
  /** Shown when rendering admin preview iframe */
  previewBanner?: boolean;
  /** Render only one homepage section (admin CMS preview). */
  sectionOnly?: LandingTabId;
  /** Enables inline text/image editing in the preview. */
  cmsEditMode?: boolean;
};

function showSection(id: LandingTabId, sectionOnly?: LandingTabId) {
  return !sectionOnly || sectionOnly === id;
}

export default function HomePageContent({ landing, previewBanner, sectionOnly, cmsEditMode }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col w-full min-w-0 overflow-x-hidden bg-kado-cream font-sans"
    >
      {previewBanner ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-[100] bg-amber-500 text-kado-dark text-center py-2 px-4 text-xs font-bold uppercase tracking-wider shadow-md"
        >
          Preview mode — unpublished changes only
        </motion.div>
      ) : null}
      {showSection('hero', sectionOnly) ? (
        <HomeHeroSlider slides={landing.heroSlides} chrome={landing.heroChrome} cmsEditMode={cmsEditMode} />
      ) : null}
      {showSection('featured', sectionOnly) ? (
        <div id="landing-featured">
          <FeaturedCoffeesSection copy={landing.featured} cmsEditMode={cmsEditMode} />
        </div>
      ) : null}
      {showSection('ordering', sectionOnly) ? (
        <div id="landing-ordering">
          <KadoOrderingCarousel copy={landing.ordering} cmsEditMode={cmsEditMode} />
        </div>
      ) : null}
      {showSection('testimonials', sectionOnly) ? (
        <div id="landing-testimonials">
          <AnimatedTestimonials
            badgeText={landing.testimonials.badge}
            title={landing.testimonials.title}
            subtitle={landing.testimonials.subtitle}
            trustedCompaniesTitle={landing.testimonials.trustedTitle}
            trustedCompanies={landing.trustedBrands}
            testimonials={landing.testimonialItems}
            googleListing={KADO_GOOGLE_LISTING}
            cmsEditMode={cmsEditMode}
          />
        </div>
      ) : null}
      {showSection('story', sectionOnly) ? (
        <div id="landing-story">
          <HomeSeoIntro copy={landing.storySeo} cmsEditMode={cmsEditMode} />
        </div>
      ) : null}
      {showSection('menu-seo', sectionOnly) ? (
        <div id="landing-menu-seo">
          <HomePageSeoSection copy={landing.menuSeo} cmsEditMode={cmsEditMode} />
        </div>
      ) : null}
      {showSection('events', sectionOnly) ? (
        <div id="landing-events">
          <EventsSection copy={landing.events} cmsEditMode={cmsEditMode} />
        </div>
      ) : null}
      {showSection('branches', sectionOnly) ? (
        <div id="landing-branches">
          <BranchesStrip copy={landing.branchesStrip} cmsEditMode={cmsEditMode} />
        </div>
      ) : null}
      {showSection('faq', sectionOnly) ? (
        <HomeFaqSection copy={landing.faq} cmsEditMode={cmsEditMode} />
      ) : null}
      {showSection('kado-circle', sectionOnly) ? (
        <div id="landing-kado-circle">
          <KadoCircleCTA copy={landing.kadoCircle} cmsEditMode={cmsEditMode} />
        </div>
      ) : null}
    </motion.div>
  );
}

const FALLBACK_EVENT_IMG = '/featuredmarikina/kadom2.jpg';

function EventsSection({ copy, cmsEditMode }: { copy: EventsCopy; cmsEditMode?: boolean }) {
  const updateEvents = useLandingContentStore((s) => s.updateEvents);
  const events = useEventStore((s) => s.events);
  const eventsHydrated = useEventStore((s) => s.hydrated);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!eventsHydrated) void hydrateEvents();
  }, [eventsHydrated]);

  useEffect(() => {
    void orderingRepo.fetchEventRegistrationCounts().then(setRegCounts).catch(() => {});
  }, [events.length]);

  const ev = useMemo(() => {
    return pickCurrentOrUpcoming(events);
  }, [events]);
  const signupPhase = ev ? getEventSignupPhase(ev, regCounts[ev.id] ?? 0) : 'disabled';
  const lifecycle = ev ? getEventLifecyclePhase(ev) : 'upcoming';
  const countdownTarget = useMemo(() => {
    if (!ev) return undefined;
    if (lifecycle === 'upcoming') return ev.startsAt;
    if (lifecycle === 'current' && ev.endsAt) return ev.endsAt;
    return signupCountdownTarget(ev, signupPhase);
  }, [ev, lifecycle, signupPhase]);
  const countdown = useCountdown(countdownTarget);
  const heroImage = copy.coverImageOverride?.trim() || (ev ? eventImages(ev)[0] : '') || FALLBACK_EVENT_IMG;
  const coverSrc = copy.coverImageOverride?.trim() || heroImage;
  const durationLabel = ev ? eventDurationLabel(ev) : null;
  const ctaHref = ev && signupPhase === 'open' ? `/events?event=${encodeURIComponent(ev.id)}#event-${ev.id}` : '/events';
  const ctaLabel =
    ev && signupPhase === 'open'
      ? (ev.cta?.label?.trim() || 'Sign up now')
      : (ev?.cta?.label?.trim() || 'View Kado Events');

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return { day: d.getDate().toString(), month: d.toLocaleString('en-PH', { month: 'short' }).toUpperCase() };
  };

  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-12 lg:px-24 w-full bg-kado-cream">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="max-w-[1400px] mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <span className="inline-flex items-center gap-2 kado-label text-kado-red bg-kado-red/10 px-3 sm:px-4 py-2 rounded-full border border-kado-red/20 shadow-sm">
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />{' '}
            <CmsStyledText
              value={copy.badge}
              as="span"
              {...cmsTextProps(cmsEditMode, 'events.badge', 'Badge', (v) => updateEvents({ badge: v }))}
            />
          </span>
          <h2 className="kado-h2 text-kado-dark leading-[1.08] px-1">
            <CmsStyledText
              value={copy.title}
              as="span"
              {...cmsTextProps(cmsEditMode, 'events.title', 'Title', (v) => updateEvents({ title: v }))}
            />
          </h2>
          <CmsStyledText
            value={copy.subtitle}
            as="p"
            className="font-medium mx-auto max-w-3xl mt-5 sm:mt-6 px-1 sm:px-4 md:px-0 md:text-base"
            defaultSizeClass="kado-body"
            defaultColorClass="text-kado-dark/80"
            {...cmsTextProps(cmsEditMode, 'events.subtitle', 'Subtitle', (v) => updateEvents({ subtitle: v }))}
          />
        </motion.div>

        {ev ? (
          <motion.div
            className="w-full"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <div className="relative rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] overflow-hidden group border border-kado-dark/20 shadow-2xl shadow-black/40 min-h-[min(68svh,520px)] sm:min-h-[500px] lg:min-h-[750px] w-full">
              {cmsEditMode ? (
                <CmsEditableImage
                  cmsField="events.cover"
                  cmsLabel="Events cover image"
                  src={coverSrc}
                  alt={ev.title}
                  className="absolute inset-0 h-full w-full"
                  onImageChange={(url) => updateEvents({ coverImageOverride: url })}
                />
              ) : (
                <motion.img
                  src={heroImage}
                  alt={ev.title}
                  className="w-full h-full object-cover brightness-[0.7] contrast-[1.1]"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                />
              )}
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/95 opacity-90"
                initial={{ opacity: 0.85 }}
                whileHover={{ opacity: 0.95 }}
              />
              <div className="absolute inset-0 p-5 sm:p-8 lg:p-16 flex flex-col justify-between gap-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 w-full">
                  {(() => {
                    const { day, month } = formatDate(ev.startsAt);
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-kado-cream text-kado-dark kado-h3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] shadow-2xl leading-none text-center shrink-0 self-start"
                      >
                        {day}
                        <br />
                        <span className="kado-label text-kado-red mt-1 block">
                          {month}
                        </span>
                      </motion.div>
                    );
                  })()}
                  {countdownTarget ? (
                    <div className="flex flex-wrap justify-center sm:justify-end gap-x-2 gap-y-2 sm:gap-4 bg-black/60 backdrop-blur-2xl border border-white/20 px-3 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5 rounded-xl sm:rounded-[2rem] shadow-2xl w-full sm:w-auto">
                      {[
                        { v: countdown.days, l: 'Days', red: true },
                        { v: countdown.hours, l: 'Hrs' },
                        { v: countdown.minutes, l: 'Min' },
                        { v: countdown.seconds, l: 'Sec' },
                      ].map(({ v, l, red }, i) => (
                        <motion.div
                          key={l}
                          className="flex items-center gap-1.5 sm:gap-2 lg:gap-4"
                          initial={{ opacity: 0, y: 6 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05 }}
                        >
                          {i > 0 && <span className="text-white/30 font-bold self-start mt-1 hidden sm:inline">:</span>}
                          <motion.div className="text-center min-w-[2.25rem]">
                            <span
                              className={`block kado-h3 leading-none ${red ? 'text-kado-red' : 'text-white'}`}
                            >
                              {String(v).padStart(2, '0')}
                            </span>
                            <span className="kado-subtext uppercase tracking-widest text-kado-cream/70 font-semibold mt-0.5 sm:mt-1 block">
                              {l}
                            </span>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center rounded-xl sm:rounded-[2rem] border border-emerald-300/40 bg-emerald-500/20 px-4 py-2.5 sm:px-6 text-emerald-100 text-xs sm:text-sm font-black uppercase tracking-widest">
                      {lifecycle === 'current' ? 'Live now' : 'Details on events page'}
                    </div>
                  )}
                </div>
                <motion.div
                  className="w-full max-w-3xl mt-auto"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="kado-h2 text-white mb-3 sm:mb-4 lg:mb-6 leading-[1.1]">
                    {ev.title}
                  </h3>
                  <p className="text-kado-cream/90 kado-body md:text-base leading-relaxed mb-6 sm:mb-8 line-clamp-6 sm:line-clamp-none">
                    {ev.description}
                  </p>
                  {durationLabel && (
                    <p className="text-xs sm:text-sm text-kado-cream/80 font-semibold mb-5">
                      Event duration: {durationLabel}
                    </p>
                  )}
                  <Link
                    to={ctaHref}
                    className="inline-flex items-center justify-center gap-2 sm:gap-3 min-h-[48px] w-full sm:w-auto text-kado-cream hover:text-white font-bold text-xs sm:text-sm lg:text-base uppercase tracking-[0.15em] sm:tracking-[0.2em] bg-kado-red/90 hover:bg-kado-red px-6 sm:px-8 py-3.5 sm:py-4 rounded-full backdrop-blur-md border border-kado-red/40 shadow-[0_0_30px_rgba(158,24,29,0.35)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark"
                  >
                    {ctaLabel} <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <CalendarDays className="w-10 h-10 text-kado-red/40 mx-auto mb-4" />
            <CmsStyledText
              value={copy.noEventBody}
              as="p"
              className="text-sm"
              defaultColorClass="text-kado-dark/50"
              {...cmsTextProps(cmsEditMode, 'events.noEventBody', 'No events message', (v) =>
                updateEvents({ noEventBody: v }),
              )}
            />
            <Link to="/events" className="mt-4 inline-block text-kado-red font-bold text-sm hover:underline">
              <CmsStyledText
                value={copy.noEventBrowseLabel}
                as="span"
                {...cmsTextProps(cmsEditMode, 'events.noEventBrowseLabel', 'No events CTA', (v) =>
                  updateEvents({ noEventBrowseLabel: v }),
                )}
              />
            </Link>
          </div>
        )}
      </motion.div>
    </section>
  );
}

function BranchesStrip({ copy, cmsEditMode }: { copy: BranchesStripCopy; cmsEditMode?: boolean }) {
  const updateBranchesStrip = useLandingContentStore((s) => s.updateBranchesStrip);
  const branches = useBranchStore((s) => s.branches);

  const fmt = (hours: { day: string; open: string; close: string }[]) => {
    if (!hours.length) return null;
    const mon = hours.find((h) => h.day === 'mon');
    return mon ? `${mon.open} – ${mon.close}` : null;
  };

  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 lg:px-24 w-full bg-kado-dark border-t border-white/5 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="max-w-[1400px] mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <CmsStyledText
              value={copy.badge}
              as="span"
              className="kado-label mb-3 block"
              defaultColorClass="text-kado-red"
              {...cmsTextProps(cmsEditMode, 'branches.badge', 'Badge', (v) => updateBranchesStrip({ badge: v }))}
            />
            <CmsStyledText
              value={copy.title}
              as="h2"
              className="kado-h2"
              defaultColorClass="text-kado-cream"
              {...cmsTextProps(cmsEditMode, 'branches.title', 'Title', (v) => updateBranchesStrip({ title: v }))}
            />
          </div>
          <Link
            to="/branches"
            className="kado-label inline-flex min-h-[44px] items-center gap-1 text-kado-cream/60 hover:text-white transition-colors"
          >
            <CmsStyledText
              value={copy.ctaLabel}
              as="span"
              {...cmsTextProps(cmsEditMode, 'branches.ctaLabel', 'CTA label', (v) =>
                updateBranchesStrip({ ctaLabel: v }),
              )}
            /> <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div
          className="grid sm:grid-cols-2 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {branches.map((branch) => {
            const hours = fmt(branch.hours);
            const isActive = branch.status === 'active';
            return (
              <motion.div
                key={branch.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
              >
                <Link
                  to="/branches"
                  className="group relative rounded-2xl sm:rounded-[2rem] border border-white/10 bg-white/5 hover:bg-white/8 p-6 sm:p-8 flex flex-col gap-4 sm:gap-5 transition-all hover:border-kado-red/30 active:bg-white/10 block"
                >
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Open
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-kado-red border border-kado-red/30 px-3 py-1 rounded-full">
                        <Clock className="w-3 h-3" /> Coming Soon
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="kado-h3 text-kado-cream mb-1 group-hover:text-white transition-colors">
                      {branch.name}
                    </h3>
                    <p className="text-kado-cream/55 text-sm flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-kado-red" />
                      {branch.address}, {branch.city}
                    </p>
                    {hours && (
                      <p className="text-kado-cream/40 text-xs mt-2 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 shrink-0" /> {hours} daily
                      </p>
                    )}
                  </div>

                  <motion.div
                    className="mt-auto flex items-center gap-2 text-kado-red text-xs font-bold uppercase tracking-wider"
                    whileHover={{ x: 4 }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View details
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}
