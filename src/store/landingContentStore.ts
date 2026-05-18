import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HOME_HERO_SLIDES, type HomeHeroSlide, type HomeHeroCardMedia } from '../data/homeHeroMedia';
import { clearLandingPreviewDraft, writeLandingPreviewDraft } from '../lib/landingPreviewSession';

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
  cardImageOverrides: [string, string, string];
}

export interface EventsCopy {
  badge: string;
  title: string;
  subtitle: string;
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

/** Fixed homepage layout — only text/images inside each slot are editable. */
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
}

interface LandingContentStore {
  /** Live content on the public site (persisted). */
  published: LandingContentState;
  /** Working copy while editing in admin (not persisted). */
  draft: LandingContentState | null;
  /** When true, home + ?preview=1 read from draft. */
  isPreviewMode: boolean;

  initDraft: () => void;
  discardDraft: () => void;
  publishDraft: () => void;
  setPreviewMode: (active: boolean) => void;

  updateHeroSlide: (index: number, patch: Partial<HomeHeroSlide>) => void;
  updateHeroCard: (slideIndex: number, cardIndex: number, patch: Partial<HomeHeroCardMedia>) => void;
  updateHeroChrome: (patch: Partial<HeroChrome>) => void;
  updateFeatured: (patch: Partial<FeaturedCopy>) => void;
  updateEvents: (patch: Partial<EventsCopy>) => void;
  updateTestimonials: (patch: Partial<TestimonialsCopy>) => void;
  updateTestimonialItem: (index: number, patch: Partial<StoredTestimonial>) => void;
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

export const SEED_CONTENT: LandingContentState = {
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
};

function clampCardOverrides(tuple: [string, string, string] | undefined): [string, string, string] {
  if (!tuple || !Array.isArray(tuple) || tuple.length < 3) return ['', '', ''];
  return [tuple[0] ?? '', tuple[1] ?? '', tuple[2] ?? ''];
}

function clampHeroSlides(slides: HomeHeroSlide[] | undefined): HomeHeroSlide[] {
  const seed = SEED_CONTENT.heroSlides;
  if (!Array.isArray(slides) || slides.length === 0) return seed;
  return seed.map((seedSlide, i) => {
    const saved = slides[i];
    if (!saved) return seedSlide;
    const cards = seedSlide.cards.map((seedCard, ci) => ({
      ...seedCard,
      ...(saved.cards?.[ci] ?? {}),
      id: seedCard.id,
    }));
    return { ...seedSlide, ...saved, id: seedSlide.id, cards };
  });
}

function clampTestimonials(items: StoredTestimonial[] | undefined): StoredTestimonial[] {
  const seed = SEED_CONTENT.testimonialItems;
  if (!Array.isArray(items) || items.length === 0) return seed;
  return seed.map((seedItem, i) => ({
    ...seedItem,
    ...(items[i] ?? {}),
    id: seedItem.id,
  }));
}

function clampStringList(saved: string[] | undefined, seed: string[]): string[] {
  if (!Array.isArray(saved) || saved.length === 0) return [...seed];
  return seed.map((fallback, i) => (typeof saved[i] === 'string' ? saved[i] : fallback));
}

export function normalizeLandingContent(raw: Partial<LandingContentState> | undefined): LandingContentState {
  if (!raw || typeof raw !== 'object') return SEED_CONTENT;

  return {
    heroSlides: clampHeroSlides(raw.heroSlides),
    heroChrome: { ...SEED_CONTENT.heroChrome, ...(raw.heroChrome ?? {}) },
    featured: {
      ...SEED_CONTENT.featured,
      ...raw.featured,
      cardImageOverrides: clampCardOverrides(
        raw.featured?.cardImageOverrides as [string, string, string] | undefined,
      ),
    },
    events: { ...SEED_CONTENT.events, ...(raw.events ?? {}) },
    testimonials: { ...SEED_CONTENT.testimonials, ...(raw.testimonials ?? {}) },
    testimonialItems: clampTestimonials(raw.testimonialItems),
    trustedBrands: clampStringList(raw.trustedBrands, SEED_TRUSTED_BRANDS),
    schedule: { ...SEED_CONTENT.schedule, ...(raw.schedule ?? {}) },
    ordering: { ...SEED_CONTENT.ordering, ...(raw.ordering ?? {}) },
    branchesStrip: { ...SEED_CONTENT.branchesStrip, ...(raw.branchesStrip ?? {}) },
    kadoCircle: {
      ...SEED_CONTENT.kadoCircle,
      ...(raw.kadoCircle ?? {}),
      sponsors: clampStringList(raw.kadoCircle?.sponsors, SEED_KADO_CIRCLE_SPONSORS),
      stats:
        Array.isArray(raw.kadoCircle?.stats) && raw.kadoCircle.stats.length >= 4
          ? raw.kadoCircle.stats.slice(0, 4)
          : SEED_CONTENT.kadoCircle.stats,
    },
  };
}

function cloneContent(state: LandingContentState): LandingContentState {
  return JSON.parse(JSON.stringify(state)) as LandingContentState;
}

function patchDraft(
  set: (fn: (s: LandingContentStore) => Partial<LandingContentStore> | LandingContentStore) => void,
  get: () => LandingContentStore,
  patcher: (draft: LandingContentState) => LandingContentState,
) {
  const { draft, published, isPreviewMode } = get();
  const base = draft ?? published;
  const next = patcher(cloneContent(base));
  set((s) => ({ ...s, draft: next }));
  if (isPreviewMode || draft) {
    writeLandingPreviewDraft(next);
  }
}

export const useLandingContentStore = create<LandingContentStore>()(
  persist(
    (set, get) => ({
      published: SEED_CONTENT,
      draft: null,
      isPreviewMode: false,

      initDraft: () => {
        const draft = cloneContent(get().published);
        set({ draft });
      },
      discardDraft: () => {
        clearLandingPreviewDraft();
        set({ draft: null, isPreviewMode: false });
      },
      publishDraft: () => {
        const { draft } = get();
        if (!draft) return;
        clearLandingPreviewDraft();
        set({ published: cloneContent(draft), draft: null, isPreviewMode: false });
      },
      setPreviewMode: (active) => {
        const { draft, published } = get();
        if (active) {
          const snapshot = cloneContent(draft ?? published);
          writeLandingPreviewDraft(snapshot);
          set({ draft: draft ?? snapshot, isPreviewMode: true });
        } else {
          clearLandingPreviewDraft();
          set({ isPreviewMode: false });
        }
      },

      updateHeroSlide: (index, patch) =>
        patchDraft(set, get, (d) => {
          const slides = [...d.heroSlides];
          if (!slides[index]) return d;
          slides[index] = { ...slides[index], ...patch };
          return { ...d, heroSlides: slides };
        }),

      updateHeroCard: (slideIndex, cardIndex, patch) =>
        patchDraft(set, get, (d) => {
          const slides = [...d.heroSlides];
          const slide = slides[slideIndex];
          if (!slide?.cards?.[cardIndex]) return d;
          const cards = [...slide.cards];
          cards[cardIndex] = { ...cards[cardIndex], ...patch };
          slides[slideIndex] = { ...slide, cards };
          return { ...d, heroSlides: slides };
        }),

      updateHeroChrome: (patch) =>
        patchDraft(set, get, (d) => ({ ...d, heroChrome: { ...d.heroChrome, ...patch } })),

      updateFeatured: (patch) =>
        patchDraft(set, get, (d) => ({
          ...d,
          featured: {
            ...d.featured,
            ...patch,
            cardImageOverrides:
              patch.cardImageOverrides !== undefined
                ? clampCardOverrides(patch.cardImageOverrides as [string, string, string])
                : d.featured.cardImageOverrides,
          },
        })),

      updateEvents: (patch) =>
        patchDraft(set, get, (d) => ({ ...d, events: { ...d.events, ...patch } })),

      updateTestimonials: (patch) =>
        patchDraft(set, get, (d) => ({ ...d, testimonials: { ...d.testimonials, ...patch } })),

      updateTestimonialItem: (index, patch) =>
        patchDraft(set, get, (d) => {
          const items = [...d.testimonialItems];
          if (!items[index]) return d;
          items[index] = { ...items[index], ...patch };
          return { ...d, testimonialItems: items };
        }),

      setTrustedBrands: (brands) =>
        patchDraft(set, get, (d) => ({
          ...d,
          trustedBrands: clampStringList(brands, SEED_TRUSTED_BRANDS),
        })),

      updateSchedule: (patch) =>
        patchDraft(set, get, (d) => ({ ...d, schedule: { ...d.schedule, ...patch } })),

      updateOrdering: (patch) =>
        patchDraft(set, get, (d) => ({ ...d, ordering: { ...d.ordering, ...patch } })),

      updateBranchesStrip: (patch) =>
        patchDraft(set, get, (d) => ({ ...d, branchesStrip: { ...d.branchesStrip, ...patch } })),

      updateKadoCircle: (patch) =>
        patchDraft(set, get, (d) => ({
          ...d,
          kadoCircle: {
            ...d.kadoCircle,
            ...patch,
            sponsors: patch.sponsors !== undefined ? clampStringList(patch.sponsors, SEED_KADO_CIRCLE_SPONSORS) : d.kadoCircle.sponsors,
            stats: patch.stats !== undefined ? patch.stats.slice(0, 4) : d.kadoCircle.stats,
          },
        })),

      seed: () => set({ published: SEED_CONTENT, draft: null, isPreviewMode: false }),
    }),
    {
      name: 'kado-landing-content-v3',
      partialize: (state) => ({ published: state.published }),
      merge: (persisted, current) => {
        const c = current as LandingContentStore;
        const p = persisted as { published?: Partial<LandingContentState>; content?: Partial<LandingContentState> } | undefined;
        const legacy = p?.content ?? p?.published;
        return {
          ...c,
          published: normalizeLandingContent(legacy ? { ...c.published, ...legacy } : c.published),
        };
      },
    },
  ),
);

/** Admin editor reads/writes the draft (auto-inits from published). */
export function useLandingDraftContent(): LandingContentState {
  const published = useLandingContentStore((s) => s.published);
  const draft = useLandingContentStore((s) => s.draft);
  return draft ?? published;
}
