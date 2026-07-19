/**
 * Events & Tambayan — “More than a Corner.”
 * Figma: cream copy column + red (empty) / photo (active) column.
 */
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEventStore } from '../../store/eventStore';
import { useBranchStore } from '../../store/branchStore';
import { hydrateEvents } from '../../lib/bootstrapHydration';
import {
  eventImages,
  getEventSignupPhase,
  pickCurrentOrUpcoming,
} from '../../lib/eventTiming';
import type { EventsCopy } from '../../store/landingContentStore';
import CmsStyledText from '../cms/CmsStyledText';
import CmsEditableImage from '../cms/CmsEditableImage';
import { cmsTextProps } from '../../lib/cmsFieldBind';
import { useLandingContentStore } from '../../store/landingContentStore';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { toWebpSrc } from '../../lib/toWebpSrc';
import type { Event } from '../../types/domain';
import { cmsTextPlain } from '../../lib/cmsTypography';
import type { CmsText } from '../../lib/cmsTypography';

const FALLBACK_EVENT_IMG = '/featuredmarikina/kadom2.jpg';
const EMPTY_CALENDAR_WEBP = '/events/calendar-icon.webp';
const EMPTY_CALENDAR_PNG = '/events/calendar-icon.png';
/** Intrinsic size of Vector Arts calendar export (keep crisp ≥2× display). */
const CALENDAR_W = 589;
const CALENDAR_H = 603;

type Props = { copy: EventsCopy; cmsEditMode?: boolean };

function formatBadgeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const month = d.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  return `${month} ${d.getDate()}`;
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

function emptyBodyLines(body: CmsText | undefined): [string, string] {
  const trimmed = cmsTextPlain(body).trim();
  const parts = trimmed.split(/(?<=\.)\s+/).filter(Boolean);
  if (parts.length >= 2) return [parts[0]!, parts.slice(1).join(' ')];
  return [trimmed || 'No upcoming events right now.', 'Check back soon'];
}

function LeftColumn({
  copy,
  cmsEditMode,
  eventsHref,
}: {
  copy: EventsCopy;
  cmsEditMode?: boolean;
  eventsHref: string;
}) {
  const updateEvents = useLandingContentStore((s) => s.updateEvents);

  return (
    <div className="relative flex min-h-[min(52svh,28rem)] flex-col justify-center overflow-hidden bg-kado-cream px-6 py-12 sm:min-h-[32rem] sm:px-10 lg:px-14 lg:py-16 xl:px-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-4 top-0 select-none font-display text-[clamp(7rem,28vw,14rem)] font-black leading-none text-[#CDB892]/40"
      >
        角
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-6 bottom-0 select-none font-display text-[clamp(5rem,20vw,11rem)] font-black leading-none text-[#CDB892]/30"
      >
        角
      </div>

      <div className="relative z-10 max-w-lg">
        <span className="inline-flex items-center gap-2 rounded-full border border-kado-red/35 bg-[#F7EBD8] px-3 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-kado-red sm:px-3.5">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <CmsStyledText
            value={copy.badge}
            as="span"
            {...cmsTextProps(cmsEditMode, 'events.badge', 'Badge', (v) => updateEvents({ badge: v }))}
          />
        </span>

        <h2 className="mt-5 font-sans text-[clamp(1.85rem,3.8vw,2.75rem)] font-bold leading-[1.12] tracking-tight text-kado-dark sm:mt-6">
          <CmsStyledText
            value={copy.title}
            as="span"
            className="font-sans text-[clamp(1.85rem,3.8vw,2.75rem)] font-bold leading-[1.12] tracking-tight text-kado-dark"
            {...cmsTextProps(cmsEditMode, 'events.title', 'Title', (v) => updateEvents({ title: v }))}
          />
        </h2>

        <CmsStyledText
          value={copy.subtitle}
          as="p"
          className="mt-4 max-w-md font-sans text-[0.95rem] leading-relaxed text-kado-dark/80 sm:mt-5 sm:text-base"
          {...cmsTextProps(cmsEditMode, 'events.subtitle', 'Subtitle', (v) => updateEvents({ subtitle: v }))}
        />

        <Link
          to={eventsHref}
          className="mt-7 inline-flex items-center gap-2 font-sans text-sm font-bold text-kado-red transition-colors hover:text-kado-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2 focus-visible:ring-offset-kado-cream sm:mt-8 sm:text-[0.95rem]"
        >
          <CmsStyledText
            value={copy.noEventBrowseLabel}
            as="span"
            {...cmsTextProps(cmsEditMode, 'events.noEventBrowseLabel', 'Events CTA', (v) =>
              updateEvents({ noEventBrowseLabel: v }),
            )}
          />
        </Link>
      </div>
    </div>
  );
}

function EmptyRight({
  copy,
  cmsEditMode,
}: {
  copy: EventsCopy;
  cmsEditMode?: boolean;
}) {
  const updateEvents = useLandingContentStore((s) => s.updateEvents);
  const [line1, line2] = emptyBodyLines(copy.noEventBody);

  return (
    <div className="relative flex min-h-[min(48svh,26rem)] flex-col items-center justify-center bg-kado-red px-6 py-14 text-center sm:min-h-[32rem] sm:px-10 lg:py-16">
      <div className="mb-8 flex items-center justify-center sm:mb-10">
        <picture>
          <source
            type="image/webp"
            srcSet={`${EMPTY_CALENDAR_WEBP} ${CALENDAR_W}w`}
            sizes="(max-width: 640px) 48vw, 240px"
          />
          <img
            src={EMPTY_CALENDAR_PNG}
            srcSet={`${EMPTY_CALENDAR_PNG} ${CALENDAR_W}w`}
            sizes="(max-width: 640px) 48vw, 240px"
            alt=""
            width={CALENDAR_W}
            height={CALENDAR_H}
            decoding="async"
            fetchPriority="low"
            className="h-auto w-[min(52%,15rem)] max-w-[15rem] object-contain select-none sm:w-[16rem] sm:max-w-none"
            draggable={false}
          />
        </picture>
      </div>
      {/* CMS binds full body; split visual for Figma two-line stack */}
      <div className="max-w-sm">
        {cmsEditMode ? (
          <CmsStyledText
            value={copy.noEventBody}
            as="p"
            className="font-sans text-base leading-snug text-white sm:text-lg"
            {...cmsTextProps(cmsEditMode, 'events.noEventBody', 'No events message', (v) =>
              updateEvents({ noEventBody: v }),
            )}
          />
        ) : (
          <>
            <p className="font-sans text-base font-semibold leading-snug text-kado-cream sm:text-lg">{line1}</p>
            <p className="mt-1.5 font-sans text-sm font-normal text-kado-cream/85 sm:text-base">{line2}</p>
          </>
        )}
      </div>
    </div>
  );
}

function ActiveRight({
  event,
  coverSrc,
  heroImage,
  cmsEditMode,
  onCoverChange,
  ctaHref,
}: {
  event: Event;
  coverSrc: string;
  heroImage: string;
  cmsEditMode?: boolean;
  onCoverChange: (url: string) => void;
  ctaHref: string;
}) {
  const dateLabel = formatBadgeDate(event.startsAt);
  const timeLabel = formatTimeRange(event.startsAt, event.endsAt);

  const media = cmsEditMode ? (
    <CmsEditableImage
      cmsField="events.cover"
      cmsLabel="Events cover image"
      src={coverSrc}
      alt={event.title}
      className="absolute inset-0 h-full w-full"
      onImageChange={onCoverChange}
    />
  ) : (
    <img
      src={toWebpSrc(heroImage) || heroImage}
      alt=""
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      loading="lazy"
      decoding="async"
      sizes="(max-width: 1024px) 100vw, 50vw"
      onError={(e) => {
        if (e.currentTarget.src !== heroImage) e.currentTarget.src = heroImage;
      }}
    />
  );

  const badge = (
    <div className="absolute right-4 top-4 z-20 w-[min(42%,11.5rem)] overflow-hidden rounded-md bg-white shadow-lg sm:right-5 sm:top-5 sm:w-44">
      <div className="bg-kado-red px-2.5 py-1.5 text-center font-sans text-[10px] font-black uppercase tracking-[0.14em] text-kado-cream sm:text-[11px]">
        Kado Kōhī
      </div>
      <div className="px-2.5 py-2.5 text-center sm:px-3 sm:py-3">
        <p className="font-sans text-lg font-bold leading-none tracking-tight text-kado-red sm:text-xl">
          {dateLabel}
        </p>
        {timeLabel ? (
          <p className="mt-1.5 font-sans text-[10px] font-medium leading-tight text-kado-dark/55 sm:text-[11px]">
            {timeLabel}
          </p>
        ) : null}
      </div>
    </div>
  );

  const bar = (
    <div className="absolute inset-x-0 bottom-0 z-20 flex items-end gap-3 bg-kado-red px-4 py-4 sm:px-5 sm:py-5">
      <div className="min-w-0 flex-1">
        <h3 className="font-sans text-base font-bold leading-snug text-white sm:text-lg">{event.title}</h3>
        <p className="mt-1 line-clamp-2 font-sans text-xs leading-snug text-white/85 sm:text-sm">
          {event.description}
        </p>
      </div>
      <span
        className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center text-white transition-transform group-hover:translate-x-0.5"
        aria-hidden
      >
        <ArrowRight className="h-5 w-5" strokeWidth={1.75} />
      </span>
    </div>
  );

  if (cmsEditMode) {
    return (
      <div className="relative min-h-[min(48svh,26rem)] overflow-hidden sm:min-h-[32rem]">
        {media}
        {badge}
        {bar}
      </div>
    );
  }

  return (
    <Link
      to={ctaHref}
      className="group relative block min-h-[min(48svh,26rem)] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-inset sm:min-h-[32rem]"
      aria-label={`${event.title}. ${dateLabel}. View event`}
    >
      {media}
      {badge}
      {bar}
    </Link>
  );
}

export default function EventsSection({ copy, cmsEditMode }: Props) {
  const updateEvents = useLandingContentStore((s) => s.updateEvents);
  const events = useEventStore((s) => s.events);
  const eventsHydrated = useEventStore((s) => s.hydrated);
  const branches = useBranchStore((s) => s.branches);
  const hydrateBranches = useBranchStore((s) => s.hydrateFromRemote);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!eventsHydrated) void hydrateEvents();
  }, [eventsHydrated]);

  useEffect(() => {
    void hydrateBranches();
  }, [hydrateBranches]);

  useEffect(() => {
    void orderingRepo.fetchEventRegistrationCounts().then(setRegCounts).catch(() => {});
  }, [events.length]);

  const ev = useMemo(() => pickCurrentOrUpcoming(events), [events]);
  const eventBranch = ev?.branchId ? branches.find((b) => b.id === ev.branchId) : null;
  const eventsListHref = eventBranch?.slug
    ? `/events?branch=${encodeURIComponent(eventBranch.slug)}`
    : '/events';
  const signupPhase = ev ? getEventSignupPhase(ev, regCounts[ev.id] ?? 0) : 'disabled';
  const heroImage = copy.coverImageOverride?.trim() || (ev ? eventImages(ev)[0] : '') || FALLBACK_EVENT_IMG;
  const coverSrc = copy.coverImageOverride?.trim() || heroImage;
  const ctaHref =
    ev && signupPhase === 'open'
      ? `/events?event=${encodeURIComponent(ev.id)}#event-${ev.id}`
      : eventsListHref;

  return (
    <section aria-labelledby="events-corner-heading" className="relative w-full overflow-hidden">
      <h2 id="events-corner-heading" className="sr-only">
        Events and Tambayan
      </h2>
      <div className="grid w-full grid-cols-1 lg:grid-cols-2 lg:min-h-[34rem]">
        <LeftColumn copy={copy} cmsEditMode={cmsEditMode} eventsHref={eventsListHref} />
        {ev ? (
          <ActiveRight
            event={ev}
            coverSrc={coverSrc}
            heroImage={heroImage}
            cmsEditMode={cmsEditMode}
            onCoverChange={(url) => updateEvents({ coverImageOverride: url })}
            ctaHref={ctaHref}
          />
        ) : (
          <EmptyRight copy={copy} cmsEditMode={cmsEditMode} />
        )}
      </div>
    </section>
  );
}
