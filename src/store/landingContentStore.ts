import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clampCmsTextField, cmsTextPlain, type CmsText } from '../lib/cmsTypography';
import { HOME_HERO_SLIDES, type HomeHeroSlide, type HomeHeroCardMedia } from '../data/homeHeroMedia';
import { SEO_PREMIUM_MATCHA_MARIKINA } from '../content/seo';
import { googleReviewsToTestimonials } from '../content/kadoGoogleReviews';
import { clearLandingPreviewDraft, writeLandingPreviewDraft } from '../lib/landingPreviewSession';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { SEED_HOME_FAQ_ITEMS } from '../data/homeFaqSeed';

export type { CmsText };

export interface HeroChrome {
  /** Large SEO headline above the rotating slide title. */
  mainHeadline: CmsText;
  locationBadge: CmsText;
  imageCredit: CmsText;
  primaryCtaLabel: CmsText;
  primaryCtaPath: string;
  secondaryCtaLabel: CmsText;
  secondaryCtaPath: string;
}

export interface FeaturedCopy {
  badge: CmsText;
  title: CmsText;
  subtitleDesktop: CmsText;
  subtitleMobile: CmsText;
  menuCtaLabel: CmsText;
  shopCtaLabel: CmsText;
  shopCtaPath: string;
  productIds: [string, string, string];
  cardImageOverrides: [string, string, string];
}

export interface EventsCopy {
  badge: CmsText;
  title: CmsText;
  subtitle: CmsText;
  coverImageOverride: string;
  noEventBody: CmsText;
  noEventBrowseLabel: CmsText;
}

export interface TestimonialsCopy {
  badge: CmsText;
  title: CmsText;
  subtitle: CmsText;
  trustedTitle: CmsText;
}

export interface StoredTestimonial {
  id: number;
  name: CmsText;
  role: CmsText;
  company: CmsText;
  content: CmsText;
  rating: number;
  avatar: string;
}

export interface BrandMarqueeItem {
  label: CmsText;
  imageUrl?: string;
}

export interface OrderingStepCopy {
  id: string;
  eyebrow: CmsText;
  title: CmsText;
  description: CmsText;
  icon: string;
}

export interface OrderingCopy {
  badge: CmsText;
  title: CmsText;
  subtitleDesktop: CmsText;
  subtitleMobile: CmsText;
  steps: OrderingStepCopy[];
}

export interface BranchesStripCopy {
  badge: CmsText;
  title: CmsText;
  ctaLabel: CmsText;
}

export interface KadoCircleStat {
  num: CmsText;
  label: CmsText;
}

export interface KadoCircleCopy {
  badge: CmsText;
  titleBefore: CmsText;
  titleAccent: CmsText;
  body: CmsText;
  emailPlaceholder: string;
  submitLabel: CmsText;
  disclaimer: CmsText;
  marqueeLabel: CmsText;
  sponsors: BrandMarqueeItem[];
  stats: KadoCircleStat[];
  footerLinkLabel: CmsText;
}

export interface AccentHeadlineCopy {
  beforeAccent1: CmsText;
  accent1: CmsText;
  middle: CmsText;
  accent2: CmsText;
  afterAccent2: CmsText;
}

export interface HomepagePillarCopy {
  title: CmsText;
  subtitle: CmsText;
  imageUrl: string;
  imageAlt: string;
  body?: CmsText;
}

export type MenuSeoPillarCategoryKey = 'matcha' | 'signatures' | 'classics' | 'sodas-yuzu';

export interface MenuSeoPillarCopy extends HomepagePillarCopy {
  drinkCategoryKey: MenuSeoPillarCategoryKey;
}

export interface BrandStoryCopy {
  badge: CmsText;
  headline: AccentHeadlineCopy;
  intro: CmsText;
  pillars: [HomepagePillarCopy, HomepagePillarCopy, HomepagePillarCopy];
  footerTagline1: CmsText;
  footerTagline2: CmsText;
  ctaLabel: CmsText;
  socialHeading: CmsText;
}

export interface MenuSeoCopy {
  locationBadge: CmsText;
  headline: AccentHeadlineCopy;
  locationChipLabel: CmsText;
  pillars: [MenuSeoPillarCopy, MenuSeoPillarCopy, MenuSeoPillarCopy, MenuSeoPillarCopy];
  bodyParagraphs: [CmsText, CmsText];
  exploreHeading: CmsText;
}

export interface FaqItemCopy {
  question: CmsText;
  answer: CmsText;
}

export interface FaqCopy {
  eyebrow: CmsText;
  title: CmsText;
  subtitle: CmsText;
  items: FaqItemCopy[];
  footerText: CmsText;
  contactCtaLabel: CmsText;
}

/** Fixed homepage layout — only text/images inside each slot are editable. */
export interface LandingContentState {
  heroSlides: HomeHeroSlide[];
  heroChrome: HeroChrome;
  storySeo: BrandStoryCopy;
  menuSeo: MenuSeoCopy;
  featured: FeaturedCopy;
  events: EventsCopy;
  testimonials: TestimonialsCopy;
  testimonialItems: StoredTestimonial[];
  trustedBrands: BrandMarqueeItem[];
  ordering: OrderingCopy;
  branchesStrip: BranchesStripCopy;
  faq: FaqCopy;
  kadoCircle: KadoCircleCopy;
}

interface LandingContentStore {
  /** Live content on the public site (persisted). */
  published: LandingContentState;
  /** Working copy while editing in admin (not persisted). */
  draft: LandingContentState | null;
  /** Undo/redo snapshots (draft JSON); not persisted across reloads. */
  undoStack: string[];
  redoStack: string[];
  /** When true, home + ?preview=1 read from draft. */
  isPreviewMode: boolean;

  hydrateFromRemote: () => Promise<void>;
  initDraft: () => void;
  discardDraft: () => void;
  publishDraft: () => Promise<void>;
  undoDraft: () => void;
  redoDraft: () => void;
  canUndoDraft: () => boolean;
  canRedoDraft: () => boolean;
  publishError: string | null;
  clearPublishError: () => void;
  setPreviewMode: (active: boolean) => void;

  updateHeroSlide: (index: number, patch: Partial<HomeHeroSlide>) => void;
  updateHeroCard: (slideIndex: number, cardIndex: number, patch: Partial<HomeHeroCardMedia>) => void;
  updateHeroChrome: (patch: Partial<HeroChrome>) => void;
  updateStorySeo: (patch: Partial<BrandStoryCopy>) => void;
  updateStorySeoPillar: (index: number, patch: Partial<HomepagePillarCopy>) => void;
  updateMenuSeo: (patch: Partial<MenuSeoCopy>) => void;
  updateMenuSeoPillar: (index: number, patch: Partial<MenuSeoPillarCopy>) => void;
  updateFeatured: (patch: Partial<FeaturedCopy>) => void;
  updateEvents: (patch: Partial<EventsCopy>) => void;
  updateTestimonials: (patch: Partial<TestimonialsCopy>) => void;
  updateTestimonialItem: (index: number, patch: Partial<StoredTestimonial>) => void;
  setTrustedBrands: (brands: BrandMarqueeItem[]) => void;
  updateTrustedBrand: (index: number, patch: Partial<BrandMarqueeItem>) => void;
  updateKadoCircleSponsor: (index: number, patch: Partial<BrandMarqueeItem>) => void;
  updateOrdering: (patch: Partial<OrderingCopy>) => void;
  updateOrderingStep: (index: number, patch: Partial<OrderingStepCopy>) => void;
  reorderOrderingSteps: (fromIndex: number, toIndex: number) => void;
  updateBranchesStrip: (patch: Partial<BranchesStripCopy>) => void;
  updateFaq: (patch: Partial<FaqCopy>) => void;
  updateFaqItem: (index: number, patch: Partial<FaqItemCopy>) => void;
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
    icon: '',
  },
  {
    id: 'online-gcash',
    eyebrow: 'Order Online',
    title: 'Menu, cart & GCash QR.',
    description:
      'Sign in, browse the full menu, and checkout with GCash QR. Upload your payment screenshot — we confirm and queue your order for pickup or delivery.',
    icon: '',
  },
  {
    id: 'table-qr',
    eyebrow: 'Dine In · Table QR',
    title: 'Scan, order, pay with GCash.',
    description:
      'Scan the QR on your table to open the menu for your seat. Add drinks, pay via GCash QR, and upload proof — no app download, no waiting to flag staff.',
    icon: '',
  },
  {
    id: 'loyalty',
    eyebrow: 'Kado Circle',
    title: 'Earn stamps & vouchers.',
    description:
      'Completed drink orders earn stamps on your card. Claim rewards in your account, then apply vouchers at checkout for free drinks and merch perks.',
    icon: '',
  },
];

const SEED_STORY_PILLARS: [HomepagePillarCopy, HomepagePillarCopy, HomepagePillarCopy] = [
  {
    title: 'Visit',
    subtitle: 'Sta. Elena, Marikina',
    imageUrl: '/featuredmarikina/kadom1.jpg',
    imageAlt: 'Kado Kohi specialty cafe interior in Sta. Elena, Marikina',
    body: 'J.P. Laurel corner Mt. Everest — a Japanese-inspired tambayan for coffee near me in Marikina.',
  },
  {
    title: 'Sip',
    subtitle: 'Matcha · Hojicha · Lattes',
    imageUrl: '/featuredmarikina/kadom2.jpg',
    imageAlt: 'Specialty matcha and coffee drinks at Kado Coffee Marikina',
    body: 'Best matcha in Marikina, hojicha oat latte, and the KADO Latte — honest craft, quality ingredients.',
  },
  {
    title: 'Stay',
    subtitle: 'Events & booth coffee',
    imageUrl: '/booth-photos/booth-1.jpg',
    imageAlt: 'Kado Coffee mobile booth and community events in Marikina',
    body: 'Tambayan nights, pop-ups, and mobile booth booking for weddings and events in Metro Manila.',
  },
];

const SEED_MENU_SEO_PILLARS: [
  MenuSeoPillarCopy,
  MenuSeoPillarCopy,
  MenuSeoPillarCopy,
  MenuSeoPillarCopy,
] = [
  {
    title: 'Matcha & hojicha',
    subtitle: 'Matcha & hojicha in Marikina',
    imageUrl: '/social/matcha-series.png',
    imageAlt: 'Kado Coffee matcha and hojicha drinks in Marikina',
    drinkCategoryKey: 'matcha',
  },
  {
    title: 'Signature lattes',
    subtitle: 'Torched muscovado & more',
    imageUrl: '/social/matcha-latte.png',
    imageAlt: SEO_PREMIUM_MATCHA_MARIKINA,
    drinkCategoryKey: 'signatures',
  },
  {
    title: 'Classics',
    subtitle: 'Hot, iced, or oat milk',
    imageUrl: '/social/matcha-series.png',
    imageAlt: SEO_PREMIUM_MATCHA_MARIKINA,
    drinkCategoryKey: 'classics',
  },
  {
    title: 'Sodas & yuzu',
    subtitle: 'Bright & citrus-forward',
    imageUrl: '/social/matcha-latte.png',
    imageAlt: 'Refreshing yuzu sodas at Kado Kohi',
    drinkCategoryKey: 'sodas-yuzu',
  },
];

export const SEED_CONTENT: LandingContentState = {
  heroSlides: HOME_HERO_SLIDES,
  heroChrome: {
    mainHeadline: 'Kado Coffee — Matcha & Specialty Coffee in Marikina',
    locationBadge: 'Kado Coffee · Marikina',
    imageCredit: 'Images: Kado Kohi Social + InsideMarikina',
    primaryCtaLabel: 'Explore Menu',
    primaryCtaPath: '/menu',
    secondaryCtaLabel: 'Shop Merch',
    secondaryCtaPath: '/merch',
  },
  storySeo: {
    badge: 'Our story',
    headline: {
      beforeAccent1: 'the story ',
      accent1: 'behind every',
      middle: ' sip — where passion meets ',
      accent2: 'perfection',
      afterAccent2: ', shaped by skill, brewed by heart.',
    },
    intro:
      'Kado Coffee (Kado Kohi) is a 4.9-star specialty cafe in Sta. Elena, Marikina. Our Coffee, Our Rules — honest craft for guests who want quality, not hype.',
    pillars: SEED_STORY_PILLARS.map((p) => ({ ...p })) as [HomepagePillarCopy, HomepagePillarCopy, HomepagePillarCopy],
    footerTagline1: 'We are Kado Kohi and we will',
    footerTagline2: 'brew it honest',
    ctaLabel: 'Explore menu',
    socialHeading: 'Follow along',
  },
  menuSeo: {
    locationBadge: 'Sta. Elena · Marikina',
    headline: {
      beforeAccent1: 'the cup ',
      accent1: 'behind every',
      middle: ' corner — matcha & hojicha, crafted ',
      accent2: 'with care',
      afterAccent2: ', brewed by heart.',
    },
    locationChipLabel: 'Coffee near me · Sta. Elena',
    pillars: SEED_MENU_SEO_PILLARS.map((p) => ({ ...p })) as [
      MenuSeoPillarCopy,
      MenuSeoPillarCopy,
      MenuSeoPillarCopy,
      MenuSeoPillarCopy,
    ],
    bodyParagraphs: [
      'Japanese-inspired specialty cafe on J.P. Laurel, Sta. Elena — matcha, hojicha oat lattes, and signature drinks in a neighborhood tambayan rated 4.9 stars on Google.',
      'Dine-in, takeout, or order online. Join our events or book the mobile booth for gatherings across Metro Manila.',
    ],
    exploreHeading: 'Explore',
  },
  featured: {
    badge: 'Signature Sips',
    title: 'Coffee Worth Coming Back For.',
    subtitleDesktop:
      'Top specialty coffee picks from our live menu — crafted for first-timers, regulars, and your Marikina tambayan.',
    subtitleMobile: 'Best specialty coffee picks from our Marikina menu.',
    menuCtaLabel: 'View Full Menu',
    shopCtaLabel: 'View Shop',
    shopCtaPath: '/menu',
    productIds: ['', '', ''],
    cardImageOverrides: ['', '', ''],
  },
  events: {
    badge: 'Events & Tambayan',
    title: 'More than a Corner.',
    subtitle:
      'Specialty coffee by day. Tambayan nights, pop-ups, and event coffee — the definitive Marikina hangout.',
    coverImageOverride: '',
    noEventBody: 'No upcoming events right now. Check back soon.',
    noEventBrowseLabel: 'View Kado Events →',
  },
  testimonials: {
    badge: 'Google Reviews',
    title: 'Loved by our community',
    subtitle:
      'Rated 4.9 on Google Maps as Kado Coffee — 22 reviews from guests who love our Marikina specialty coffee tambayan.',
    trustedTitle: 'Uses trusted brands like',
  },
  testimonialItems: SEED_TESTIMONIALS,
  trustedBrands: SEED_TRUSTED_BRANDS,
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
  faq: {
    eyebrow: 'KADO KŌHĪ',
    title: 'Frequently Asked Questions',
    subtitle: '',
    items: SEED_HOME_FAQ_ITEMS.map((item) => ({ ...item })),
    footerText: 'Got more questions?',
    contactCtaLabel: '@kadocoffeeph',
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
      title: clampCmsTextField(saved.cards?.[ci]?.title, seedCard.title),
      tag: clampCmsTextField(saved.cards?.[ci]?.tag, seedCard.tag),
    }));
    return {
      ...seedSlide,
      ...saved,
      id: seedSlide.id,
      title: clampCmsTextField(saved.title, seedSlide.title),
      subtitle: clampCmsTextField(saved.subtitle, seedSlide.subtitle),
      cards,
    };
  });
}

function clampTestimonials(items: StoredTestimonial[] | undefined): StoredTestimonial[] {
  const seed = SEED_CONTENT.testimonialItems;
  if (!Array.isArray(items) || items.length === 0) return seed;
  if (items.some((t) => t.avatar?.includes('randomuser.me'))) return seed;
  return seed.map((seedItem, i) => {
    const saved = items[i];
    if (!saved) return { ...seedItem };
    return {
      ...seedItem,
      ...saved,
      id: seedItem.id,
      name: clampCmsTextField(saved.name, seedItem.name),
      role: clampCmsTextField(saved.role, seedItem.role),
      company: clampCmsTextField(saved.company, seedItem.company),
      content: clampCmsTextField(saved.content, seedItem.content),
    };
  });
}

function toBrandItem(value: unknown, fallback: BrandMarqueeItem): BrandMarqueeItem {
  if (typeof value === 'string') {
    return { label: clampCmsTextField(value, fallback.label), imageUrl: '' };
  }
  if (value && typeof value === 'object') {
    const v = value as Partial<BrandMarqueeItem>;
    return {
      label: clampCmsTextField(v.label, fallback.label),
      imageUrl: typeof v.imageUrl === 'string' ? v.imageUrl : '',
    };
  }
  return { ...fallback };
}

function clampBrandList(saved: unknown[] | undefined, seed: BrandMarqueeItem[]): BrandMarqueeItem[] {
  if (!Array.isArray(saved) || saved.length === 0) return seed.map((b) => ({ ...b }));
  return seed.map((fallback, i) => toBrandItem(saved[i], fallback));
}

function clampAccentHeadline(
  saved: Partial<AccentHeadlineCopy> | undefined,
  seed: AccentHeadlineCopy,
): AccentHeadlineCopy {
  if (!saved || typeof saved !== 'object') return { ...seed };
  return {
    beforeAccent1: clampCmsTextField(saved.beforeAccent1, seed.beforeAccent1),
    accent1: clampCmsTextField(saved.accent1, seed.accent1),
    middle: clampCmsTextField(saved.middle, seed.middle),
    accent2: clampCmsTextField(saved.accent2, seed.accent2),
    afterAccent2: clampCmsTextField(saved.afterAccent2, seed.afterAccent2),
  };
}

function clampHomepagePillars(
  saved: HomepagePillarCopy[] | undefined,
  seed: [HomepagePillarCopy, HomepagePillarCopy, HomepagePillarCopy],
): [HomepagePillarCopy, HomepagePillarCopy, HomepagePillarCopy] {
  return seed.map((fallback, i) => {
    const p = saved?.[i];
    if (!p || typeof p !== 'object') return { ...fallback };
    return {
      title: clampCmsTextField(p.title, fallback.title),
      subtitle: clampCmsTextField(p.subtitle, fallback.subtitle),
      imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : fallback.imageUrl,
      imageAlt: typeof p.imageAlt === 'string' ? p.imageAlt : fallback.imageAlt,
      body: p.body != null ? clampCmsTextField(p.body, fallback.body ?? '') : fallback.body,
    };
  }) as [HomepagePillarCopy, HomepagePillarCopy, HomepagePillarCopy];
}

function migrateMenuSeoPillars(saved: MenuSeoPillarCopy[] | undefined): MenuSeoPillarCopy[] | undefined {
  if (!Array.isArray(saved) || saved.length === 0) return saved;
  if (saved.length >= 4) return saved;
  const thirdKey = saved[2]?.drinkCategoryKey as string | undefined;
  if (saved.length === 3 && thirdKey === 'classics-yuzu') {
    const legacy = saved[2];
    return [
      saved[0],
      saved[1],
      {
        ...legacy,
        title: clampCmsTextField(legacy.title, SEED_MENU_SEO_PILLARS[2].title),
        drinkCategoryKey: 'classics',
      },
      { ...SEED_MENU_SEO_PILLARS[3] },
    ];
  }
  const out = [...saved];
  while (out.length < 4) out.push({ ...SEED_MENU_SEO_PILLARS[out.length] });
  return out;
}

function clampMenuSeoPillars(
  saved: MenuSeoPillarCopy[] | undefined,
  seed: [MenuSeoPillarCopy, MenuSeoPillarCopy, MenuSeoPillarCopy, MenuSeoPillarCopy],
): [MenuSeoPillarCopy, MenuSeoPillarCopy, MenuSeoPillarCopy, MenuSeoPillarCopy] {
  const keys: MenuSeoPillarCategoryKey[] = ['matcha', 'signatures', 'classics', 'sodas-yuzu'];
  const migrated = migrateMenuSeoPillars(saved);
  return seed.map((fallback, i) => {
    const p = migrated?.[i];
    if (!p || typeof p !== 'object') return { ...fallback };
    const legacyKey = p.drinkCategoryKey as string;
    const key =
      keys.includes(p.drinkCategoryKey as MenuSeoPillarCategoryKey)
        ? (p.drinkCategoryKey as MenuSeoPillarCategoryKey)
        : legacyKey === 'classics-yuzu' && i === 2
          ? 'classics'
          : fallback.drinkCategoryKey;
    return {
      title: clampCmsTextField(p.title, fallback.title),
      subtitle: clampCmsTextField(p.subtitle, fallback.subtitle),
      imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : fallback.imageUrl,
      imageAlt: typeof p.imageAlt === 'string' ? p.imageAlt : fallback.imageAlt,
      drinkCategoryKey: key,
    };
  }) as [MenuSeoPillarCopy, MenuSeoPillarCopy, MenuSeoPillarCopy, MenuSeoPillarCopy];
}

function clampBodyParagraphs(
  saved: unknown[] | undefined,
  seed: [CmsText, CmsText],
): [CmsText, CmsText] {
  if (!Array.isArray(saved) || saved.length < 2) return [...seed];
  return [clampCmsTextField(saved[0], seed[0]), clampCmsTextField(saved[1], seed[1])];
}

function clampOrderingSteps(saved: OrderingStepCopy[] | undefined): OrderingStepCopy[] {
  const seed = SEED_ORDERING_STEPS;
  if (!Array.isArray(saved) || saved.length === 0) return seed.map((s) => ({ ...s }));
  return seed.map((fallback, i) => {
    const s = saved[i];
    if (!s || typeof s !== 'object') return { ...fallback };
    return {
      id: fallback.id,
      eyebrow: clampCmsTextField(s.eyebrow, fallback.eyebrow),
      title: clampCmsTextField(s.title, fallback.title),
      description: clampCmsTextField(s.description, fallback.description),
      icon: '',
    };
  });
}

function clampCmsSection<S extends object>(
  seed: S,
  raw: Partial<S> | undefined,
  textKeys: (keyof S)[],
): S {
  const out = { ...seed, ...(raw ?? {}) } as S;
  for (const key of textKeys) {
    (out as Record<string, unknown>)[key as string] = clampCmsTextField(raw?.[key], seed[key] as CmsText);
  }
  return out;
}

function clampFaqItems(saved: FaqItemCopy[] | undefined, seed: FaqItemCopy[]): FaqItemCopy[] {
  return seed.map((fallback, i) => {
    const item = saved?.[i];
    return {
      question: clampCmsTextField(item?.question, fallback.question),
      answer: clampCmsTextField(item?.answer, fallback.answer),
    };
  });
}

function clampFaq(raw: Partial<FaqCopy> | undefined, seed: FaqCopy): FaqCopy {
  return {
    ...clampCmsSection(seed, raw, ['eyebrow', 'title', 'subtitle', 'footerText', 'contactCtaLabel']),
    items: clampFaqItems(raw?.items, seed.items),
  };
}

export function normalizeLandingContent(raw: Partial<LandingContentState> | undefined): LandingContentState {
  if (!raw || typeof raw !== 'object') return SEED_CONTENT;

  return {
    heroSlides: clampHeroSlides(raw.heroSlides),
    heroChrome: clampCmsSection(SEED_CONTENT.heroChrome, raw.heroChrome, [
      'mainHeadline',
      'locationBadge',
      'imageCredit',
      'primaryCtaLabel',
      'secondaryCtaLabel',
    ]),
    storySeo: {
      ...clampCmsSection(SEED_CONTENT.storySeo, raw.storySeo, [
        'badge',
        'intro',
        'footerTagline1',
        'footerTagline2',
        'ctaLabel',
        'socialHeading',
      ]),
      headline: clampAccentHeadline(raw.storySeo?.headline, SEED_CONTENT.storySeo.headline),
      pillars: clampHomepagePillars(raw.storySeo?.pillars, SEED_CONTENT.storySeo.pillars),
    },
    menuSeo: {
      ...clampCmsSection(SEED_CONTENT.menuSeo, raw.menuSeo, ['locationBadge', 'locationChipLabel', 'exploreHeading']),
      headline: clampAccentHeadline(raw.menuSeo?.headline, SEED_CONTENT.menuSeo.headline),
      pillars: clampMenuSeoPillars(raw.menuSeo?.pillars, SEED_CONTENT.menuSeo.pillars),
      bodyParagraphs: clampBodyParagraphs(raw.menuSeo?.bodyParagraphs, SEED_CONTENT.menuSeo.bodyParagraphs),
    },
    featured: {
      ...clampCmsSection(SEED_CONTENT.featured, raw.featured, [
        'badge',
        'title',
        'subtitleDesktop',
        'subtitleMobile',
        'menuCtaLabel',
        'shopCtaLabel',
      ]),
      productIds: clampFeaturedProducts(
        raw.featured?.productIds as [string, string, string] | undefined,
      ),
      cardImageOverrides: clampCardOverrides(
        raw.featured?.cardImageOverrides as [string, string, string] | undefined,
      ),
    },
    events: clampCmsSection(SEED_CONTENT.events, raw.events, [
      'badge',
      'title',
      'subtitle',
      'noEventBody',
      'noEventBrowseLabel',
    ]),
    testimonials: clampCmsSection(SEED_CONTENT.testimonials, raw.testimonials, [
      'badge',
      'title',
      'subtitle',
      'trustedTitle',
    ]),
    testimonialItems: clampTestimonials(raw.testimonialItems),
    trustedBrands: clampBrandList(raw.trustedBrands as unknown[] | undefined, SEED_TRUSTED_BRANDS),
    ordering: {
      ...clampCmsSection(SEED_CONTENT.ordering, raw.ordering, [
        'badge',
        'title',
        'subtitleDesktop',
        'subtitleMobile',
      ]),
      steps: clampOrderingSteps(raw.ordering?.steps),
    },
    branchesStrip: clampCmsSection(SEED_CONTENT.branchesStrip, raw.branchesStrip, ['badge', 'title', 'ctaLabel']),
    faq: clampFaq(raw.faq, SEED_CONTENT.faq),
    kadoCircle: {
      ...clampCmsSection(SEED_CONTENT.kadoCircle, raw.kadoCircle, [
        'badge',
        'titleBefore',
        'titleAccent',
        'body',
        'submitLabel',
        'disclaimer',
        'marqueeLabel',
        'footerLinkLabel',
      ]),
      sponsors: clampBrandList(raw.kadoCircle?.sponsors as unknown[] | undefined, SEED_KADO_CIRCLE_SPONSORS),
      stats:
        Array.isArray(raw.kadoCircle?.stats) && raw.kadoCircle.stats.length >= 4
          ? raw.kadoCircle.stats.slice(0, 4).map((stat, i) => ({
              num: clampCmsTextField(stat?.num, SEED_CONTENT.kadoCircle.stats[i]?.num ?? ''),
              label: clampCmsTextField(stat?.label, SEED_CONTENT.kadoCircle.stats[i]?.label ?? ''),
            }))
          : SEED_CONTENT.kadoCircle.stats,
    },
  };
}

const MAX_UNDO = 50;

function cloneContent(state: LandingContentState): LandingContentState {
  return JSON.parse(JSON.stringify(state)) as LandingContentState;
}

/** Drop retired CMS keys before persisting (e.g. legacy Mix & Match `schedule`). */
function stripLegacyLandingFields(state: LandingContentState): LandingContentState {
  const payload = JSON.parse(JSON.stringify(state)) as LandingContentState & { schedule?: unknown };
  delete payload.schedule;
  return payload;
}

function pushUndoSnapshot(
  set: (fn: (s: LandingContentStore) => Partial<LandingContentStore> | LandingContentStore) => void,
  get: () => LandingContentStore,
) {
  const { draft, published } = get();
  const snapshot = JSON.stringify(cloneContent(draft ?? published));
  set((s) => ({
    undoStack: [...s.undoStack, snapshot].slice(-MAX_UNDO),
    redoStack: [],
  }));
}

function patchDraft(
  set: (fn: (s: LandingContentStore) => Partial<LandingContentStore> | LandingContentStore) => void,
  get: () => LandingContentStore,
  patcher: (draft: LandingContentState) => LandingContentState,
  options?: { skipHistory?: boolean },
) {
  if (!options?.skipHistory) pushUndoSnapshot(set, get);
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
      undoStack: [],
      redoStack: [],
      isPreviewMode: false,
      publishError: null,

      hydrateFromRemote: async () => {
        try {
          const remote = await orderingRepo.fetchLandingContent();
          if (remote && typeof remote === 'object') {
            set({ published: stripLegacyLandingFields(normalizeLandingContent(remote as Partial<LandingContentState>)) });
          }
        } catch {
          // Keep current published content when remote fetch fails.
        }
      },

      initDraft: () => {
        const draft = cloneContent(get().published);
        set({ draft, undoStack: [], redoStack: [] });
      },
      discardDraft: () => {
        clearLandingPreviewDraft();
        set({ draft: null, isPreviewMode: false, undoStack: [], redoStack: [] });
      },
      clearPublishError: () => set({ publishError: null }),
      canUndoDraft: () => get().undoStack.length > 0,
      canRedoDraft: () => get().redoStack.length > 0,
      undoDraft: () => {
        const { undoStack, redoStack, draft, published } = get();
        if (undoStack.length === 0) return;
        const current = JSON.stringify(cloneContent(draft ?? published));
        const previous = undoStack[undoStack.length - 1]!;
        const nextDraft = JSON.parse(previous) as LandingContentState;
        set({
          draft: nextDraft,
          undoStack: undoStack.slice(0, -1),
          redoStack: [...redoStack, current].slice(-MAX_UNDO),
        });
        writeLandingPreviewDraft(nextDraft);
      },
      redoDraft: () => {
        const { undoStack, redoStack, draft, published } = get();
        if (redoStack.length === 0) return;
        const current = JSON.stringify(cloneContent(draft ?? published));
        const next = redoStack[redoStack.length - 1]!;
        const nextDraft = JSON.parse(next) as LandingContentState;
        set({
          draft: nextDraft,
          undoStack: [...undoStack, current].slice(-MAX_UNDO),
          redoStack: redoStack.slice(0, -1),
        });
        writeLandingPreviewDraft(nextDraft);
      },
      publishDraft: async () => {
        const { draft } = get();
        if (!draft) return;
        set({ publishError: null });
        const nextPublished = stripLegacyLandingFields(cloneContent(draft));
        try {
          await orderingRepo.upsertLandingContent(nextPublished);
          clearLandingPreviewDraft();
          set({
            published: nextPublished,
            draft: null,
            isPreviewMode: false,
            publishError: null,
            undoStack: [],
            redoStack: [],
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Could not save homepage content to the database.';
          set({ publishError: message });
        }
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

      updateStorySeo: (patch) =>
        patchDraft(set, get, (d) => ({
          ...d,
          storySeo: {
            ...d.storySeo,
            ...patch,
            headline:
              patch.headline !== undefined
                ? clampAccentHeadline(patch.headline, d.storySeo.headline)
                : d.storySeo.headline,
            pillars:
              patch.pillars !== undefined
                ? clampHomepagePillars(patch.pillars, d.storySeo.pillars)
                : d.storySeo.pillars,
          },
        })),

      updateStorySeoPillar: (index, patch) =>
        patchDraft(set, get, (d) => {
          const pillars = clampHomepagePillars([...d.storySeo.pillars], d.storySeo.pillars);
          if (!pillars[index]) return d;
          pillars[index] = { ...pillars[index], ...patch };
          return { ...d, storySeo: { ...d.storySeo, pillars } };
        }),

      updateMenuSeo: (patch) =>
        patchDraft(set, get, (d) => ({
          ...d,
          menuSeo: {
            ...d.menuSeo,
            ...patch,
            headline:
              patch.headline !== undefined
                ? clampAccentHeadline(patch.headline, d.menuSeo.headline)
                : d.menuSeo.headline,
            pillars:
              patch.pillars !== undefined
                ? clampMenuSeoPillars(patch.pillars, d.menuSeo.pillars)
                : d.menuSeo.pillars,
            bodyParagraphs:
              patch.bodyParagraphs !== undefined
                ? clampBodyParagraphs(patch.bodyParagraphs, d.menuSeo.bodyParagraphs)
                : d.menuSeo.bodyParagraphs,
          },
        })),

      updateMenuSeoPillar: (index, patch) =>
        patchDraft(set, get, (d) => {
          const pillars = clampMenuSeoPillars([...d.menuSeo.pillars], d.menuSeo.pillars);
          if (!pillars[index]) return d;
          pillars[index] = { ...pillars[index], ...patch };
          return { ...d, menuSeo: { ...d.menuSeo, pillars } };
        }),

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

      reorderOrderingSteps: (fromIndex, toIndex) =>
        patchDraft(set, get, (d) => {
          const steps = [...d.ordering.steps];
          const [moved] = steps.splice(fromIndex, 1);
          if (!moved) return d;
          steps.splice(toIndex, 0, moved);
          return { ...d, ordering: { ...d.ordering, steps: clampOrderingSteps(steps) } };
        }),

      updateBranchesStrip: (patch) =>
        patchDraft(set, get, (d) => ({ ...d, branchesStrip: { ...d.branchesStrip, ...patch } })),

      updateFaq: (patch) =>
        patchDraft(set, get, (d) => ({
          ...d,
          faq: {
            ...d.faq,
            ...patch,
            items: patch.items !== undefined ? clampFaqItems(patch.items, d.faq.items) : d.faq.items,
          },
        })),

      updateFaqItem: (index, patch) =>
        patchDraft(set, get, (d) => {
          const items = [...d.faq.items];
          if (!items[index]) return d;
          items[index] = { ...items[index], ...patch };
          return { ...d, faq: { ...d.faq, items: clampFaqItems(items, SEED_CONTENT.faq.items) } };
        }),

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

      seed: () =>
        set({ published: SEED_CONTENT, draft: null, isPreviewMode: false, undoStack: [], redoStack: [] }),
    }),
    {
      name: 'kado-landing-content-v5',
      partialize: (state) => ({ published: state.published }),
      merge: (persisted, current) => {
        const c = current as LandingContentStore;
        const p = persisted as { published?: Partial<LandingContentState>; content?: Partial<LandingContentState> } | undefined;
        const legacy = p?.content ?? p?.published;
        return {
          ...c,
          published: stripLegacyLandingFields(
            normalizeLandingContent(legacy ? { ...c.published, ...legacy } : c.published),
          ),
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
