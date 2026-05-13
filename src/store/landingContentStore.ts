import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HOME_HERO_SLIDES, type HomeHeroSlide } from '../data/homeHeroMedia';

export interface FeaturedCopy {
  badge: string;
  title: string;
  subtitleDesktop: string;
  subtitleMobile: string;
  menuCtaLabel: string;
}

export interface EventsCopy {
  badge: string;
  title: string;
  subtitle: string;
}

export interface TestimonialsCopy {
  badge: string;
  title: string;
  subtitle: string;
  trustedTitle: string;
}

export interface ScheduleCopy {
  badge: string;
  title: string;
  description: string;
  phone: string;
  creditLine: string;
}

export type HomeBlockType =
  | 'hero'
  | 'featured'
  | 'ordering'
  | 'schedule'
  | 'events'
  | 'testimonials'
  | 'branches'
  | 'kadoCircle'
  | 'customSections';

export interface HomeBlockConfig {
  id: HomeBlockType;
  label: string;
  enabled: boolean;
}

export interface LandingContentState {
  heroSlides: HomeHeroSlide[];
  featured: FeaturedCopy;
  events: EventsCopy;
  testimonials: TestimonialsCopy;
  schedule: ScheduleCopy;
  homeBlocks: HomeBlockConfig[];
}

interface LandingContentStore {
  content: LandingContentState;
  setHeroSlides: (slides: HomeHeroSlide[]) => void;
  reorderHomeBlocks: (fromIndex: number, toIndex: number) => void;
  toggleHomeBlock: (id: HomeBlockType, enabled: boolean) => void;
  updateFeatured: (patch: Partial<FeaturedCopy>) => void;
  updateEvents: (patch: Partial<EventsCopy>) => void;
  updateTestimonials: (patch: Partial<TestimonialsCopy>) => void;
  updateSchedule: (patch: Partial<ScheduleCopy>) => void;
  seed: () => void;
}

const SEED_CONTENT: LandingContentState = {
  heroSlides: HOME_HERO_SLIDES,
  featured: {
    badge: 'Signatures',
    title: 'Signature Sips.',
    subtitleDesktop: "Explore our community's highest-rated daily rituals. Hand-crafted, every single time.",
    subtitleMobile: 'Community favourites — hand-crafted, every single time.',
    menuCtaLabel: 'View Full Menu',
  },
  events: {
    badge: 'Next Massive Event',
    title: 'More than a Corner.',
    subtitle: 'Coffee shop by day. Club and hangout by night. The definitive Marikina social experience.',
  },
  testimonials: {
    badge: 'Customers',
    title: 'Loved by our community',
    subtitle: "Don't just take our word for it. Here's what regulars have to say about their Kado Kohi experience.",
    trustedTitle: 'Uses trusted brands like',
  },
  schedule: {
    badge: 'Kado Kohi',
    title: 'Cafe Hours',
    description:
      'Your daily coffee routine, now clearly scheduled. Check our opening hours before dropping by for coffee, matcha, and community nights.',
    phone: '+63 920 948 2934',
    creditLine: 'Featured local photos credited to InsideMarikina.',
  },
  homeBlocks: [
    { id: 'hero', label: 'Hero', enabled: true },
    { id: 'featured', label: 'Featured Products', enabled: true },
    { id: 'ordering', label: 'How To Order', enabled: true },
    { id: 'schedule', label: 'Cafe Hours', enabled: true },
    { id: 'events', label: 'Events', enabled: true },
    { id: 'testimonials', label: 'Testimonials', enabled: true },
    { id: 'branches', label: 'Branches', enabled: true },
    { id: 'kadoCircle', label: 'Kado Circle', enabled: true },
    { id: 'customSections', label: 'Custom Sections', enabled: true },
  ],
};

export const useLandingContentStore = create<LandingContentStore>()(
  persist(
    (set, get) => ({
      content: SEED_CONTENT,
      setHeroSlides: (slides) =>
        set((s) => ({
          content: {
            ...s.content,
            heroSlides: slides,
          },
        })),
      reorderHomeBlocks: (fromIndex, toIndex) =>
        set((s) => {
          const blocks = [...s.content.homeBlocks];
          if (fromIndex < 0 || fromIndex >= blocks.length || toIndex < 0 || toIndex >= blocks.length) {
            return s;
          }
          const [moved] = blocks.splice(fromIndex, 1);
          blocks.splice(toIndex, 0, moved);
          return {
            content: {
              ...s.content,
              homeBlocks: blocks,
            },
          };
        }),
      toggleHomeBlock: (id, enabled) =>
        set((s) => ({
          content: {
            ...s.content,
            homeBlocks: s.content.homeBlocks.map((block) =>
              block.id === id ? { ...block, enabled } : block,
            ),
          },
        })),
      updateFeatured: (patch) =>
        set((s) => ({
          content: {
            ...s.content,
            featured: { ...s.content.featured, ...patch },
          },
        })),
      updateEvents: (patch) =>
        set((s) => ({
          content: {
            ...s.content,
            events: { ...s.content.events, ...patch },
          },
        })),
      updateTestimonials: (patch) =>
        set((s) => ({
          content: {
            ...s.content,
            testimonials: { ...s.content.testimonials, ...patch },
          },
        })),
      updateSchedule: (patch) =>
        set((s) => ({
          content: {
            ...s.content,
            schedule: { ...s.content.schedule, ...patch },
          },
        })),
      seed: () => set({ content: SEED_CONTENT }),
    }),
    { name: 'kado-landing-content-v1' },
  ),
);

