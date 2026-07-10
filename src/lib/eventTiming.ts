import type { Branch, Event } from '../types/domain';

export type EventBranchFilter = 'all' | string;

export type EventLifecyclePhase = 'upcoming' | 'current' | 'past';

export type EventSignupPhase = 'disabled' | 'not_yet_open' | 'open' | 'closed' | 'full';

export function eventImages(evt: Event): string[] {
  if (evt.images?.length) return evt.images.filter((u) => u.trim());
  if (evt.cover?.trim()) return [evt.cover.trim()];
  return [];
}

export function getEventLifecyclePhase(evt: Event, now = Date.now()): EventLifecyclePhase {
  const start = new Date(evt.startsAt).getTime();
  const end = evt.endsAt ? new Date(evt.endsAt).getTime() : null;
  if (now < start) return 'upcoming';
  if (end !== null && now >= end) return 'past';
  return 'current';
}

export function getEventSignupPhase(
  evt: Event,
  registrationCount = 0,
  now = Date.now(),
): EventSignupPhase {
  if (!evt.signupEnabled) return 'disabled';
  const t = now;
  const opens = evt.signupOpensAt ? new Date(evt.signupOpensAt).getTime() : null;
  const closes = evt.signupClosesAt ? new Date(evt.signupClosesAt).getTime() : null;
  if (opens !== null && t < opens) return 'not_yet_open';
  if (closes === null || t >= closes) return 'closed';
  if (evt.maxSignups != null && evt.maxSignups > 0 && registrationCount >= evt.maxSignups) return 'full';
  if (getEventLifecyclePhase(evt, t) === 'past') return 'closed';
  return 'open';
}

export function signupCountdownTarget(evt: Event, phase: EventSignupPhase): string | undefined {
  if (phase === 'not_yet_open' && evt.signupOpensAt) return evt.signupOpensAt;
  if (phase === 'open' && evt.signupClosesAt) return evt.signupClosesAt;
  return undefined;
}

/** Inclusive branch filter: specific branch shows branch events + network-wide (null branchId). */
export function eventMatchesBranchFilter(event: Event, branchFilter: EventBranchFilter): boolean {
  if (branchFilter === 'all') return true;
  return !event.branchId || event.branchId === branchFilter;
}

/** Resolve ?branch= slug or id to a branch id; invalid values fall back to 'all'. */
export function resolveEventBranchFilter(
  slugOrId: string | null | undefined,
  branches: Branch[],
): EventBranchFilter {
  const raw = slugOrId?.trim().toLowerCase();
  if (!raw || raw === 'all') return 'all';
  const active = branches.filter((b) => b.status === 'active');
  const bySlug = active.find((b) => b.slug.toLowerCase() === raw);
  if (bySlug) return bySlug.id;
  const byId = active.find((b) => b.id.toLowerCase() === raw);
  if (byId) return byId.id;
  return 'all';
}

export function branchSlugFromFilter(
  branchFilter: EventBranchFilter,
  branches: Branch[],
): string | null {
  if (branchFilter === 'all') return null;
  return branches.find((b) => b.id === branchFilter)?.slug ?? null;
}

type PickCurrentOrUpcomingOptions = {
  branchFilter?: EventBranchFilter;
  now?: number;
};

/** Homepage priority: current first, otherwise nearest upcoming. */
export function pickCurrentOrUpcoming(
  events: Event[],
  options: PickCurrentOrUpcomingOptions | number = {},
): Event | undefined {
  const opts: PickCurrentOrUpcomingOptions =
    typeof options === 'number' ? { now: options } : options;
  const now = opts.now ?? Date.now();
  const branchFilter = opts.branchFilter ?? 'all';
  const visible = events
    .filter((e) => e.visible)
    .filter((e) => eventMatchesBranchFilter(e, branchFilter));
  const current = visible
    .filter((e) => getEventLifecyclePhase(e, now) === 'current')
    .sort((a, b) => {
      const aEnd = a.endsAt ? new Date(a.endsAt).getTime() : Number.POSITIVE_INFINITY;
      const bEnd = b.endsAt ? new Date(b.endsAt).getTime() : Number.POSITIVE_INFINITY;
      return aEnd - bEnd;
    })[0];
  if (current) return current;
  return visible
    .filter((e) => getEventLifecyclePhase(e, now) === 'upcoming')
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
}

export function eventDurationLabel(evt: Event): string | null {
  if (!evt.endsAt) return null;
  const start = new Date(evt.startsAt).getTime();
  const end = new Date(evt.endsAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const totalMinutes = Math.round((end - start) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

/** Reverse of signupClosesBeforeEventStart — for repopulating the admin duration preset. */
export function signupDaysBeforeFromCloses(startsAtIso: string, closesAtIso?: string): number {
  if (!closesAtIso?.trim()) return 1;
  const start = new Date(startsAtIso).getTime();
  const closes = new Date(closesAtIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(closes)) return 1;
  const days = Math.round((start - closes) / 86_400_000);
  return Math.max(0, Math.min(365, days));
}

/** Admin helper: set sign-up close to N days before event start. */
export function signupClosesBeforeEventStart(startsAtIso: string, daysBefore: number): string {
  const start = new Date(startsAtIso);
  if (Number.isNaN(start.getTime())) return '';
  const d = Math.max(0, Math.min(365, Math.floor(daysBefore)));
  return new Date(start.getTime() - d * 86400000).toISOString();
}
