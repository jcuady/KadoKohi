import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '../lib/id';
import type { CustomSection, SectionType } from '../types/domain';

export type { CustomSection, SectionType };

const SEED_SECTIONS: CustomSection[] = [
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

export interface SectionStore {
  sections: CustomSection[];
  addSection: (input: Omit<CustomSection, 'id'> & { id?: string }) => void;
  updateSection: (id: string, patch: Partial<CustomSection>) => void;
  removeSection: (id: string) => void;
  visibleSections: (page: 'home') => CustomSection[];
  seed: () => void;
}

export const useSectionStore = create<SectionStore>()(
  persist(
    (set, get) => ({
      sections: SEED_SECTIONS,

      addSection: (input) => {
        const s: CustomSection = { id: input.id ?? newId(), ...input } as CustomSection;
        if (!s.id) s.id = newId();
        set({ sections: [...get().sections, s] });
      },

      updateSection: (id, patch) =>
        set({ sections: get().sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }),

      removeSection: (id) => set({ sections: get().sections.filter((s) => s.id !== id) }),

      visibleSections: (page) =>
        get()
          .sections.filter((s) => s.page === page && s.visible)
          .sort((a, b) => a.order - b.order),

      seed: () => set({ sections: SEED_SECTIONS }),
    }),
    { name: 'kado-sections-v1' },
  ),
);
