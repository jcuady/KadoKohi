import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '../lib/id';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import {
  DEFAULT_CAREERS_PAGE_COPY,
  normalizeCareersPageContent,
  SEED_CAREER_LISTINGS,
  type CareerListing,
  type CareerListingCategory,
  type CareersPageCopy,
} from '../lib/careersPageContent';

export interface CareersStore {
  pageCopy: CareersPageCopy;
  listings: CareerListing[];
  saveError: string | null;
  saving: boolean;
  hydrateFromRemote: () => Promise<void>;
  saveToRemote: () => Promise<void>;
  updatePageCopy: (patch: Partial<CareersPageCopy>) => void;
  addListing: (input: Omit<CareerListing, 'id' | 'sortOrder'> & { id?: string; sortOrder?: number }) => void;
  updateListing: (id: string, patch: Partial<CareerListing>) => void;
  removeListing: (id: string) => void;
  visibleListings: (category?: CareerListingCategory) => CareerListing[];
  seed: () => void;
}

export const useCareersStore = create<CareersStore>()(
  persist(
    (set, get) => ({
      pageCopy: DEFAULT_CAREERS_PAGE_COPY,
      listings: SEED_CAREER_LISTINGS,
      saveError: null,
      saving: false,

      hydrateFromRemote: async () => {
        try {
          const remote = await orderingRepo.fetchCareersContent();
          if (!remote || typeof remote !== 'object') return;
          const normalized = normalizeCareersPageContent(remote);
          set({ pageCopy: normalized.copy, listings: normalized.listings, saveError: null });
        } catch {
          // Keep local persisted content when remote fetch fails.
        }
      },

      saveToRemote: async () => {
        const { pageCopy, listings } = get();
        set({ saving: true, saveError: null });
        try {
          await orderingRepo.upsertCareersContent({ copy: pageCopy, listings });
          set({ saving: false, saveError: null });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Could not save careers page content.';
          set({ saving: false, saveError: message });
          throw err;
        }
      },

      updatePageCopy: (patch) => set({ pageCopy: { ...get().pageCopy, ...patch } }),

      addListing: (input) =>
        set({
          listings: [
            ...get().listings,
            {
              ...input,
              id: input.id ?? newId(),
              sortOrder: input.sortOrder ?? get().listings.length,
            },
          ],
        }),

      updateListing: (id, patch) =>
        set({
          listings: get().listings.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        }),

      removeListing: (id) =>
        set({
          listings: get().listings.filter((item) => item.id !== id),
        }),

      visibleListings: (category) =>
        get()
          .listings.filter((item) => item.visible && (!category || item.category === category))
          .sort((a, b) => a.sortOrder - b.sortOrder),

      seed: () =>
        set({
          pageCopy: DEFAULT_CAREERS_PAGE_COPY,
          listings: SEED_CAREER_LISTINGS,
          saveError: null,
        }),
    }),
    {
      name: 'kado-careers-v1',
      partialize: (state) => ({ pageCopy: state.pageCopy, listings: state.listings }),
    },
  ),
);
