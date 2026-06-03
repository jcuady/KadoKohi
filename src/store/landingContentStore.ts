import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HOME_HERO_SLIDES, type HomeHeroSlide, type HomeHeroCardMedia } from '../data/homeHeroMedia';
import { googleReviewsToTestimonials } from '../content/kadoGoogleReviews';
import { clearLandingPreviewDraft, writeLandingPreviewDraft } from '../lib/landingPreviewSession';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { supabase } from '../lib/supabase/client';

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
  shopCtaLabel: string;
  shopCtaPath: string;
  productIds: [string, string, string];
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

export interface BrandMarqueeItem {
  label: string;
  imageUrl?: string;
}

export interface OrderingStepCopy {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
}

export interface OrderingCopy {
  badge: string;
  title: string;
  subtitleDesktop: string;
  subtitleMobile: string;
  steps: OrderingStepCopy[];
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
  sponsors: BrandMarqueeItem[];
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
  trustedBrands: BrandMarqueeItem[];
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

  hydrateFromRemote: () => Promise<void>;
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
  setTrustedBrands: (brands: BrandMarqueeItem[]) => void;
  updateTrustedBrand: (index: number, patch: Partial<BrandMarqueeItem>) => void;
  updateKadoCircleSponsor: (index: number, patch: Partial<BrandMarqueeItem>) => void;
  updateSchedule: (patch: Partial<ScheduleCopy>) => void;
  updateOrdering: (patch: Partial<OrderingCopy>) => void;
  updateOrderingStep: (index: number, patch: Partial<OrderingStepCopy>) => void;
  updateBranchesStrip: (patch: Partial<BranchesStripCopy>) => void;
  updateKadoCircle: (patch: Partial<KadoCircleCopy>) => void;
  seed: () => void;
}

const SEED_TESTIMONIALS: StoredTestimonial[] = googleReviewsToTestimonials();

const SEED_TRUSTED_BRANDS: BrandMarqueeItem[] = [
  { label: 'Oatside', imageUrl: '' },
  { label: 'Emborg', imageUrl: '' },
  { label: 'Aiya Matcha', imageUrl: '' },
  { label: 'Marigold', imageUrl: '' },
  { label: 'Arla', imageUrl: '' },
];

const SEED_KADO_CIRCLE_SPONSORS: BrandMarqueeItem[] = [
  { label: 'Kado Kohi', imageUrl: '/logo/Logo1.png' },
  { label: 'Anytime Fitness', imageUrl: '' },
  { label: 'foodpanda', imageUrl: '' },
  { label: 'GrabFood', imageUrl: '' },
  { label: 'Pick.A.Roo', imageUrl: '' },
  { label: 'Oatside', imageUrl: '' },
  { label: 'Lalamove', imageUrl: '' },
  { label: 'Emborg', imageUrl: '' },
];

const SEED_ORDERING_STEPS: OrderingStepCopy[] = [
  {
    id: 'walk-in',
    eyebrow: 'Walk In',
    title: 'Order at the counter.',
    description:
      'Pull up, pick your drink. Walk in to any branch, browse the board, and tell your barista how you want it — every cup pulled fresh.',
    icon: '☕',
  },
  {
    id: 'online-gcash',
    eyebrow: 'Order Online',
    title: 'Menu, cart & GCash QR.',
    description:
      'Sign in, browse the full menu, and checkout with GCash QR. Upload your payment screenshot — we confirm and queue your order for pickup or delivery.',
    icon: '🌐',
  },
  {
    id: 'table-qr',
    eyebrow: 'Dine In · Table QR',
    title: 'Scan, order, pay with GCash.',
    description:
      'Scan the QR on your table to open the menu for your seat. Add drinks, pay via GCash QR, and upload proof — no app download, no waiting to flag staff.',
    icon: '📷',
  },
  {
    id: 'loyalty',
    eyebrow: 'Kado Circle',
    title: 'Earn stamps & vouchers.',
    description:
      'Completed drink orders earn stamps on your card. Claim rewards in your account, then apply vouchers at checkout for free drinks and merch perks.',
    icon: '🏆',
  },
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
    badge: 'Best Coffees',
    title: 'Coffee Worth Coming Back For.',
    subtitleDesktop: 'Top-performing coffee picks from your live menu - crafted to hook first-timers and regulars.',
    subtitleMobile: 'Best coffee picks from our live menu.',
    menuCtaLabel: 'View Full Menu',
    shopCtaLabel: 'View Shop',
    shopCtaPath: '/menu',
    productIds: ['', '', ''],
    cardImageOverrides: ['', '', ''],
  },
  events: {
    badge: 'Next Massive Event',
    title: 'More than a Corner.',
    subtitle: 'Coffee shop by day. Club and hangout by night. The definitive Marikina social experience.',
    coverImageOverride: '',
    noEventBody: 'No upcoming events right now. Check back soon.',
    noEventBrowseLabel: 'View Kado Events →',
  },
  testimonials: {
    badge: 'Google Reviews',
    title: 'Loved by our community',
    subtitle:
      'Rated 4.9 on Google Maps from 22 reviews. Here’s what guests are saying about Kado Kohi in Marikina.',
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
    subtitleDesktop:
      'Walk in, order online with GCash QR, or scan your table — drink stamps unlock when your order is complete.',
    subtitleMobile: 'Counter, web checkout with GCash, or table QR — stamps on completed drinks.',
    steps: SEED_ORDERING_STEPS.map((s) => ({ ...s })),
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

function clampFeaturedProducts(tuple: [string, string, string] | undefined): [string, string, string] {
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
  // Drop legacy placeholder testimonials (pre–Google Reviews integration).
  if (items.some((t) => t.avatar?.includes('randomuser.me'))) return seed;
  return seed.map((seedItem, i) => ({
    ...seedItem,
    ...(items[i] ?? {}),
    id: seedItem.id,
  }));
}

function toBrandItem(value: unknown, fallback: BrandMarqueeItem): BrandMarqueeItem {
  if (typeof value === 'string') return { label: value.trim() || fallback.label, imageUrl: '' };
  if (value && typeof value === 'object') {
    const v = value as Partial<BrandMarqueeItem>;
    return {
      label: typeof v.label === 'string' && v.label.trim() ? v.label : fallback.label,
      imageUrl: typeof v.imageUrl === 'string' ? v.imageUrl : '',
    };
  }
  return { ...fallback };
}

function clampBrandList(saved: unknown[] | undefined, seed: BrandMarqueeItem[]): BrandMarqueeItem[] {
  if (!Array.isArray(saved) || saved.length === 0) return seed.map((b) => ({ ...b }));
  return seed.map((fallback, i) => toBrandItem(saved[i], fallback));
}

function clampOrderingSteps(saved: OrderingStepCopy[] | undefined): OrderingStepCopy[] {
  const seed = SEED_ORDERING_STEPS;
  if (!Array.isArray(saved) || saved.length === 0) return seed.map((s) => ({ ...s }));
  return seed.map((fallback, i) => {
    const s = saved[i];
    if (!s || typeof s !== 'object') return { ...fallback };
    return {
      id: fallback.id,
      eyebrow: typeof s.eyebrow === 'string' ? s.eyebrow : fallback.eyebrow,
      title: typeof s.title === 'string' ? s.title : fallback.title,
      description: typeof s.description === 'string' ? s.description : fallback.description,
      icon: typeof s.icon === 'string' ? s.icon : fallback.icon,
    };
  });
}

export function normalizeLandingContent(raw: Partial<LandingContentState> | undefined): LandingContentState {
  if (!raw || typeof raw !== 'object') return SEED_CONTENT;

  return {
    heroSlides: clampHeroSlides(raw.heroSlides),
    heroChrome: { ...SEED_CONTENT.heroChrome, ...(raw.heroChrome ?? {}) },
    featured: {
      ...SEED_CONTENT.featured,
      ...raw.featured,
      productIds: clampFeaturedProducts(
        raw.featured?.productIds as [string, string, string] | undefined,
      ),
      cardImageOverrides: clampCardOverrides(
        raw.featured?.cardImageOverrides as [string, string, string] | undefined,
      ),
    },
    events: { ...SEED_CONTENT.events, ...(raw.events ?? {}) },
    testimonials: { ...SEED_CONTENT.testimonials, ...(raw.testimonials ?? {}) },
    testimonialItems: clampTestimonials(raw.testimonialItems),
    trustedBrands: clampBrandList(raw.trustedBrands as unknown[] | undefined, SEED_TRUSTED_BRANDS),
    schedule: { ...SEED_CONTENT.schedule, ...(raw.schedule ?? {}) },
    ordering: {
      ...SEED_CONTENT.ordering,
      ...(raw.ordering ?? {}),
      steps: clampOrderingSteps(raw.ordering?.steps),
    },
    branchesStrip: { ...SEED_CONTENT.branchesStrip, ...(raw.branchesStrip ?? {}) },
    kadoCircle: {
      ...SEED_CONTENT.kadoCircle,
      ...(raw.kadoCircle ?? {}),
      sponsors: clampBrandList(raw.kadoCircle?.sponsors as unknown[] | undefined, SEED_KADO_CIRCLE_SPONSORS),
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

      hydrateFromRemote: async () => {
        if (!supabase) return;
        try {
          const remote = await orderingRepo.fetchLandingContent();
          if (remote && typeof remote === 'object') {
            set({ published: normalizeLandingContent(remote as Partial<LandingContentState>) });
          }
        } catch {
          // Keep current published content when remote fetch fails.
        }
      },

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
        const published = cloneContent(draft);
        set({ published, draft: null, isPreviewMode: false });
        // Persist to the shared CMS so real visitors see the update across devices.
        void orderingRepo.upsertLandingContent(published).catch(() => {});
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
            productIds:
              patch.productIds !== undefined
                ? clampFeaturedProducts(patch.productIds as [string, string, string])
                : d.featured.productIds,
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
          trustedBrands: clampBrandList(brands, SEED_TRUSTED_BRANDS),
        })),

      updateTrustedBrand: (index, patch) =>
        patchDraft(set, get, (d) => {
          const brands = [...d.trustedBrands];
          if (!brands[index]) return d;
          brands[index] = { ...brands[index], ...patch };
          return { ...d, trustedBrands: clampBrandList(brands, SEED_TRUSTED_BRANDS) };
        }),

      updateKadoCircleSponsor: (index, patch) =>
        patchDraft(set, get, (d) => {
          const sponsors = [...d.kadoCircle.sponsors];
          if (!sponsors[index]) return d;
          sponsors[index] = { ...sponsors[index], ...patch };
          return {
            ...d,
            kadoCircle: {
              ...d.kadoCircle,
              sponsors: clampBrandList(sponsors, SEED_KADO_CIRCLE_SPONSORS),
            },
          };
        }),

      updateSchedule: (patch) =>
        patchDraft(set, get, (d) => ({ ...d, schedule: { ...d.schedule, ...patch } })),

      updateOrdering: (patch) =>
        patchDraft(set, get, (d) => ({
          ...d,
          ordering: {
            ...d.ordering,
            ...patch,
            steps: patch.steps !== undefined ? clampOrderingSteps(patch.steps) : d.ordering.steps,
          },
        })),

      updateOrderingStep: (index, patch) =>
        patchDraft(set, get, (d) => {
          const steps = [...d.ordering.steps];
          if (!steps[index]) return d;
          steps[index] = { ...steps[index], ...patch, id: steps[index].id };
          return { ...d, ordering: { ...d.ordering, steps: clampOrderingSteps(steps) } };
        }),

      updateBranchesStrip: (patch) =>
        patchDraft(set, get, (d) => ({ ...d, branchesStrip: { ...d.branchesStrip, ...patch } })),

      updateKadoCircle: (patch) =>
        patchDraft(set, get, (d) => ({
          ...d,
          kadoCircle: {
            ...d.kadoCircle,
            ...patch,
            sponsors:
              patch.sponsors !== undefined
                ? clampBrandList(patch.sponsors, SEED_KADO_CIRCLE_SPONSORS)
                : d.kadoCircle.sponsors,
            stats: patch.stats !== undefined ? patch.stats.slice(0, 4) : d.kadoCircle.stats,
          },
        })),

      seed: () => set({ published: SEED_CONTENT, draft: null, isPreviewMode: false }),
    }),
    {
      name: 'kado-landing-content-v4',
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
