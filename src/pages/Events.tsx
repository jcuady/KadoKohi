import { useEffect, useMemo, useState, type FC } from 'react';
import { useEventStore } from '../store/eventStore';
import { Calendar, MapPin } from 'lucide-react';
import { useBranchStore } from '../store/branchStore';
import EventImageGallery from '../components/events/EventImageGallery';
import EventSignupCountdown from '../components/events/EventSignupCountdown';
import EventSignupModal from '../components/events/EventSignupModal';
import { useSearchParams } from 'react-router-dom';
import {
  branchSlugFromFilter,
  eventDurationLabel,
  eventImages,
  eventMatchesBranchFilter,
  getEventLifecyclePhase,
  getEventSignupPhase,
  resolveEventBranchFilter,
  signupCountdownTarget,
  type EventBranchFilter,
  type EventLifecyclePhase,
} from '../lib/eventTiming';
import type { Event } from '../types/domain';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import PublicPageBanner from '../components/seo/PublicPageBanner';

type Tab = 'upcoming' | 'current';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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
  const [tab, setTab] = useState<Tab>('upcoming');
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
  const branchFilterLabel =
    branchFilter === 'all' ? 'All branches' : branchName(branchFilter);

  const branchFiltered = useMemo(
    () => visible.filter((e) => eventMatchesBranchFilter(e, branchFilter)),
    [visible, branchFilter],
  );

  const filtered = useMemo(() => {
    const phase: EventLifecyclePhase = tab;
    return branchFiltered.filter((e) => getEventLifecyclePhase(e) === phase);
  }, [branchFiltered, tab]);

  useEffect(() => {
    if (branchFiltered.some((e) => getEventLifecyclePhase(e) === 'current')) {
      setTab('current');
    } else {
      setTab('upcoming');
    }
  }, [branchFiltered]);

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

  const lifecycleEmptyMessage =
    tab === 'upcoming'
      ? branchFilter === 'all'
        ? 'No upcoming events right now. Check back soon!'
        : `No upcoming events for ${branchFilterLabel} right now. Check back soon!`
      : branchFilter === 'all'
        ? 'No events happening right now.'
        : `No events happening at ${branchFilterLabel} right now.`;

  return (
    <div className="flex flex-col w-full bg-white font-sans min-h-screen">
      <PublicPageBanner
        eyebrow="What's happening"
        title="Kado Coffee Events"
        description="Event coffee, tambayan nights, and community gatherings at Kado Coffee — Marikina & Greenhills."
      >
        <div className="flex flex-wrap justify-center gap-2">
          {(['upcoming', 'current'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`min-h-[44px] rounded-full px-6 text-[10px] font-black uppercase tracking-widest transition-colors ${
                tab === key
                  ? 'bg-kado-dark text-kado-cream shadow-md'
                  : 'border border-kado-dark/15 bg-white text-kado-dark/60 hover:border-kado-red/40'
              }`}
            >
              {key === 'upcoming' ? 'Upcoming' : 'Happening now'}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setBranchFilter('all')}
            className={`min-h-[44px] rounded-full px-5 text-[10px] font-black uppercase tracking-widest transition-colors ${
              branchFilter === 'all'
                ? 'bg-kado-red text-white shadow-md shadow-kado-red/20'
                : 'border border-kado-dark/15 bg-white text-kado-dark/60 hover:border-kado-red/40'
            }`}
          >
            All branches
          </button>
          {activeBranches.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBranchFilter(b.id)}
              className={`min-h-[44px] rounded-full px-5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                branchFilter === b.id
                  ? 'bg-kado-red text-white shadow-md shadow-kado-red/20'
                  : 'border border-kado-dark/15 bg-white text-kado-dark/60 hover:border-kado-red/40'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </PublicPageBanner>

      <section className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-kado-dark/55 text-sm font-medium py-12">{lifecycleEmptyMessage}</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filtered.map((evt) => (
                <EventCard
                  key={evt.id}
                  evt={evt}
                  branchLabel={branchName(evt.branchId)}
                  branchHighlighted={branchFilter !== 'all' && Boolean(evt.branchId)}
                  registrationCount={regCounts[evt.id] ?? 0}
                  onSignUp={() => setSignupEvent(evt)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {signupEvent && (
        <EventSignupModal event={signupEvent} onClose={() => setSignupEvent(null)} onSuccess={refreshCounts} />
      )}

      <PageSeoBlurb />
    </div>
  );
}

type EventCardProps = {
  evt: Event;
  branchLabel: string;
  branchHighlighted?: boolean;
  registrationCount: number;
  onSignUp: () => void;
};

const EventCard: FC<EventCardProps> = ({
  evt,
  branchLabel,
  branchHighlighted = false,
  registrationCount,
  onSignUp,
}) => {
  const images = eventImages(evt);
  const signupPhase = getEventSignupPhase(evt, registrationCount);
  const countdownTarget = signupCountdownTarget(evt, signupPhase);
  const countdownLabel =
    signupPhase === 'not_yet_open' ? 'Sign-ups open in' : signupPhase === 'open' ? 'Sign up until' : '';
  const durationLabel = eventDurationLabel(evt);

  const showSignup = evt.signupEnabled;
  const showExternalCta = !showSignup && evt.cta;

  return (
    <article id={`event-${evt.id}`} className="rounded-[1.5rem] border border-kado-dark/10 bg-white overflow-hidden hover:shadow-[0_20px_40px_rgba(158,24,29,0.08)] hover:-translate-y-1 hover:border-kado-red/30 transition-all duration-400 group">
      {images.length > 0 && (
        <div className="relative">
          <EventImageGallery images={images} alt={evt.title} />
          {evt.highlight && (
            <span className="absolute top-4 left-4 z-10 inline-block text-[9px] font-black uppercase tracking-widest bg-kado-red text-white px-3 py-1.5 rounded-full shadow-md shadow-kado-red/20">
              Featured
            </span>
          )}
        </div>
      )}
      <div className="p-8">
        {evt.highlight && images.length === 0 && (
          <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-kado-red text-white px-3 py-1.5 rounded-full mb-5 shadow-md shadow-kado-red/20">
            Featured
          </span>
        )}
        <h3 className="font-display text-xl md:text-2xl font-black text-kado-dark mb-3 group-hover:text-kado-red transition-colors leading-tight">
          {evt.title}
        </h3>
        <p className="text-sm font-medium text-kado-dark/60 leading-relaxed mb-4">{evt.description}</p>

        {showSignup && (
          <div className="mb-4 space-y-2">
            <EventSignupCountdown targetIso={countdownTarget} phase={signupPhase} label={countdownLabel} />
            {evt.signupClosesAt && signupPhase === 'open' && (
              <p className="text-[10px] text-kado-dark/50 font-medium">
                Deadline: {formatSignupDeadline(evt.signupClosesAt)}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2.5 text-xs text-kado-dark/60 font-bold mb-6">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-kado-red" />
            {formatDate(evt.startsAt)}
          </span>
          {durationLabel && (
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-kado-red" />
              Duration: {durationLabel}
            </span>
          )}
          <span
            className={`flex items-center gap-2 ${branchHighlighted ? 'text-kado-red' : ''}`}
          >
            <MapPin className="w-4 h-4 text-kado-red" />
            {branchLabel}
          </span>
        </div>

        {showSignup && signupPhase === 'open' && (
          <button
            type="button"
            onClick={onSignUp}
            className="inline-flex items-center justify-center rounded-full bg-kado-dark text-white px-6 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-kado-red hover:shadow-lg hover:shadow-kado-red/30 transition-all w-full sm:w-auto"
          >
            {evt.cta?.label?.trim() || 'Sign up'}
          </button>
        )}

        {showSignup && signupPhase !== 'open' && (
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center rounded-full border border-kado-dark/15 text-kado-dark/40 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest cursor-not-allowed w-full sm:w-auto"
          >
            {signupPhase === 'not_yet_open'
              ? 'Sign-ups not open yet'
              : signupPhase === 'full'
                ? 'Event full'
                : 'Sign-ups closed'}
          </button>
        )}

        {showExternalCta && (
          <a
            href={evt.cta!.href}
            className="inline-flex items-center justify-center rounded-full bg-kado-dark text-white px-6 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-kado-red hover:shadow-lg hover:shadow-kado-red/30 transition-all"
          >
            {evt.cta!.label}
          </a>
        )}
      </div>
    </article>
  );
};
