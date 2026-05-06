import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BookingShowcaseMedia } from '../types/domain';
import { SEED_BOOKING_SHOWCASE_GALLERY } from '../data/seed';
import { newId } from '../lib/id';

export interface BoothShowcaseStore {
  media: BookingShowcaseMedia[];
  addMedia: (input: Omit<BookingShowcaseMedia, 'id'> & { id?: string }) => void;
  updateMedia: (id: string, patch: Partial<BookingShowcaseMedia>) => void;
  removeMedia: (id: string) => void;
  reorderMedia: (fromIndex: number, toIndex: number) => void;
  visibleMedia: () => BookingShowcaseMedia[];
  seed: () => void;
}

export const useBoothShowcaseStore = create<BoothShowcaseStore>()(
  persist(
    (set, get) => ({
      media: SEED_BOOKING_SHOWCASE_GALLERY,

      addMedia: (input) =>
        set({
          media: [
            ...get().media,
            {
              ...input,
              id: input.id ?? newId(),
              order: input.order ?? get().media.length,
              visible: input.visible ?? true,
            },
          ],
        }),

      updateMedia: (id, patch) =>
        set({
          media: get().media.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        }),

      removeMedia: (id) =>
        set({
          media: get().media.filter((item) => item.id !== id),
        }),

      reorderMedia: (fromIndex, toIndex) => {
        const sorted = [...get().media].sort((a, b) => a.order - b.order);
        if (fromIndex < 0 || fromIndex >= sorted.length || toIndex < 0 || toIndex >= sorted.length) return;
        const [removed] = sorted.splice(fromIndex, 1);
        sorted.splice(toIndex, 0, removed);
        set({ media: sorted.map((item, i) => ({ ...item, order: i })) });
      },

      visibleMedia: () =>
        get()
          .media.filter((item) => item.visible)
          .sort((a, b) => a.order - b.order),

      seed: () => set({ media: SEED_BOOKING_SHOWCASE_GALLERY }),
    }),
    { name: 'kado-booth-showcase-v1' },
  ),
);
