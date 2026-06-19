import { LEGAL_CONTACT_EMAIL } from '../content/customerLegal';
import { newId } from './id';

export type CareerListingCategory = 'careers' | 'content-creators' | 'collaborations';

export interface CareerListing {
  id: string;
  title: string;
  category: CareerListingCategory;
  location?: string;
  employmentType?: string;
  description: string;
  applyLabel: string;
  applyHref: string;
  visible: boolean;
  sortOrder: number;
}

export interface CareersPageCopy {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
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
}

export const CAREER_CATEGORY_LABELS: Record<CareerListingCategory, string> = {
  careers: 'Careers',
  'content-creators': 'Content Creators',
  collaborations: 'Collaborations',
};

function careersMailto(subject: string): string {
  return `mailto:${LEGAL_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('Hi Kado Kohi team,\n\nName:\n\nMessage:\n\nThank you.')}`;
}

export const DEFAULT_CAREERS_PAGE_COPY: CareersPageCopy = {
  heroEyebrow: 'Join the corner',
  heroTitle: 'Kickstart Your Career',
  heroDescription:
    'Baristas, content creators, and brand partners — grow with Kado Kohi in Marikina. We hire warm people who care about craft coffee, matcha, and community.',
  careersSectionTitle: 'Open roles',
  careersSectionIntro:
    'From barista shifts to shift-lead paths — we look for curiosity, hospitality, and a love for the tambayan energy we build every day.',
  creatorsSectionTitle: 'Content creators',
  creatorsSectionIntro:
    'Reels, lookbooks, event coverage, and UGC that fits our Japanese-inspired urban mood — pitch a concept or ask about upcoming campaigns.',
  collabsSectionTitle: 'Collaborations',
  collabsSectionIntro:
    'Pop-ups, co-branded drinks, neighborhood activations, and partner booths — tell us your idea and we\'ll explore it together.',
  emptyMessage: 'No open listings in this section right now. Follow @kadocoffeeph or email us — new roles land here first.',
};

export const SEED_CAREER_LISTINGS: CareerListing[] = [
  {
    id: 'career_barista',
    title: 'Barista',
    category: 'careers',
    location: 'Marikina · Sta. Elena',
    employmentType: 'Full-time / Part-time',
    description:
      'Pull espresso, whisk matcha, and hold space for our tambayan. Prior cafe experience helps; warmth and consistency matter most.',
    applyLabel: 'Apply via email',
    applyHref: careersMailto('Barista Application — Kado Kohi'),
    visible: true,
    sortOrder: 0,
  },
  {
    id: 'career_shift_lead',
    title: 'Shift Lead',
    category: 'careers',
    location: 'Marikina · Sta. Elena',
    employmentType: 'Full-time',
    description:
      'Support opening/closing, coach baristas on standards, and keep the floor calm during rush. Leadership experience in F&B preferred.',
    applyLabel: 'Apply via email',
    applyHref: careersMailto('Shift Lead Application — Kado Kohi'),
    visible: true,
    sortOrder: 1,
  },
  {
    id: 'career_creator',
    title: 'Creator partner — reels & events',
    category: 'content-creators',
    location: 'Metro Manila',
    employmentType: 'Project-based',
    description:
      'Cover Kado Run mornings, tambayan nights, or seasonal drink drops. Share your portfolio and rate card — we reply with campaign fit.',
    applyLabel: 'Pitch your concept',
    applyHref: careersMailto('Content Creator Collaboration — Kado Kohi'),
    visible: true,
    sortOrder: 0,
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
    applyHref: careersMailto('Collaboration Inquiry — Kado Kohi'),
    visible: true,
    sortOrder: 0,
  },
];

function clampCopyField(raw: unknown, fallback: string): string {
  return typeof raw === 'string' && raw.trim() ? raw : fallback;
}

function clampListing(raw: Partial<CareerListing>, fallback?: CareerListing): CareerListing {
  const base = fallback ?? {
    id: newId(),
    title: 'Untitled listing',
    category: 'careers' as const,
    description: '',
    applyLabel: 'Apply',
    applyHref: careersMailto('Careers — Kado Kohi'),
    visible: true,
    sortOrder: 0,
  };
  const category =
    raw.category === 'content-creators' || raw.category === 'collaborations' || raw.category === 'careers'
      ? raw.category
      : base.category;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : base.id,
    title: clampCopyField(raw.title, base.title),
    category,
    location: typeof raw.location === 'string' ? raw.location : base.location,
    employmentType: typeof raw.employmentType === 'string' ? raw.employmentType : base.employmentType,
    description: clampCopyField(raw.description, base.description),
    applyLabel: clampCopyField(raw.applyLabel, base.applyLabel),
    applyHref: clampCopyField(raw.applyHref, base.applyHref),
    visible: typeof raw.visible === 'boolean' ? raw.visible : base.visible,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : base.sortOrder,
  };
}

export function normalizeCareersPageContent(raw: Partial<CareersPageContent> | null | undefined): CareersPageContent {
  const baseCopy = DEFAULT_CAREERS_PAGE_COPY;
  const copyRaw = raw?.copy;
  const copy: CareersPageCopy = {
    heroEyebrow: clampCopyField(copyRaw?.heroEyebrow, baseCopy.heroEyebrow),
    heroTitle: clampCopyField(copyRaw?.heroTitle, baseCopy.heroTitle),
    heroDescription: clampCopyField(copyRaw?.heroDescription, baseCopy.heroDescription),
    careersSectionTitle: clampCopyField(copyRaw?.careersSectionTitle, baseCopy.careersSectionTitle),
    careersSectionIntro: clampCopyField(copyRaw?.careersSectionIntro, baseCopy.careersSectionIntro),
    creatorsSectionTitle: clampCopyField(copyRaw?.creatorsSectionTitle, baseCopy.creatorsSectionTitle),
    creatorsSectionIntro: clampCopyField(copyRaw?.creatorsSectionIntro, baseCopy.creatorsSectionIntro),
    collabsSectionTitle: clampCopyField(copyRaw?.collabsSectionTitle, baseCopy.collabsSectionTitle),
    collabsSectionIntro: clampCopyField(copyRaw?.collabsSectionIntro, baseCopy.collabsSectionIntro),
    emptyMessage: clampCopyField(copyRaw?.emptyMessage, baseCopy.emptyMessage),
  };

  const listings =
    Array.isArray(raw?.listings) && raw.listings.length > 0
      ? raw.listings.map((item, i) => clampListing(item, SEED_CAREER_LISTINGS[i]))
      : SEED_CAREER_LISTINGS;

  return { copy, listings };
}
