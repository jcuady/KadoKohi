import { create } from 'zustand';
import { newId } from '../lib/id';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import type { CustomSection, SectionType } from '../types/domain';

export type { CustomSection, SectionType };

export const SEED_SECTIONS: CustomSection[] = [
  {
    id: 'sec_faq',
    page: 'home',
    type: 'faq',
    title: 'Common questions.',
    body: 'Everything you need before you pull up a chair.',
    order: 0,
    visible: true,
  },
  {
    id: 'sec_cta',
    page: 'home',
    type: 'cta',
    title: 'Visit us today',
    body: 'Drop by Marikina or wait for Greenhills — either way, your table is waiting.',
    ctaLabel: 'View branches',
    ctaHref: '/branches',
    order: 1,
    visible: true,
  },
];

function normalizeSections(raw: unknown): CustomSection[] {
  if (!Array.isArray(raw)) return SEED_SECTIONS;
  return raw.filter((row): row is CustomSection => row && typeof row === 'object' && 'id' in row && 'type' in row);
}

export interface SectionStore {
  sections: CustomSection[];
  saveError: string | null;
  saving: boolean;
  hydrated: boolean;
  hydrateFromRemote: () => Promise<void>;
  saveToRemote: () => Promise<void>;
  addSection: (input: Omit<CustomSection, 'id'> & { id?: string }) => void;
  updateSection: (id: string, patch: Partial<CustomSection>) => void;
  removeSection: (id: string) => void;
  visibleSections: (page: 'home') => CustomSection[];
  seed: () => void;
}

export const useSectionStore = create<SectionStore>()((set, get) => ({
  sections: SEED_SECTIONS,
  saveError: null,
  saving: false,
  hydrated: false,

  hydrateFromRemote: async () => {
    try {
      const remote = await orderingRepo.fetchHomeSections();
      if (Array.isArray(remote) && remote.length > 0) {
        set({ sections: normalizeSections(remote), saveError: null, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  saveToRemote: async () => {
    set({ saving: true, saveError: null });
    try {
      await orderingRepo.upsertHomeSections(get().sections);
      set({ saving: false, saveError: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save custom sections.';
      set({ saving: false, saveError: message });
      throw err;
    }
  },

  addSection: (input) => {
    const s: CustomSection = { id: input.id ?? newId(), ...input } as CustomSection;
    set({ sections: [...get().sections, s] });
  },

  updateSection: (id, patch) =>
    set({ sections: get().sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }),

  removeSection: (id) => set({ sections: get().sections.filter((s) => s.id !== id) }),

  visibleSections: (page) =>
    get()
      .sections.filter((s) => s.page === page && s.visible)
      .sort((a, b) => a.order - b.order),

  seed: () => set({ sections: SEED_SECTIONS, saveError: null }),
}));
