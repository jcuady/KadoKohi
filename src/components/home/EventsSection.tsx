import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import type { EventsCopy } from '../../store/landingContentStore';
import CmsStyledText from '../cms/CmsStyledText';
import CmsEditableImage from '../cms/CmsEditableImage';
import { cmsTextProps } from '../../lib/cmsFieldBind';
import { useLandingContentStore } from '../../store/landingContentStore';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';

const FALLBACK_EVENT_IMG = '/featuredmarikina/kadom2.jpg';

type Props = { copy: EventsCopy; cmsEditMode?: boolean };

export default function EventsSection({ copy, cmsEditMode }: Props) {
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

  const ev = useMemo(() => pickCurrentOrUpcoming(events), [events]);
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
    <section className="landing-section relative w-full overflow-hidden bg-kado-cream">
      <div
        aria-hidden
        className="kado-kanji-watermark -left-6 top-2 text-[clamp(8rem,22vw,14rem)] text-kado-red/[0.05]"
      >
        角
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-[1400px]"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mb-12 text-center sm:mb-16 md:mb-20"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-kado-red/20 bg-kado-red/10 px-3 py-2 kado-label text-kado-red shadow-sm sm:px-4">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />{' '}
            <CmsStyledText
              value={copy.badge}
              as="span"
              {...cmsTextProps(cmsEditMode, 'events.badge', 'Badge', (v) => updateEvents({ badge: v }))}
            />
          </span>
          <h2 className="kado-h2 px-1 leading-[1.08] text-kado-dark">
            <CmsStyledText
              value={copy.title}
              as="span"
              {...cmsTextProps(cmsEditMode, 'events.title', 'Title', (v) => updateEvents({ title: v }))}
            />
          </h2>
          <CmsStyledText
            value={copy.subtitle}
            as="p"
            className="mx-auto mt-5 max-w-3xl px-1 font-medium sm:mt-6 sm:px-4 md:px-0 md:text-base"
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
            <div className="group relative min-h-[min(68svh,520px)] w-full overflow-hidden rounded-2xl border border-kado-dark/20 shadow-2xl shadow-black/40 sm:min-h-[500px] sm:rounded-[2.5rem] md:rounded-[3rem] lg:min-h-[750px]">
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
                  className="h-full w-full object-cover brightness-[0.7] contrast-[1.1]"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/95 opacity-90" />
              <div className="absolute inset-0 flex flex-col justify-between gap-8 p-5 sm:p-8 lg:p-16">
                <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {(() => {
                    const { day, month } = formatDate(ev.startsAt);
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="shrink-0 self-start rounded-xl bg-kado-cream px-4 py-3 text-center leading-none text-kado-dark kado-h3 shadow-2xl sm:rounded-[1.5rem] sm:px-6 sm:py-4"
                      >
                        {day}
                        <br />
                        <span className="kado-label mt-1 block text-kado-red">{month}</span>
                      </motion.div>
                    );
                  })()}
                  {countdownTarget ? (
                    <div className="flex w-full flex-wrap justify-center gap-x-2 gap-y-2 rounded-xl border border-white/20 bg-black/60 px-3 py-3 shadow-2xl backdrop-blur-2xl sm:w-auto sm:justify-end sm:gap-4 sm:rounded-[2rem] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
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
                          {i > 0 && (
                            <span className="mt-1 hidden self-start font-bold text-white/30 sm:inline">:</span>
                          )}
                          <div className="min-w-[2.25rem] text-center">
                            <span className={`block kado-h3 leading-none ${red ? 'text-kado-red' : 'text-white'}`}>
                              {String(v).padStart(2, '0')}
                            </span>
                            <span className="kado-subtext mt-0.5 block font-semibold uppercase tracking-widest text-kado-cream/70 sm:mt-1">
                              {l}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center rounded-xl border border-kado-cream/30 bg-kado-red/30 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-kado-cream sm:rounded-[2rem] sm:px-6 sm:text-sm">
                      {lifecycle === 'current' ? 'Live now' : 'Details on events page'}
                    </div>
                  )}
                </div>
                <motion.div
                  className="mt-auto w-full max-w-3xl"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="mb-3 kado-h2 leading-[1.1] text-white sm:mb-4 lg:mb-6">{ev.title}</h3>
                  <p className="kado-body mb-6 line-clamp-6 leading-relaxed text-kado-cream/90 sm:mb-8 sm:line-clamp-none md:text-base">
                    {ev.description}
                  </p>
                  {durationLabel && (
                    <p className="mb-5 text-xs font-semibold text-kado-cream/80 sm:text-sm">
                      Event duration: {durationLabel}
                    </p>
                  )}
                  <Link
                    to={ctaHref}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-kado-red/40 bg-kado-red/90 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-kado-cream shadow-[0_0_30px_rgba(158,24,29,0.35)] backdrop-blur-md transition-all hover:bg-kado-red hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark sm:w-auto sm:gap-3 sm:px-8 sm:text-sm sm:tracking-[0.2em] lg:text-base"
                  >
                    {ctaLabel} <ArrowUpRight className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="py-16 text-center">
            <CalendarDays className="mx-auto mb-4 h-10 w-10 text-kado-red/40" />
            <CmsStyledText
              value={copy.noEventBody}
              as="p"
              className="text-sm"
              defaultColorClass="text-kado-dark/50"
              {...cmsTextProps(cmsEditMode, 'events.noEventBody', 'No events message', (v) =>
                updateEvents({ noEventBody: v }),
              )}
            />
            <Link to="/events" className="mt-4 inline-block text-sm font-bold text-kado-red hover:underline">
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
