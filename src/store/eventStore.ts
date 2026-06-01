import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Event } from '../types/domain';
import { newId } from '../lib/id';
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
  hydrateFromRemote: () => Promise<void>;
  addEvent: (input: Omit<Event, 'id'> & { id?: string }) => void;
  updateEvent: (id: string, patch: Partial<Event>) => void;
  removeEvent: (id: string) => void;
  visibleEvents: () => Event[];
  highlightEvent: () => Event | undefined;
  seed: () => void;
}

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      events: SEED_EVENTS,

      hydrateFromRemote: async () => {
        if (!supabase) return;
        try {
          const events = await orderingRepo.fetchEvents();
          if (events.length) set({ events });
        } catch {
          // Keep current state when remote fetch fails.
        }
      },

      addEvent: (input) => {
        const e: Event = { id: input.id ?? newId(), ...input } as Event;
        if (!e.id) e.id = newId();
        set({ events: [...get().events, e] });
        void orderingRepo.upsertEvent(e, get().events.length).catch(() => {});
      },

      updateEvent: (id, patch) => {
        const next = get().events.map((e) => (e.id === id ? { ...e, ...patch } : e));
        set({ events: next });
        const updated = next.find((e) => e.id === id);
        if (updated) void orderingRepo.upsertEvent(updated).catch(() => {});
      },

      removeEvent: (id) => {
        set({ events: get().events.filter((e) => e.id !== id) });
        void orderingRepo.deleteEvent(id).catch(() => {});
      },

      visibleEvents: () =>
        get()
          .events.filter((e) => e.visible)
          .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),

      highlightEvent: () => get().events.find((e) => e.highlight && e.visible),

      seed: () => set({ events: SEED_EVENTS }),
    }),
    { name: 'kado-events-v1' },
  ),
);
