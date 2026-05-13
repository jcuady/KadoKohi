import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HOME_HERO_SLIDES, type HomeHeroSlide, type HomeHeroCardMedia } from '../data/homeHeroMedia';

export interface HeroChrome {
  locationBadge: string;
  imageCredit: string;
  primaryCtaLabel: string;
  primaryCtaPath: string;
  secondaryCtaLabel: string;
  secondaryCtaPath: string;
}

export interface FeaturedCopy {
  badge: string;
  title: string;
  subtitleDesktop: string;
  subtitleMobile: string;
  menuCtaLabel: string;
  /** Per showcase slot (0–2): optional image URL or data URL; empty uses menu product image. */
  cardImageOverrides: [string, string, string];
}

export interface EventsCopy {
  badge: string;
  title: string;
  subtitle: string;
  /** When set, replaces the highlighted event cover image on the home hero card. */
  coverImageOverride: string;
  noEventBody: string;
  noEventBrowseLabel: string;
}

export interface TestimonialsCopy {
  badge: string;
  title: string;
  subtitle: string;
  trustedTitle: string;
}

export interface StoredTestimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
}

export interface ScheduleCopy {
  badge: string;
  title: string;
  description: string;
  phone: string;
  creditLine: string;
}

export interface OrderingCopy {
  badge: string;
  title: string;
  subtitleDesktop: string;
  subtitleMobile: string;
}

export interface BranchesStripCopy {
  badge: string;
  title: string;
  ctaLabel: string;
}

export interface KadoCircleStat {
  num: string;
  label: string;
}

export interface KadoCircleCopy {
  badge: string;
  titleBefore: string;
  titleAccent: string;
  body: string;
  emailPlaceholder: string;
  submitLabel: string;
  disclaimer: string;
  marqueeLabel: string;
  sponsors: string[];
  stats: KadoCircleStat[];
  footerLinkLabel: string;
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
  heroChrome: HeroChrome;
  featured: FeaturedCopy;
  events: EventsCopy;
  testimonials: TestimonialsCopy;
  testimonialItems: StoredTestimonial[];
  trustedBrands: string[];
  schedule: ScheduleCopy;
  ordering: OrderingCopy;
  branchesStrip: BranchesStripCopy;
  kadoCircle: KadoCircleCopy;
  homeBlocks: HomeBlockConfig[];
}

interface LandingContentStore {
  content: LandingContentState;
  setHeroSlides: (slides: HomeHeroSlide[]) => void;
  updateHeroCard: (slideIndex: number, cardIndex: number, patch: Partial<HomeHeroCardMedia>) => void;
  reorderHomeBlocks: (fromIndex: number, toIndex: number) => void;
  toggleHomeBlock: (id: HomeBlockType, enabled: boolean) => void;
  updateHeroChrome: (patch: Partial<HeroChrome>) => void;
  updateFeatured: (patch: Partial<FeaturedCopy>) => void;
  updateEvents: (patch: Partial<EventsCopy>) => void;
  updateTestimonials: (patch: Partial<TestimonialsCopy>) => void;
  setTestimonialItems: (items: StoredTestimonial[]) => void;
  updateTestimonialItem: (index: number, patch: Partial<StoredTestimonial>) => void;
  addTestimonialItem: () => void;
  removeTestimonialItem: (index: number) => void;
  setTrustedBrands: (brands: string[]) => void;
  updateSchedule: (patch: Partial<ScheduleCopy>) => void;
  updateOrdering: (patch: Partial<OrderingCopy>) => void;
  updateBranchesStrip: (patch: Partial<BranchesStripCopy>) => void;
  updateKadoCircle: (patch: Partial<KadoCircleCopy>) => void;
  seed: () => void;
}

const SEED_TESTIMONIALS: StoredTestimonial[] = [
  {
    id: 1,
    name: 'Rina Santos',
    role: 'Regular',
    company: 'Marikina',
    content:
      "The oat latte here is unreal. Oatside milk makes such a difference — perfectly steamed, not too sweet, and the ambiance just pulls you in. I'm here every weekend without fail.",
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    id: 2,
    name: 'Marco Dela Cruz',
    role: 'Freelancer',
    company: 'Pasig',
    content:
      'Best work-from-cafe spot in the area. The music is always right, the matcha (Aiya grade A!) is excellent, and the staff actually know your order by your third visit.',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/54.jpg',
  },
  {
    id: 3,
    name: 'Jess Buenaventura',
    role: 'Creative',
    company: 'QC',
    content:
      "I love that they're intentional about what goes into their drinks — Emborg dairy, quality matcha. You taste the difference. The night vibe on weekends is also *chef's kiss*.",
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
  },
  {
    id: 4,
    name: 'Luis Tomas',
    role: 'Student',
    company: 'Marikina',
    content:
      "Kado is my corner. No pretension, just good coffee, good music, and people who feel like community. It's rare to find a place this intentional about craft and vibe.",
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
  },
];

const SEED_TRUSTED_BRANDS = ['Oatside', 'Emborg', 'Aiya Matcha', 'Marigold', 'Arla'];

const SEED_KADO_CIRCLE_SPONSORS = [
  'Anytime Fitness',
  'foodpanda',
  'GrabFood',
  'Pick.A.Roo',
  'Oatside',
  'Lalamove',
  'Emborg',
  'Aiya Matcha',
];

const SEED_CONTENT: LandingContentState = {
  heroSlides: HOME_HERO_SLIDES,
  heroChrome: {
    locationBadge: 'Kado Kohi · Marikina',
    imageCredit: 'Images: Kado Kohi Social + InsideMarikina',
    primaryCtaLabel: 'Explore Menu',
    primaryCtaPath: '/menu',
    secondaryCtaLabel: 'Shop Merch',
    secondaryCtaPath: '/merch',
  },
  featured: {
    badge: 'Signatures',
    title: 'Signature Sips.',
    subtitleDesktop: "Explore our community's highest-rated daily rituals. Hand-crafted, every single time.",
    subtitleMobile: 'Community favourites — hand-crafted, every single time.',
    menuCtaLabel: 'View Full Menu',
    cardImageOverrides: ['', '', ''],
  },
  events: {
    badge: 'Next Massive Event',
    title: 'More than a Corner.',
    subtitle: 'Coffee shop by day. Club and hangout by night. The definitive Marikina social experience.',
    coverImageOverride: '',
    noEventBody: 'No upcoming events right now. Check back soon.',
    noEventBrowseLabel: 'Browse past events →',
  },
  testimonials: {
    badge: 'Customers',
    title: 'Loved by our community',
    subtitle: "Don't just take our word for it. Here's what regulars have to say about their Kado Kohi experience.",
    trustedTitle: 'Uses trusted brands like',
  },
  testimonialItems: SEED_TESTIMONIALS,
  trustedBrands: SEED_TRUSTED_BRANDS,
  schedule: {
    badge: 'Kado Kohi',
    title: 'Cafe Hours',
    description:
      'Your daily coffee routine, now clearly scheduled. Check our opening hours before dropping by for coffee, matcha, and community nights.',
    phone: '+63 920 948 2934',
    creditLine: 'Featured local photos credited to InsideMarikina.',
  },
  ordering: {
    badge: 'How it works',
    title: 'Order your way.',
    subtitleDesktop: 'Walk in, order online, or scan a table QR — then collect stamps every time.',
    subtitleMobile: 'In-store, online, QR at your table — earn stamps every visit.',
  },
  branchesStrip: {
    badge: 'Locations',
    title: 'Find us.',
    ctaLabel: 'All branches',
  },
  kadoCircle: {
    badge: 'The Inner Circle',
    titleBefore: 'Join the',
    titleAccent: 'Kado Circle.',
    body: 'Curated invites to private events, secret menu drops, and your trackable loyalty stamp card. Become a local.',
    emailPlaceholder: 'Enter your email address',
    submitLabel: 'Request access',
    disclaimer: 'No spam. Unsubscribe any time.',
    marqueeLabel: 'Friends of the corner',
    sponsors: [...SEED_KADO_CIRCLE_SPONSORS],
    stats: [
      { num: '2+', label: 'Branches' },
      { num: '50+', label: 'Menu items' },
      { num: '9', label: 'Stamp loyalty' },
      { num: '∞', label: 'Good vibes' },
    ],
    footerLinkLabel: 'Or go straight to create account →',
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

function clampCardOverrides(tuple: [string, string, string] | undefined): [string, string, string] {
  if (!tuple || !Array.isArray(tuple) || tuple.length < 3) return ['', '', ''];
  return [tuple[0] ?? '', tuple[1] ?? '', tuple[2] ?? ''];
}

/** Merge persisted slices with current schema defaults (new keys, migrations). */
function normalizeLandingContent(c: Partial<LandingContentState> | undefined): LandingContentState {
  if (!c || typeof c !== 'object') return SEED_CONTENT;

  return {
    ...SEED_CONTENT,
    ...c,
    heroChrome: { ...SEED_CONTENT.heroChrome, ...(c.heroChrome ?? {}) },
    featured: {
      ...SEED_CONTENT.featured,
      ...c.featured,
      cardImageOverrides: clampCardOverrides(
        (c.featured?.cardImageOverrides as [string, string, string] | undefined) ?? SEED_CONTENT.featured.cardImageOverrides,
      ),
    },
    events: { ...SEED_CONTENT.events, ...c.events },
    testimonials: { ...SEED_CONTENT.testimonials, ...c.testimonials },
    testimonialItems:
      Array.isArray(c.testimonialItems) && c.testimonialItems.length > 0 ? c.testimonialItems : SEED_CONTENT.testimonialItems,
    trustedBrands:
      Array.isArray(c.trustedBrands) && c.trustedBrands.length > 0 ? c.trustedBrands : SEED_CONTENT.trustedBrands,
    schedule: { ...SEED_CONTENT.schedule, ...c.schedule },
    ordering: { ...SEED_CONTENT.ordering, ...c.ordering },
    branchesStrip: { ...SEED_CONTENT.branchesStrip, ...c.branchesStrip },
    kadoCircle: {
      ...SEED_CONTENT.kadoCircle,
      ...c.kadoCircle,
      sponsors:
        Array.isArray(c.kadoCircle?.sponsors) && c.kadoCircle!.sponsors.length > 0
          ? c.kadoCircle!.sponsors
          : SEED_CONTENT.kadoCircle.sponsors,
      stats:
        Array.isArray(c.kadoCircle?.stats) && c.kadoCircle!.stats.length > 0
          ? c.kadoCircle!.stats
          : SEED_CONTENT.kadoCircle.stats,
    },
    homeBlocks: Array.isArray(c.homeBlocks) && c.homeBlocks.length > 0 ? c.homeBlocks : SEED_CONTENT.homeBlocks,
    heroSlides: Array.isArray(c.heroSlides) && c.heroSlides.length > 0 ? c.heroSlides : SEED_CONTENT.heroSlides,
  };
}

export const useLandingContentStore = create<LandingContentStore>()(
  persist(
    (set) => ({
      content: SEED_CONTENT,
      setHeroSlides: (slides) =>
        set((s) => ({
          content: {
            ...s.content,
            heroSlides: slides,
          },
        })),
      updateHeroCard: (slideIndex, cardIndex, patch) =>
        set((s) => {
          const slides = [...s.content.heroSlides];
          const slide = slides[slideIndex];
          if (!slide?.cards?.[cardIndex]) return s;
          const cards = [...slide.cards];
          cards[cardIndex] = { ...cards[cardIndex], ...patch };
          slides[slideIndex] = { ...slide, cards };
          return { content: { ...s.content, heroSlides: slides } };
        }),
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
      updateHeroChrome: (patch) =>
        set((s) => ({
          content: {
            ...s.content,
            heroChrome: { ...s.content.heroChrome, ...patch },
          },
        })),
      updateFeatured: (patch) =>
        set((s) => ({
          content: {
            ...s.content,
            featured: {
              ...s.content.featured,
              ...patch,
              cardImageOverrides:
                patch.cardImageOverrides !== undefined
                  ? clampCardOverrides(patch.cardImageOverrides as [string, string, string])
                  : s.content.featured.cardImageOverrides,
            },
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
      setTestimonialItems: (items) =>
        set((s) => ({
          content: { ...s.content, testimonialItems: items },
        })),
      updateTestimonialItem: (index, patch) =>
        set((s) => {
          const items = [...s.content.testimonialItems];
          if (!items[index]) return s;
          items[index] = { ...items[index], ...patch };
          return { content: { ...s.content, testimonialItems: items } };
        }),
      addTestimonialItem: () =>
        set((s) => {
          const maxId = s.content.testimonialItems.reduce((m, t) => Math.max(m, t.id), 0);
          const next: StoredTestimonial = {
            id: maxId + 1,
            name: 'New customer',
            role: 'Guest',
            company: 'Marikina',
            content: 'Add your testimonial text here.',
            rating: 5,
            avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
          };
          return { content: { ...s.content, testimonialItems: [...s.content.testimonialItems, next] } };
        }),
      removeTestimonialItem: (index) =>
        set((s) => {
          if (s.content.testimonialItems.length <= 1) return s;
          const items = s.content.testimonialItems.filter((_, i) => i !== index);
          return { content: { ...s.content, testimonialItems: items } };
        }),
      setTrustedBrands: (brands) =>
        set((s) => ({
          content: { ...s.content, trustedBrands: brands.filter(Boolean) },
        })),
      updateSchedule: (patch) =>
        set((s) => ({
          content: {
            ...s.content,
            schedule: { ...s.content.schedule, ...patch },
          },
        })),
      updateOrdering: (patch) =>
        set((s) => ({
          content: {
            ...s.content,
            ordering: { ...s.content.ordering, ...patch },
          },
        })),
      updateBranchesStrip: (patch) =>
        set((s) => ({
          content: {
            ...s.content,
            branchesStrip: { ...s.content.branchesStrip, ...patch },
          },
        })),
      updateKadoCircle: (patch) =>
        set((s) => ({
          content: {
            ...s.content,
            kadoCircle: {
              ...s.content.kadoCircle,
              ...patch,
              sponsors: patch.sponsors !== undefined ? patch.sponsors : s.content.kadoCircle.sponsors,
              stats: patch.stats !== undefined ? patch.stats : s.content.kadoCircle.stats,
            },
          },
        })),
      seed: () => set({ content: SEED_CONTENT }),
    }),
    {
      name: 'kado-landing-content-v2',
      merge: (persisted, current) => {
        const c = current as LandingContentStore;
        const p =
          persisted && typeof persisted === 'object'
            ? (persisted as { content?: Partial<LandingContentState> })
            : null;
        const mergedContent = p?.content ? { ...c.content, ...p.content } : c.content;
        return {
          ...c,
          content: normalizeLandingContent(mergedContent),
        };
      },
    },
  ),
);
