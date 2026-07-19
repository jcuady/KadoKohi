/**
 * /events — Figma: darkened Hero Social hero, branch pills,
 * empty red calendar panel, 50/50 event rows.
 */
import { useEffect, useMemo, useState, type FC, type ReactNode } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useEventStore } from '../store/eventStore';
import { useBranchStore } from '../store/branchStore';
import EventSignupCountdown from '../components/events/EventSignupCountdown';
import EventSignupModal from '../components/events/EventSignupModal';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
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
import { toWebpSrc } from '../lib/toWebpSrc';

const HERO_WEBP = '/events/hero-social.webp';
const HERO_JPG = '/events/hero-social.jpg';
const EMPTY_CAL_WEBP = '/events/calendar-icon.webp';
const EMPTY_CAL_PNG = '/events/calendar-icon.png';

function formatLongDate(iso: string): string {
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

  const branchName = (id?: string | null) => {
    if (!id) return 'Kado Kohi — Pop Ups';
    return branches.find((b) => b.id === id)?.name ?? 'Kado Kohi';
  };

  const visible = useMemo(
    () =>
      [...allEvents]
        .filter((e) => e.visible)
        .filter((e) => {
          const phase = getEventLifecyclePhase(e);
          return phase === 'upcoming' || phase === 'current';
        })
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [allEvents],
  );

  const filtered = useMemo(
    () => visible.filter((e) => eventMatchesBranchFilter(e, branchFilter)),
    [visible, branchFilter],
  );

  useEffect(() => {
    const eventId = searchParams.get('event');
    if (!eventId || visible.length === 0) return;
    const evt = visible.find((e) => e.id === eventId);
    if (!evt) return;
    const signupPhase = getEventSignupPhase(evt, regCounts[evt.id] ?? 0);
    if (signupPhase === 'open') setSignupEvent(evt);
    const next = new URLSearchParams(searchParams);
    next.delete('event');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, visible, regCounts]);

  const emptyCopy =
    branchFilter === 'all'
      ? { line1: 'No upcoming events right now.', line2: 'Check back soon' }
      : {
          line1: `No upcoming events for ${branchName(branchFilter)} right now.`,
          line2: 'Check back soon',
        };

  return (
    <div className="flex min-h-screen w-full flex-col bg-kado-cream font-sans">
      {/* Hero — darkened Hero Social */}
      <section className="relative flex min-h-[min(58svh,28rem)] w-full items-center justify-center overflow-hidden sm:min-h-[32rem]">
        <picture className="absolute inset-0 block h-full w-full">
          <source type="image/webp" srcSet={HERO_WEBP} />
          <img
            src={HERO_JPG}
            alt=""
            className="h-full w-full object-cover object-center"
            width={1920}
            height={1080}
            decoding="async"
            fetchPriority="high"
            onError={(e) => {
              e.currentTarget.src = '/heroes/social.webp';
            }}
          />
        </picture>
        <div aria-hidden className="absolute inset-0 bg-kado-dark/62" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-kado-dark/50 via-transparent to-kado-dark/25" />

        <div className="relative z-10 mx-auto max-w-3xl px-5 pb-10 pt-[calc(var(--public-nav-height)+2.5rem)] text-center sm:px-8 sm:pb-14">
          <span className="mb-4 inline-flex rounded-full bg-kado-red px-3.5 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-kado-cream sm:mb-5">
            What&apos;s Happening
          </span>
          <h1 className="font-sans text-[clamp(1.85rem,5.5vw,3rem)] font-bold uppercase leading-[1.05] tracking-tight text-white">
            Kado Coffee Events
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-sans text-sm leading-relaxed text-white/90 sm:mt-4 sm:text-base">
            Event coffee, tambayan nights, and community gatherings at Kado Coffee — Marikina &amp;
            Greenhills.
          </p>
        </div>
      </section>

      {/* Branch filters */}
      <div className="border-b border-kado-dark/5 bg-kado-cream px-4 py-4 sm:px-6 sm:py-5">
        <div
          className="mx-auto flex max-w-5xl flex-wrap justify-center gap-2"
          role="tablist"
          aria-label="Filter events by branch"
        >
          <FilterPill active={branchFilter === 'all'} onClick={() => setBranchFilter('all')}>
            All Branches
          </FilterPill>
          {activeBranches.map((b) => (
            <span key={b.id} className="contents">
              <FilterPill active={branchFilter === b.id} onClick={() => setBranchFilter(b.id)}>
                {b.name}
              </FilterPill>
            </span>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <section className="flex min-h-[min(52svh,26rem)] flex-col items-center justify-center bg-kado-red px-6 py-16 text-center sm:min-h-[30rem] sm:py-20">
          <picture>
            <source type="image/webp" srcSet={EMPTY_CAL_WEBP} />
            <img
              src={EMPTY_CAL_PNG}
              alt=""
              width={589}
              height={603}
              decoding="async"
              className="mb-8 h-auto w-[min(48%,13rem)] max-w-[14rem] object-contain sm:mb-10 sm:w-56"
              draggable={false}
            />
          </picture>
          <p className="font-sans text-base font-semibold text-kado-cream sm:text-lg">{emptyCopy.line1}</p>
          <p className="mt-1.5 font-sans text-sm text-kado-cream/85 sm:text-base">{emptyCopy.line2}</p>
        </section>
      ) : (
        <section className="bg-kado-cream">
          {filtered.map((evt, i) => (
            <div key={evt.id}>
              <EventRow
                evt={evt}
                branchLabel={branchName(evt.branchId)}
                registrationCount={regCounts[evt.id] ?? 0}
                onSignUp={() => setSignupEvent(evt)}
              />
              {i < filtered.length - 1 ? (
                <div className="flex justify-center bg-kado-cream py-0" aria-hidden>
                  <div className="h-px w-full max-w-[1400px] bg-kado-red/25">
                    <div className="mx-auto h-0.5 w-16 -translate-y-px bg-kado-red/70" />
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </section>
      )}

      {signupEvent ? (
        <EventSignupModal event={signupEvent} onClose={() => setSignupEvent(null)} onSuccess={refreshCounts} />
      ) : null}

      <PageSeoBlurb />
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-[44px] rounded-full px-4 py-2.5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] transition-colors sm:px-5 ${
        active
          ? 'bg-kado-red text-kado-cream shadow-md shadow-kado-red/20'
          : 'border border-kado-red/40 bg-transparent text-kado-red hover:bg-kado-red/5'
      }`}
    >
      {children}
    </button>
  );
}

type EventRowProps = {
  evt: Event;
  branchLabel: string;
  registrationCount: number;
  onSignUp: () => void;
};

const EventRow: FC<EventRowProps> = ({ evt, branchLabel, registrationCount, onSignUp }) => {
  const images = eventImages(evt);
  const cover = images[0] || '/booth-photos/booth-1.jpg';
  const lifecycle = getEventLifecyclePhase(evt);
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
      className="mx-auto grid w-full max-w-[1400px] grid-cols-1 lg:grid-cols-2 lg:min-h-[22rem]"
    >
      {/* Info — red */}
      <div className="relative flex flex-col justify-center overflow-hidden bg-kado-red px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(241,223,186,0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(241,223,186,0.55) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative z-10 max-w-lg">
          <h2 className="font-sans text-[clamp(1.5rem,3vw,2.15rem)] font-bold leading-tight tracking-tight text-kado-cream">
            {evt.title}
          </h2>
          <ul className="mt-6 space-y-3 font-sans text-sm text-kado-cream/95 sm:text-[0.95rem]">
            <li className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-kado-cream" aria-hidden />
              <span>{formatLongDate(evt.startsAt)}</span>
            </li>
            {timeLabel ? (
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-kado-cream" aria-hidden />
                <span>{timeLabel}</span>
              </li>
            ) : null}
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-kado-cream" aria-hidden />
              <span>{branchLabel}</span>
            </li>
          </ul>

          {evt.description?.trim() ? (
            <p className="mt-5 line-clamp-4 font-sans text-sm leading-relaxed text-kado-cream/80">
              {evt.description}
            </p>
          ) : null}

          {showSignup ? (
            <div className="mt-6 space-y-2">
              <EventSignupCountdown targetIso={countdownTarget} phase={signupPhase} label={countdownLabel} />
              {evt.signupClosesAt && signupPhase === 'open' ? (
                <p className="text-[10px] font-medium text-kado-cream/60">
                  Deadline: {formatSignupDeadline(evt.signupClosesAt)}
                </p>
              ) : null}
              {signupPhase === 'open' ? (
                <button
                  type="button"
                  onClick={onSignUp}
                  className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-full bg-kado-cream px-6 py-2.5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-kado-red transition-colors hover:bg-kado-offwhite"
                >
                  {evt.cta?.label?.trim() || 'Sign up'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-2 inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-full border border-kado-cream/30 px-6 py-2.5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-kado-cream/50"
                >
                  {signupPhase === 'not_yet_open'
                    ? 'Sign-ups not open yet'
                    : signupPhase === 'full'
                      ? 'Event full'
                      : 'Sign-ups closed'}
                </button>
              )}
            </div>
          ) : null}

          {showExternalCta ? (
            <a
              href={evt.cta!.href}
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-kado-cream px-6 py-2.5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-kado-red transition-colors hover:bg-kado-offwhite"
            >
              {evt.cta!.label}
            </a>
          ) : null}
        </div>
      </div>

      {/* Photo */}
      <div className="relative min-h-[16rem] overflow-hidden bg-kado-dark sm:min-h-[20rem] lg:min-h-full">
        <img
          src={toWebpSrc(cover) || cover}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          sizes="(max-width: 1024px) 100vw, 50vw"
          onError={(e) => {
            if (e.currentTarget.src !== cover) e.currentTarget.src = cover;
          }}
        />
        {lifecycle === 'current' ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-kado-cream px-3 py-1.5 font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-kado-red sm:left-4 sm:top-4">
            Happening Now
          </span>
        ) : null}
        <span className="absolute right-3 top-3 z-10 max-w-[55%] truncate rounded-full bg-kado-red px-3 py-1.5 font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-kado-cream sm:right-4 sm:top-4">
          {branchLabel}
        </span>
      </div>
    </article>
  );
};
