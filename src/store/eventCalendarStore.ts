import { create } from 'zustand';
import type { EventCalendarMonth } from '../lib/eventCalendar';
import { orderingRepo } from '../lib/supabase/repositories/ordering';

type EventCalendarStore = {
  cache: Record<string, EventCalendarMonth>;
  loading: boolean;
  loadMonth: (year: number, month: number) => Promise<EventCalendarMonth>;
  toggleBlockout: (dateKey: string, note?: string) => Promise<boolean>;
  setDateKind: (dateKey: string, kind: 'available' | 'blocked' | 'pending', note?: string) => Promise<void>;
  invalidateMonth: (year: number, month: number) => void;
  refreshMonth: (year: number, month: number) => Promise<EventCalendarMonth>;
};

function cacheKey(year: number, month: number): string {
  return `${year}-${month}`;
}

export const useEventCalendarStore = create<EventCalendarStore>((set, get) => ({
  cache: {},
  loading: false,

  invalidateMonth: (year, month) => {
    const key = cacheKey(year, month);
    const next = { ...get().cache };
    delete next[key];
    set({ cache: next });
  },

  refreshMonth: async (year, month) => {
    get().invalidateMonth(year, month);
    return get().loadMonth(year, month);
  },

  loadMonth: async (year, month) => {
    const key = cacheKey(year, month);
    const cached = get().cache[key];
    if (cached) return cached;

    set({ loading: true });
    try {
      const data = await orderingRepo.fetchEventCalendar(year, month);
      const monthData: EventCalendarMonth = { year, month, ...data };
      set({ cache: { ...get().cache, [key]: monthData } });
      return monthData;
    } catch {
      const fallback: EventCalendarMonth = { year, month, blockouts: [], pending: [], booked: [] };
      set({ cache: { ...get().cache, [key]: fallback } });
      return fallback;
    } finally {
      set({ loading: false });
    }
  },

  toggleBlockout: async (dateKey, note) => {
    const result = await orderingRepo.toggleEventBlockout(dateKey, note);
    const [y, m] = dateKey.split('-').map(Number);
    const key = cacheKey(y, m);
    const cached = get().cache[key];
    if (cached) {
      const blockouts = result.blocked
        ? [...new Set([...cached.blockouts, dateKey])].sort()
        : cached.blockouts.filter((d) => d !== dateKey);
      set({ cache: { ...get().cache, [key]: { ...cached, blockouts } } });
    } else {
      await get().loadMonth(y, m);
    }
    return result.blocked;
  },

  setDateKind: async (dateKey, kind, note) => {
    await orderingRepo.setEventDateKind(dateKey, kind, note);
    const [y, m] = dateKey.split('-').map(Number);
    await get().refreshMonth(y, m);
  },
}));
