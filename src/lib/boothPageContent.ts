import type { BookingShowcaseMedia } from '../types/domain';
import { clampCmsTextField, cmsTextPlain, type CmsText } from './cmsTypography';

export type { CmsText };

export interface BoothHowItWorksStep {
  title: CmsText;
  body: CmsText;
}

export interface BoothPageCopy {
  heroEyebrow: CmsText;
  heroTitleLine1: CmsText;
  heroTitleLine2: CmsText;
  heroDescription: CmsText;
  heroCtaLabel: CmsText;
  chips: [CmsText, CmsText, CmsText, CmsText];
  howItWorksEyebrow: CmsText;
  howItWorksTitle: CmsText;
  howItWorksSteps: [BoothHowItWorksStep, BoothHowItWorksStep, BoothHowItWorksStep];
  proposalTitle: CmsText;
  proposalDescription: CmsText;
  proposalCtaLabel: CmsText;
  proposalEmailNote: CmsText;
}

export interface BoothPageContent {
  copy: BoothPageCopy;
  showcase: BookingShowcaseMedia[];
}

export const DEFAULT_BOOTH_PAGE_COPY: BoothPageCopy = {
  heroEyebrow: 'Events & Celebrations',
  heroTitleLine1: 'Your Moment,',
  heroTitleLine2: 'Our Space.',
  heroDescription:
    'Host birthdays, weddings, and intimate celebrations with curated coffee and an event-ready setup. Submit a proposal — we\'ll email you back to talk through pricing.',
  heroCtaLabel: 'Submit a proposal',
  chips: ['Events & Celebrations', 'Flexible Group Sizes', 'Custom Duration', 'Talk Before You Commit'],
  howItWorksEyebrow: 'How it works',
  howItWorksTitle: 'Simple, No-Pressure Booking',
  howItWorksSteps: [
    {
      title: 'Share your event',
      body: 'Tell us the occasion, guest count, and what you have in mind — no packages to pick.',
    },
    {
      title: 'Choose an open date',
      body: 'Use the calendar to see which days are available. Unavailable dates are blocked by our team.',
    },
    {
      title: 'Submit your proposal',
      body: 'We save your request and open email so you can reach our events team to discuss pricing.',
    },
  ],
  proposalTitle: 'Submit your event proposal',
  proposalDescription:
    'Tell us about your celebration, pick an open date, then submit — we\'ll email you back to talk through pricing and setup. No packages or payments on this page.',
  proposalCtaLabel: 'Submit your proposal',
  proposalEmailNote:
    'Submitting saves your request and opens your email to our events team. We\'ll follow up to discuss pricing — nothing is confirmed until we agree together.',
};

function clampChipTuple(raw: unknown[] | undefined): [CmsText, CmsText, CmsText, CmsText] {
  const base = DEFAULT_BOOTH_PAGE_COPY.chips;
  if (!Array.isArray(raw) || raw.length < 4) return [...base];
  return [0, 1, 2, 3].map((i) => clampCmsTextField(raw[i], base[i])) as [
    CmsText,
    CmsText,
    CmsText,
    CmsText,
  ];
}

function clampHowItWorksSteps(
  raw: Partial<BoothHowItWorksStep>[] | undefined,
): [BoothHowItWorksStep, BoothHowItWorksStep, BoothHowItWorksStep] {
  const base = DEFAULT_BOOTH_PAGE_COPY.howItWorksSteps;
  if (!Array.isArray(raw) || raw.length < 3) return [...base];
  return [0, 1, 2].map((i) => ({
    title: clampCmsTextField(raw[i]?.title, base[i].title),
    body: clampCmsTextField(raw[i]?.body, base[i].body),
  })) as [BoothHowItWorksStep, BoothHowItWorksStep, BoothHowItWorksStep];
}

function clampCopyField(raw: unknown, key: keyof BoothPageCopy): CmsText {
  return clampCmsTextField(raw, DEFAULT_BOOTH_PAGE_COPY[key] as CmsText);
}

export function normalizeBoothPageCopy(raw?: Partial<BoothPageCopy>): BoothPageCopy {
  const base = DEFAULT_BOOTH_PAGE_COPY;
  if (!raw) return { ...base, chips: [...base.chips], howItWorksSteps: [...base.howItWorksSteps] };
  return {
    heroEyebrow: clampCopyField(raw.heroEyebrow, 'heroEyebrow'),
    heroTitleLine1: clampCopyField(raw.heroTitleLine1, 'heroTitleLine1'),
    heroTitleLine2: clampCopyField(raw.heroTitleLine2, 'heroTitleLine2'),
    heroDescription: clampCopyField(raw.heroDescription, 'heroDescription'),
    heroCtaLabel: clampCopyField(raw.heroCtaLabel, 'heroCtaLabel'),
    chips: clampChipTuple(raw.chips),
    howItWorksEyebrow: clampCopyField(raw.howItWorksEyebrow, 'howItWorksEyebrow'),
    howItWorksTitle: clampCopyField(raw.howItWorksTitle, 'howItWorksTitle'),
    howItWorksSteps: clampHowItWorksSteps(raw.howItWorksSteps),
    proposalTitle: clampCopyField(raw.proposalTitle, 'proposalTitle'),
    proposalDescription: clampCopyField(raw.proposalDescription, 'proposalDescription'),
    proposalCtaLabel: clampCopyField(raw.proposalCtaLabel, 'proposalCtaLabel'),
    proposalEmailNote: clampCopyField(raw.proposalEmailNote, 'proposalEmailNote'),
  };
}

export function normalizeBoothPageContent(
  raw: Partial<BoothPageContent> | null | undefined,
  fallbackShowcase: BookingShowcaseMedia[],
): BoothPageContent {
  return {
    copy: normalizeBoothPageCopy(raw?.copy),
    showcase: Array.isArray(raw?.showcase) && raw.showcase.length > 0 ? raw.showcase : fallbackShowcase,
  };
}

/** Stable React key for chip lists. */
export function boothChipKey(chip: CmsText, index: number): string {
  return `${index}-${cmsTextPlain(chip)}`;
}
