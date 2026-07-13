import { LEGAL_CONTACT_EMAIL } from '../content/customerLegal';
import {
  DEFAULT_EVENT_SIGNUP_FIELDS,
  parseFormFields,
  type EventFormField,
} from './eventForms';
import type { Branch } from '../types/domain';
import { newId } from './id';

export type CareerListingCategory = 'careers' | 'content-creators' | 'collaborations';
export type CareerApplyMode = 'form' | 'link';

export interface CareerListing {
  id: string;
  title: string;
  category: CareerListingCategory;
  branchId?: string;
  location?: string;
  employmentType?: string;
  description: string;
  applyLabel: string;
  applyHref?: string;
  applyMode: CareerApplyMode;
  visible: boolean;
  sortOrder: number;
  postedAt?: string;
}

export const CAREER_EMPLOYMENT_PRESETS = [
  'Full-time',
  'Part-time',
  'Full-time / Part-time',
  'Part-time / Full-time',
  'Part-time / Events',
  'Contract',
  'Project-based',
  'Events',
  'Partnership',
] as const;

export function defaultApplyLabelForCategory(category: CareerListingCategory): string {
  if (category === 'content-creators') return 'Submit pitch';
  if (category === 'collaborations') return 'Propose a collab';
  return 'Apply now';
}

export function branchLocationLabel(branch: Pick<Branch, 'name' | 'city'>): string {
  return [branch.name, branch.city].filter(Boolean).join(' · ');
}

export function careerListingLocationLabel(
  listing: Pick<CareerListing, 'location' | 'branchId'>,
  branches: Branch[],
): string | undefined {
  if (listing.branchId) {
    const branch = branches.find((b) => b.id === listing.branchId);
    if (branch) return branchLocationLabel(branch);
  }
  return listing.location?.trim() || undefined;
}

export function formatCareerPostedLabel(postedAt?: string): string | null {
  if (!postedAt) return null;
  const posted = new Date(postedAt).getTime();
  if (!Number.isFinite(posted)) return null;
  const days = Math.floor((Date.now() - posted) / 86_400_000);
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted 1 day ago';
  if (days < 14) return `Posted ${days} days ago`;
  return new Date(postedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Admin templates — omit id/sortOrder so new listings get fresh values. */
export type CareerListingTemplate = Omit<CareerListing, 'id' | 'sortOrder' | 'postedAt' | 'visible'> & {
  visible?: boolean;
};

export interface CareerApplicationFormConfig {
  title: string;
  intro: string;
  successTitle: string;
  successMessage: string;
  fields: EventFormField[];
}

export interface CareersPageCopy {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroBenefits: string[];
  whyJoinTitle: string;
  whyJoinBody: string;
  careersSectionTitle: string;
  careersSectionIntro: string;
  creatorsSectionTitle: string;
  creatorsSectionIntro: string;
  collabsSectionTitle: string;
  collabsSectionIntro: string;
  emptyMessage: string;
}

export interface CareersPageContent {
  copy: CareersPageCopy;
  listings: CareerListing[];
  applicationForm: CareerApplicationFormConfig;
}

export const CAREER_CATEGORY_LABELS: Record<CareerListingCategory, string> = {
  careers: 'Careers',
  'content-creators': 'Content Creators',
  collaborations: 'Collaborations',
};

function careersMailto(subject: string): string {
  return `mailto:${LEGAL_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('Hi Kado Kohi team,\n\nName:\n\nMessage:\n\nThank you.')}`;
}

export const DEFAULT_CAREER_APPLICATION_FORM: CareerApplicationFormConfig = {
  title: 'Apply to Kado Kohi',
  intro: 'Tell us about yourself — we reply to every application within a few business days.',
  successTitle: 'Application sent',
  successMessage: 'Thanks for applying. Our team will review your details and get back to you by email.',
  fields: [
    ...DEFAULT_EVENT_SIGNUP_FIELDS,
    {
      id: 'f_availability',
      type: 'select',
      label: 'Availability',
      required: true,
      options: ['Full-time', 'Part-time', 'Weekends only', 'Flexible / project-based'],
    },
    {
      id: 'f_why',
      type: 'textarea',
      label: 'Why do you want to join Kado Kohi?',
      placeholder: 'A few sentences about you, your experience, and what draws you to our corner.',
      required: true,
      helpText: 'Share relevant experience — cafe, marketing, events, delivery, or hospitality.',
    },
    {
      id: 'f_portfolio',
      type: 'text',
      label: 'Portfolio or social link',
      placeholder: 'Instagram, portfolio URL, or sample work (optional)',
      required: false,
    },
  ],
};

export const DEFAULT_CAREERS_PAGE_COPY: CareersPageCopy = {
  heroEyebrow: 'Careers at Kado Kohi',
  heroTitle: 'Build the tambayan with us',
  heroDescription:
    'We hire people who care about craft coffee, premium matcha, and warm hospitality. Grow your career in Marikina — on the bar, behind the brand, on the decks, or on the road.',
  heroBenefits: ['Hands-on training', 'Growth paths', 'Team-first culture', 'Flexible schedules'],
  whyJoinTitle: 'Why join our corner?',
  whyJoinBody:
    'Kado Kohi is a Japanese-inspired urban café built for community — morning runs, study sessions, and late-night tambayan. We invest in people who show up with curiosity, consistency, and care.',
  careersSectionTitle: 'Open roles',
  careersSectionIntro:
    'From espresso bars to marketing campaigns, weekend DJ sets to delivery runs — explore roles across our Marikina home base.',
  creatorsSectionTitle: 'Content creators',
  creatorsSectionIntro:
    'Reels, lookbooks, event coverage, and UGC that fits our mood — pitch a concept or ask about upcoming campaigns.',
  collabsSectionTitle: 'Collaborations',
  collabsSectionIntro:
    'Pop-ups, co-branded drinks, neighborhood activations, and partner booths — tell us your idea and we\'ll explore it together.',
  emptyMessage: 'No open roles match your search right now. Try clearing filters or check back soon.',
};

export const SEED_CAREER_LISTINGS: CareerListing[] = [
  {
    id: 'career_barista',
    title: 'Barista',
    category: 'careers',
    branchId: 'branch_marikina',
    location: 'Marikina · Sta. Elena',
    employmentType: 'Full-time / Part-time',
    description:
      'Pull espresso, whisk matcha, and hold space for our tambayan. Prior café experience helps; warmth and consistency matter most.',
    applyLabel: 'Apply now',
    applyMode: 'form',
    visible: true,
    sortOrder: 0,
    postedAt: '2026-01-15T08:00:00+08:00',
  },
  {
    id: 'career_marketing_manager',
    title: 'Marketing Manager',
    category: 'careers',
    branchId: 'branch_marikina',
    location: 'Marikina · Sta. Elena',
    employmentType: 'Full-time',
    description:
      'Own campaigns, social storytelling, and local partnerships. You translate brand voice into reels, events, and community moments that feel unmistakably Kado Kohi.',
    applyLabel: 'Apply now',
    applyMode: 'form',
    visible: true,
    sortOrder: 1,
    postedAt: '2026-02-01T08:00:00+08:00',
  },
  {
    id: 'career_dj',
    title: 'DJ',
    category: 'careers',
    branchId: 'branch_marikina',
    location: 'Marikina · Metro Manila',
    employmentType: 'Part-time / Events',
    description:
      'Set the mood for tambayan nights, run club pop-ups, and collaborate on seasonal playlists. Share your mixes and event experience.',
    applyLabel: 'Apply now',
    applyMode: 'form',
    visible: true,
    sortOrder: 2,
    postedAt: '2026-02-10T08:00:00+08:00',
  },
  {
    id: 'career_delivery_rider',
    title: 'Delivery Rider',
    category: 'careers',
    branchId: 'branch_marikina',
    location: 'Marikina & nearby areas',
    employmentType: 'Part-time / Full-time',
    description:
      'Deliver Kado Kohi orders safely and on time around Marikina. Valid license, reliable phone, and friendly service on every drop-off.',
    applyLabel: 'Apply now',
    applyMode: 'form',
    visible: true,
    sortOrder: 3,
    postedAt: '2026-02-18T08:00:00+08:00',
  },
  {
    id: 'career_creator',
    title: 'Creator partner — reels & events',
    category: 'content-creators',
    location: 'Metro Manila',
    employmentType: 'Project-based',
    description:
      'Cover Kado Run mornings, tambayan nights, or seasonal drink drops. Share your portfolio and rate card — we reply with campaign fit.',
    applyLabel: 'Submit pitch',
    applyMode: 'form',
    visible: true,
    sortOrder: 4,
    postedAt: '2026-03-01T08:00:00+08:00',
  },
  {
    id: 'career_collab_pop',
    title: 'Pop-up & co-brand collabs',
    category: 'collaborations',
    location: 'Marikina & Metro Manila',
    employmentType: 'Partnership',
    description:
      'Bakeries, brands, and neighborhood groups — propose a limited drink, merch drop, or weekend activation at the corner or your venue.',
    applyLabel: 'Propose a collab',
    applyMode: 'form',
    visible: true,
    sortOrder: 5,
    postedAt: '2026-03-05T08:00:00+08:00',
  },
];

export const CAREER_LISTING_TEMPLATES: CareerListingTemplate[] = SEED_CAREER_LISTINGS.map(
  ({ id: _id, sortOrder: _sort, postedAt: _posted, visible, ...rest }) => ({
    ...rest,
    visible: visible ?? true,
  }),
);

function clampCopyField(raw: unknown, fallback: string): string {
  return typeof raw === 'string' && raw.trim() ? raw : fallback;
}

function clampBenefits(raw: unknown, fallback: string[]): string[] {
  if (!Array.isArray(raw)) return fallback;
  const items = raw.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function clampApplicationForm(raw: unknown): CareerApplicationFormConfig {
  const base = DEFAULT_CAREER_APPLICATION_FORM;
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<CareerApplicationFormConfig>;
  const fields = parseFormFields(r.fields);
  return {
    title: clampCopyField(r.title, base.title),
    intro: clampCopyField(r.intro, base.intro),
    successTitle: clampCopyField(r.successTitle, base.successTitle),
    successMessage: clampCopyField(r.successMessage, base.successMessage),
    fields: fields.length > 0 ? fields : base.fields,
  };
}

function clampListing(raw: Partial<CareerListing>, fallback?: CareerListing): CareerListing {
  const base = fallback ?? {
    id: newId(),
    title: 'Untitled listing',
    category: 'careers' as const,
    description: '',
    applyLabel: 'Apply now',
    applyMode: 'form' as const,
    visible: true,
    sortOrder: 0,
  };
  const category =
    raw.category === 'content-creators' || raw.category === 'collaborations' || raw.category === 'careers'
      ? raw.category
      : base.category;
  const applyMode: CareerApplyMode = raw.applyMode === 'link' || raw.applyMode === 'form' ? raw.applyMode : base.applyMode;
  const applyHref =
    typeof raw.applyHref === 'string' && raw.applyHref.trim()
      ? raw.applyHref.trim()
      : applyMode === 'link'
        ? base.applyHref ?? careersMailto('Careers — Kado Kohi')
        : undefined;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : base.id,
    title: clampCopyField(raw.title, base.title),
    category,
    branchId: typeof raw.branchId === 'string' && raw.branchId.trim() ? raw.branchId.trim() : base.branchId,
    location: typeof raw.location === 'string' ? raw.location : base.location,
    employmentType: typeof raw.employmentType === 'string' ? raw.employmentType : base.employmentType,
    description: clampCopyField(raw.description, base.description),
    applyLabel: clampCopyField(raw.applyLabel, base.applyLabel),
    applyHref,
    applyMode,
    visible: typeof raw.visible === 'boolean' ? raw.visible : base.visible,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : base.sortOrder,
    postedAt:
      typeof raw.postedAt === 'string' && raw.postedAt.trim()
        ? raw.postedAt.trim()
        : base.postedAt ?? new Date().toISOString(),
  };
}

/** Maps legacy shift-lead id to marketing manager when hydrating old CMS data. */
function migrateLegacyListings(listings: CareerListing[]): CareerListing[] {
  return listings.map((item) => {
    if (item.id === 'career_shift_lead') {
      return {
        ...item,
        id: 'career_marketing_manager',
        title: 'Marketing Manager',
        employmentType: 'Full-time',
        description:
          'Own campaigns, social storytelling, and local partnerships. You translate brand voice into reels, events, and community moments that feel unmistakably Kado Kohi.',
        applyLabel: 'Apply now',
        applyMode: 'form' as const,
        applyHref: undefined,
      };
    }
    if (!item.applyMode) {
      return { ...item, applyMode: item.applyHref ? 'link' : 'form' };
    }
    return item;
  });
}

export function normalizeCareersPageContent(raw: Partial<CareersPageContent> | null | undefined): CareersPageContent {
  const baseCopy = DEFAULT_CAREERS_PAGE_COPY;
  const copyRaw = raw?.copy;
  const copy: CareersPageCopy = {
    heroEyebrow: clampCopyField(copyRaw?.heroEyebrow, baseCopy.heroEyebrow),
    heroTitle: clampCopyField(copyRaw?.heroTitle, baseCopy.heroTitle),
    heroDescription: clampCopyField(copyRaw?.heroDescription, baseCopy.heroDescription),
    heroBenefits: clampBenefits(copyRaw?.heroBenefits, baseCopy.heroBenefits),
    whyJoinTitle: clampCopyField(copyRaw?.whyJoinTitle, baseCopy.whyJoinTitle),
    whyJoinBody: clampCopyField(copyRaw?.whyJoinBody, baseCopy.whyJoinBody),
    careersSectionTitle: clampCopyField(copyRaw?.careersSectionTitle, baseCopy.careersSectionTitle),
    careersSectionIntro: clampCopyField(copyRaw?.careersSectionIntro, baseCopy.careersSectionIntro),
    creatorsSectionTitle: clampCopyField(copyRaw?.creatorsSectionTitle, baseCopy.creatorsSectionTitle),
    creatorsSectionIntro: clampCopyField(copyRaw?.creatorsSectionIntro, baseCopy.creatorsSectionIntro),
    collabsSectionTitle: clampCopyField(copyRaw?.collabsSectionTitle, baseCopy.collabsSectionTitle),
    collabsSectionIntro: clampCopyField(copyRaw?.collabsSectionIntro, baseCopy.collabsSectionIntro),
    emptyMessage: clampCopyField(copyRaw?.emptyMessage, baseCopy.emptyMessage),
  };

  const listingsRaw =
    Array.isArray(raw?.listings) && raw.listings.length > 0
      ? raw.listings.map((item, i) => clampListing(item, SEED_CAREER_LISTINGS[i]))
      : SEED_CAREER_LISTINGS;

  const listings = migrateLegacyListings(listingsRaw);
  const applicationForm = clampApplicationForm(raw?.applicationForm);

  return { copy, listings, applicationForm };
}
