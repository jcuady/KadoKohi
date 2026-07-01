import { create } from 'zustand';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import {
  DEFAULT_PASTRIES_PAGE_CONTENT,
  normalizePastriesPageContent,
  type PastriesPageContent,
} from '../lib/pastriesPageContent';

export interface PastriesContentStore {
  content: PastriesPageContent;
  saveError: string | null;
  saving: boolean;
  hydrated: boolean;
  hydrateFromRemote: () => Promise<void>;
  saveToRemote: () => Promise<void>;
  updateContent: (patch: Partial<PastriesPageContent>) => void;
  updateHero: (patch: Partial<PastriesPageContent['hero']>) => void;
  updatePoster: (patch: Partial<PastriesPageContent['poster']>) => void;
  updateCta: (patch: Partial<PastriesPageContent['cta']>) => void;
}

export const usePastriesContentStore = create<PastriesContentStore>()((set, get) => ({
  content: DEFAULT_PASTRIES_PAGE_CONTENT,
  saveError: null,
  saving: false,
  hydrated: false,

  hydrateFromRemote: async () => {
    try {
      const remote = await orderingRepo.fetchPastriesContent();
      if (!remote || typeof remote !== 'object') {
        set({ content: DEFAULT_PASTRIES_PAGE_CONTENT, saveError: null, hydrated: true });
        return;
      }
      set({
        content: normalizePastriesPageContent(remote),
        saveError: null,
        hydrated: true,
      });
    } catch {
      set({ content: DEFAULT_PASTRIES_PAGE_CONTENT, hydrated: true });
    }
  },

  saveToRemote: async () => {
    const { content } = get();
    set({ saving: true, saveError: null });
    try {
      await orderingRepo.upsertPastriesContent(content);
      set({ saving: false, saveError: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save pastries page content.';
      set({ saving: false, saveError: message });
      throw err;
    }
  },

  updateContent: (patch) => set({ content: { ...get().content, ...patch } }),

  updateHero: (patch) =>
    set({ content: { ...get().content, hero: { ...get().content.hero, ...patch } } }),

  updatePoster: (patch) =>
    set({ content: { ...get().content, poster: { ...get().content.poster, ...patch } } }),

  updateCta: (patch) =>
    set({ content: { ...get().content, cta: { ...get().content.cta, ...patch } } }),
}));
