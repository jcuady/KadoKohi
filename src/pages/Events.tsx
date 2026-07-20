/**
 * /events — Figma collage hero (Hero Social, darkened) + branch filters +
 * empty calendar / split event cards. Signup flows preserved.
 */
import { useEffect, useMemo, useState, type FC } from 'react';
import { useEventStore } from '../store/eventStore';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useBranchStore } from '../store/branchStore';
import EventSignupCountdown from '../components/events/EventSignupCountdown';
import EventSignupModal from '../components/events/EventSignupModal';
import { useSearchParams } from 'react-router-dom';
import {
  branchSlugFromFilter,
  eventImages,
  eventMatchesBranchFilter,
  getEventLifecyclePhase,
  getEventSignupPhase,
  resolveEventBranchFilter,
  signupCountdownTarget,
  type EventBranchFilter,
} from '../lib/eventTiming';
import type { Event } from '../types/domain';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import CollagePageHero from '../components/seo/CollagePageHero';
import EmptyCalendarMark from '../components/events/EmptyCalendarMark';
import { toWebpSrc } from '../lib/toWebpSrc';
import {
  EVENTS_HERO_POLAROIDS,
  EVENTS_HERO_STICKERS,
} from '../data/collageHeroMedia';

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeRange(startsAt: string, endsAt?: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return '';
  const startLabel = start.toLocaleTimeString('en-US', opts);
  if (!endsAt) return startLabel;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return startLabel;
  return `${startLabel} - ${end.toLocaleTimeString('en-US', opts)}`;
}

function formatSignupDeadline(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function branchPillLabel(name: string): string {
  const n = name.trim();
  if (/^kado\s/i.test(n)) return n.toUpperCase();
  return `KADO KOHI - ${n}`.toUpperCase();
}

export default function Events() {
  const allEvents = useEventStore((s) => s.events);
  const [signupEvent, setSignupEvent] = useState<Event | null>(null);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    void orderingRepo.fetchEventRegistrationCounts().then(setRegCounts).catch(() => {});
  }, []);

  const refreshCounts = () => {
    void orderingRepo.fetchEventRegistrationCounts().then(setRegCounts).catch(() => {});
  };

  const visible = useMemo(
    () =>
      [...allEvents]
        .filter((e) => e.visible)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [allEvents],
  );

  const branches = useBranchStore((s) => s.branches);
  const hydrateBranches = useBranchStore((s) => s.hydrateFromRemote);
  const activeBranches = useMemo(
    () => branches.filter((b) => b.status === 'active').sort((a, b) => a.name.localeCompare(b.name)),
    [branches],
  );

  useEffect(() => {
    void hydrateBranches();
  }, [hydrateBranches]);

  const branchFilter = useMemo(
    () => resolveEventBranchFilter(searchParams.get('branch'), branches),
    [searchParams, branches],
  );

  const setBranchFilter = (next: EventBranchFilter) => {
    const params = new URLSearchParams(searchParams);
    const slug = branchSlugFromFilter(next, branches);
    if (slug) params.set('branch', slug);
    else params.delete('branch');
    setSearchParams(params, { replace: true });
  };

  const branchName = (id?: string | null) => branches.find((b) => b.id === id)?.name ?? 'All branches';
  const branchMeta = (id?: string | null) => branches.find((b) => b.id === id);
  const branchFilterLabel =
    branchFilter === 'all' ? 'All branches' : branchName(branchFilter);

  const branchFiltered = useMemo(
    () => visible.filter((e) => eventMatchesBranchFilter(e, branchFilter)),
    [visible, branchFilter],
  );

  // ponytail: one list (current + upcoming); past stays hidden — Figma has no Upcoming/Now tabs
  const listed = useMemo(
    () =>
      branchFiltered.filter((e) => {
        const phase = getEventLifecyclePhase(e);
        return phase === 'upcoming' || phase === 'current';
      }),
    [branchFiltered],
  );

  useEffect(() => {
    const eventId = searchParams.get('event');
    if (!eventId || visible.length === 0) return;
    const evt = visible.find((e) => e.id === eventId);
    if (!evt) return;
    const signupPhase = getEventSignupPhase(evt, regCounts[evt.id] ?? 0);
    if (signupPhase === 'open') {
      setSignupEvent(evt);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('event');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, visible, regCounts]);

  const emptyPrimary =
    branchFilter === 'all'
      ? 'No upcoming events right now.'
      : `No upcoming events for ${branchFilterLabel} right now.`;

  return (
    <div className="flex min-h-screen w-full flex-col bg-kado-cream font-sans text-kado-dark">
      <CollagePageHero
        titleId="events-page-title"
        eyebrow="What's happening"
        title="Kado Coffee Events"
        description="Event coffee, tambayan nights, and community gatherings at Kado Coffee — Marikina & Greenhills."
        polaroids={EVENTS_HERO_POLAROIDS}
        stickers={EVENTS_HERO_STICKERS}
      />

      {/* Branch filters */}
      <div className="border-b border-kado-dark/5 bg-kado-cream px-[max(1rem,env(safe-area-inset-left))] py-5 pr-[max(1rem,env(safe-area-inset-right))] sm:py-6">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setBranchFilter('all')}
            className={`min-h-[44px] rounded-full px-5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2 focus-visible:ring-offset-kado-cream ${
              branchFilter === 'all'
                ? 'bg-kado-red text-kado-cream'
                : 'border border-kado-red bg-kado-cream text-kado-red hover:bg-kado-red/5'
            }`}
          >
            All branches
          </button>
          {activeBranches.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBranchFilter(b.id)}
              className={`min-h-[44px] rounded-full px-5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2 focus-visible:ring-offset-kado-cream ${
                branchFilter === b.id
                  ? 'bg-kado-red text-kado-cream'
                  : 'border border-kado-red bg-kado-cream text-kado-red hover:bg-kado-red/5'
              }`}
            >
              {branchPillLabel(b.name)}
            </button>
          ))}
        </div>
      </div>

      {listed.length === 0 ? (
        <section
          aria-live="polite"
          className="flex min-h-[min(52svh,28rem)] flex-col items-center justify-center bg-kado-red px-6 py-16 text-center sm:min-h-[32rem] sm:py-20"
        >
          <div className="mx-auto flex w-full max-w-md flex-col items-center">
            <EmptyCalendarMark className="mb-8 sm:mb-10" />
            <p className="font-sans text-base font-semibold text-kado-cream sm:text-lg">{emptyPrimary}</p>
            <p className="mt-1.5 font-sans text-sm text-kado-cream/85 sm:text-base">Check back soon</p>
          </div>
        </section>
      ) : (
        <section className="bg-kado-cream px-[max(1rem,env(safe-area-inset-left))] py-10 pr-[max(1rem,env(safe-area-inset-right))] sm:py-14">
          <div className="mx-auto max-w-5xl space-y-0 divide-y divide-kado-red/40">
            {listed.map((evt) => (
              <EventRow
                key={evt.id}
                evt={evt}
                branchLabel={branchName(evt.branchId)}
                locationLine={
                  (() => {
                    const b = branchMeta(evt.branchId);
                    if (!b) return branchName(evt.branchId);
                    const parts = [b.address, b.city].filter(Boolean);
                    return parts.length ? parts.join(', ') : b.name;
                  })()
                }
                branchPill={branchPillLabel(branchName(evt.branchId))}
                registrationCount={regCounts[evt.id] ?? 0}
                onSignUp={() => setSignupEvent(evt)}
              />
            ))}
          </div>
        </section>
      )}

      {signupEvent && (
        <EventSignupModal event={signupEvent} onClose={() => setSignupEvent(null)} onSuccess={refreshCounts} />
      )}

      <PageSeoBlurb />
    </div>
  );
}

type EventRowProps = {
  evt: Event;
  branchLabel: string;
  locationLine: string;
  branchPill: string;
  registrationCount: number;
  onSignUp: () => void;
};

const EventRow: FC<EventRowProps> = ({
  evt,
  branchLabel,
  locationLine,
  branchPill,
  registrationCount,
  onSignUp,
}) => {
  const images = eventImages(evt);
  const cover = images[0] ? toWebpSrc(images[0]) || images[0] : null;
  const coverFallback = images[0] ?? null;
  const phase = getEventLifecyclePhase(evt);
  const signupPhase = getEventSignupPhase(evt, registrationCount);
  const countdownTarget = signupCountdownTarget(evt, signupPhase);
  const countdownLabel =
    signupPhase === 'not_yet_open' ? 'Sign-ups open in' : signupPhase === 'open' ? 'Sign up until' : '';
  const timeLabel = formatTimeRange(evt.startsAt, evt.endsAt);
  const showSignup = evt.signupEnabled;
  const showExternalCta = !showSignup && evt.cta;

  return (
    <article
      id={`event-${evt.id}`}
      className="grid grid-cols-1 overflow-hidden lg:grid-cols-2"
    >
      {/* Info — brand red */}
      <div
        className="relative flex flex-col justify-center bg-kado-red px-6 py-8 text-kado-cream sm:px-8 sm:py-10 lg:px-10"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      >
        <h2 className="font-display text-[clamp(1.35rem,2.5vw,1.85rem)] font-bold leading-tight text-white">
          {evt.title}
        </h2>
        <ul className="mt-5 space-y-2.5 font-sans text-sm text-kado-cream/95">
          <li className="flex items-start gap-2.5">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-kado-cream" aria-hidden />
            <span>{formatEventDate(evt.startsAt)}</span>
          </li>
          {timeLabel ? (
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-kado-cream" aria-hidden />
              <span>{timeLabel}</span>
            </li>
          ) : null}
          <li className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-kado-cream" aria-hidden />
            <span>{locationLine || branchLabel}</span>
          </li>
        </ul>

        {evt.description ? (
          <p className="mt-4 line-clamp-3 font-sans text-sm leading-relaxed text-kado-cream/80">
            {evt.description}
          </p>
        ) : null}

        {showSignup && (
          <div className="mt-5 space-y-2 rounded-xl bg-kado-cream/95 p-3 text-kado-dark shadow-sm">
            <EventSignupCountdown targetIso={countdownTarget} phase={signupPhase} label={countdownLabel} />
            {evt.signupClosesAt && signupPhase === 'open' ? (
              <p className="text-[10px] font-medium text-kado-dark/60">
                Deadline: {formatSignupDeadline(evt.signupClosesAt)}
              </p>
            ) : null}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {showSignup && signupPhase === 'open' ? (
            <button
              type="button"
              onClick={onSignUp}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-kado-cream px-6 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-kado-red transition-colors hover:bg-kado-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream"
            >
              {evt.cta?.label?.trim() || 'Sign up'}
            </button>
          ) : null}
          {showSignup && signupPhase !== 'open' ? (
            <button
              type="button"
              disabled
              className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-full border border-kado-cream/30 px-6 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-kado-cream/50"
            >
              {signupPhase === 'not_yet_open'
                ? 'Sign-ups not open yet'
                : signupPhase === 'full'
                  ? 'Event full'
                  : 'Sign-ups closed'}
            </button>
          ) : null}
          {showExternalCta ? (
            <a
              href={evt.cta!.href}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-kado-cream px-6 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-kado-red transition-colors hover:bg-kado-offwhite"
            >
              {evt.cta!.label}
            </a>
          ) : null}
        </div>
      </div>

      {/* Visual */}
      <div className="relative min-h-[14rem] bg-kado-dark sm:min-h-[18rem] lg:min-h-[22rem]">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              if (coverFallback && e.currentTarget.src !== coverFallback) {
                e.currentTarget.src = coverFallback;
              }
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-kado-dark/90">
            <span className="font-display text-5xl font-black text-kado-cream/15" aria-hidden>
              角
            </span>
          </div>
        )}

        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2 sm:left-4 sm:top-4">
          {phase === 'current' ? (
            <span className="rounded-full bg-kado-cream px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-kado-red">
              Happening now
            </span>
          ) : null}
          {evt.highlight && phase !== 'current' ? (
            <span className="rounded-full bg-kado-cream px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-kado-red">
              Featured
            </span>
          ) : null}
        </div>
        <span className="absolute right-3 top-3 z-10 max-w-[55%] truncate rounded-full bg-kado-red px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-kado-cream sm:right-4 sm:top-4">
          {branchPill}
        </span>
      </div>
    </article>
  );
};
