import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BookingShowcaseMedia } from '../types/domain';
import { newId } from '../lib/id';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import {
  DEFAULT_MATCHA_PAGE_COPY,
  normalizeMatchaPageContent,
  SEED_MATCHA_SHOWCASE_GALLERY,
} from '../lib/matchaPageContent';
import type { BoothHowItWorksStep, BoothPageCopy } from '../lib/boothPageContent';

export interface MatchaShowcaseStore {
  media: BookingShowcaseMedia[];
  pageCopy: BoothPageCopy;
  saveError: string | null;
  saving: boolean;
  hydrateFromRemote: () => Promise<void>;
  saveToRemote: () => Promise<void>;
  updatePageCopy: (patch: Partial<BoothPageCopy>) => void;
  updateHowItWorksStep: (index: number, patch: Partial<BoothHowItWorksStep>) => void;
  updateChip: (index: number, value: import('../lib/cmsTypography').CmsText) => void;
  addMedia: (input: Omit<BookingShowcaseMedia, 'id'> & { id?: string }) => void;
  updateMedia: (id: string, patch: Partial<BookingShowcaseMedia>) => void;
  removeMedia: (id: string) => void;
  reorderMedia: (fromIndex: number, toIndex: number) => void;
  visibleMedia: () => BookingShowcaseMedia[];
  seed: () => void;
}

export const useMatchaShowcaseStore = create<MatchaShowcaseStore>()(
  persist(
    (set, get) => ({
      media: SEED_MATCHA_SHOWCASE_GALLERY,
      pageCopy: DEFAULT_MATCHA_PAGE_COPY,
      saveError: null,
      saving: false,

      hydrateFromRemote: async () => {
        try {
          const remote = await orderingRepo.fetchMatchaPageContent();
          if (!remote || typeof remote !== 'object') return;
          const normalized = normalizeMatchaPageContent(remote, get().media);
          set({ media: normalized.showcase, pageCopy: normalized.copy, saveError: null });
        } catch {
          // Keep local persisted content when remote fetch fails.
        }
      },

      saveToRemote: async () => {
        const { media, pageCopy } = get();
        set({ saving: true, saveError: null });
        try {
          await orderingRepo.upsertMatchaPageContent({ copy: pageCopy, showcase: media });
          set({ saving: false, saveError: null });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Could not save matcha page content.';
          set({ saving: false, saveError: message });
          throw err;
        }
      },

      updatePageCopy: (patch) => set({ pageCopy: { ...get().pageCopy, ...patch } }),

      updateHowItWorksStep: (index, patch) => {
        const steps = [...get().pageCopy.howItWorksSteps] as BoothPageCopy['howItWorksSteps'];
        if (index < 0 || index > 2) return;
        steps[index] = { ...steps[index], ...patch };
        set({ pageCopy: { ...get().pageCopy, howItWorksSteps: steps } });
      },

      updateChip: (index, value) => {
        if (index < 0 || index > 3) return;
        const chips = [...get().pageCopy.chips] as BoothPageCopy['chips'];
        chips[index] = value;
        set({ pageCopy: { ...get().pageCopy, chips } });
      },

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

      seed: () =>
        set({
          media: SEED_MATCHA_SHOWCASE_GALLERY,
          pageCopy: DEFAULT_MATCHA_PAGE_COPY,
          saveError: null,
        }),
    }),
    {
      name: 'kado-matcha-showcase-v1',
      partialize: (state) => ({ media: state.media, pageCopy: state.pageCopy }),
    },
  ),
);
