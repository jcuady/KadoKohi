import { create } from 'zustand';
import type { Event } from '../types/domain';
import { newId } from '../lib/id';
import { logAudit } from '../lib/audit';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { supabase } from '../lib/supabase/client';

const IMG_LATTE = 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1200&auto=format&fit=crop';
const IMG_CUPPING = 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1200&auto=format&fit=crop';
const IMG_OPENING = 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=1200&auto=format&fit=crop';

const SEED_EVENTS: Event[] = [
  {
    id: 'evt_latte_art',
    branchId: 'branch_marikina',
    title: 'Latte Art Throwdown',
    description: 'Watch local baristas compete in our monthly latte art showdown. Free tasting for attendees!',
    startsAt: '2026-05-15T14:00:00+08:00',
    endsAt: '2026-05-15T17:00:00+08:00',
    images: [IMG_LATTE],
    cover: IMG_LATTE,
    visible: true,
    highlight: true,
    signupEnabled: true,
    signupClosesAt: '2026-05-14T14:00:00+08:00',
    cta: { label: 'Sign up', href: '/events' },
  },
  {
    id: 'evt_cupping',
    branchId: 'branch_marikina',
    title: 'Coffee Cupping Session',
    description: 'Learn how we taste and evaluate beans from our roaster partners. Limited to 12 seats.',
    startsAt: '2026-05-22T10:00:00+08:00',
    endsAt: '2026-05-22T12:00:00+08:00',
    images: [IMG_CUPPING],
    cover: IMG_CUPPING,
    visible: true,
    highlight: false,
    signupEnabled: true,
    signupClosesAt: '2026-05-21T10:00:00+08:00',
    maxSignups: 12,
    cta: { label: 'Sign up', href: '/events' },
  },
  {
    id: 'evt_greenhills_opening',
    branchId: 'branch_greenhills',
    title: 'Greenhills Grand Opening',
    description: 'Be among the first to visit our new Greenhills Mall branch. Free drink for the first 100 guests!',
    startsAt: '2026-06-01T09:00:00+08:00',
    images: [IMG_OPENING],
    cover: IMG_OPENING,
    visible: true,
    highlight: false,
    signupEnabled: true,
    signupClosesAt: '2026-05-31T09:00:00+08:00',
    cta: { label: 'Sign up', href: '/events' },
  },
];

export interface EventStore {
  events: Event[];
  hydrated: boolean;
  hydrateFromRemote: () => Promise<void>;
  addEvent: (input: Omit<Event, 'id'> & { id?: string }) => Promise<Event>;
  updateEvent: (id: string, patch: Partial<Event>) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  visibleEvents: () => Event[];
  highlightEvent: () => Event | undefined;
  seed: () => void;
}

export const useEventStore = create<EventStore>()((set, get) => ({
  events: SEED_EVENTS,
  hydrated: false,

  hydrateFromRemote: async () => {
    if (!supabase) return;
    try {
      const events = await orderingRepo.fetchEvents();
      set({ events, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  addEvent: async (input) => {
    const e: Event = { id: input.id ?? newId(), ...input } as Event;
    if (!e.id) e.id = newId();
    await orderingRepo.upsertEvent(e, get().events.length);
    set({ events: [...get().events.filter((row) => row.id !== e.id), e] });
    logAudit({
      action: 'event.created',
      entityType: 'event',
      entityId: e.id,
      branchId: e.branchId ?? null,
      summary: `Created event ${e.title}`,
    });
    return e;
  },

  updateEvent: async (id, patch) => {
    const current = get().events.find((row) => row.id === id);
    if (!current) throw new Error('Event not found.');
    const updated: Event = { ...current, ...patch };
    await orderingRepo.upsertEvent(updated);
    set({ events: get().events.map((row) => (row.id === id ? updated : row)) });
    logAudit({
      action: 'event.updated',
      entityType: 'event',
      entityId: id,
      branchId: updated.branchId ?? null,
      summary: `Updated event ${updated.title}`,
      metadata: { changedKeys: Object.keys(patch) },
    });
  },

  removeEvent: async (id) => {
    const deleted = get().events.find((row) => row.id === id);
    await orderingRepo.deleteEvent(id);
    set({ events: get().events.filter((row) => row.id !== id) });
    logAudit({
      action: 'event.deleted',
      entityType: 'event',
      entityId: id,
      branchId: deleted?.branchId ?? null,
      summary: `Deleted event ${deleted?.title ?? id}`,
    });
  },

  visibleEvents: () =>
    get()
      .events.filter((e) => e.visible)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),

  highlightEvent: () => get().events.find((e) => e.highlight && e.visible),

  seed: () => set({ events: SEED_EVENTS, hydrated: false }),
}));
