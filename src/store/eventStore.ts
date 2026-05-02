import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Event } from '../types/domain';
import { newId } from '../lib/id';

const SEED_EVENTS: Event[] = [
  {
    id: 'evt_latte_art',
    branchId: 'branch_marikina',
    title: 'Latte Art Throwdown',
    description: 'Watch local baristas compete in our monthly latte art showdown. Free tasting for attendees!',
    startsAt: '2026-05-15T14:00:00+08:00',
    endsAt: '2026-05-15T17:00:00+08:00',
    visible: true,
    highlight: true,
    cta: { label: 'RSVP Now', href: '/contact' },
  },
  {
    id: 'evt_cupping',
    branchId: 'branch_marikina',
    title: 'Coffee Cupping Session',
    description: 'Learn how we taste and evaluate beans from our roaster partners. Limited to 12 seats.',
    startsAt: '2026-05-22T10:00:00+08:00',
    endsAt: '2026-05-22T12:00:00+08:00',
    visible: true,
    highlight: false,
  },
  {
    id: 'evt_greenhills_opening',
    branchId: 'branch_greenhills',
    title: 'Greenhills Grand Opening',
    description: 'Be among the first to visit our new Greenhills Mall branch. Free drink for the first 100 guests!',
    startsAt: '2026-06-01T09:00:00+08:00',
    visible: true,
    highlight: false,
    cta: { label: 'Get Notified', href: '/contact' },
  },
];

export interface EventStore {
  events: Event[];
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

      addEvent: (input) => {
        const e: Event = { id: input.id ?? newId(), ...input } as Event;
        if (!e.id) e.id = newId();
        set({ events: [...get().events, e] });
      },

      updateEvent: (id, patch) =>
        set({ events: get().events.map((e) => (e.id === id ? { ...e, ...patch } : e)) }),

      removeEvent: (id) =>
        set({ events: get().events.filter((e) => e.id !== id) }),

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
