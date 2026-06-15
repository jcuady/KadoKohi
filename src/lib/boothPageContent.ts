import type { BookingShowcaseMedia } from '../types/domain';

export interface BoothHowItWorksStep {
  title: string;
  body: string;
}

export interface BoothPageCopy {
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroDescription: string;
  heroCtaLabel: string;
  chips: [string, string, string, string];
  howItWorksEyebrow: string;
  howItWorksTitle: string;
  howItWorksSteps: [BoothHowItWorksStep, BoothHowItWorksStep, BoothHowItWorksStep];
  proposalTitle: string;
  proposalDescription: string;
  proposalCtaLabel: string;
  proposalEmailNote: string;
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

function clampChipTuple(raw: string[] | undefined): [string, string, string, string] {
  const base = DEFAULT_BOOTH_PAGE_COPY.chips;
  if (!Array.isArray(raw) || raw.length < 4) return [...base];
  return [raw[0] ?? base[0], raw[1] ?? base[1], raw[2] ?? base[2], raw[3] ?? base[3]];
}

function clampHowItWorksSteps(
  raw: BoothHowItWorksStep[] | undefined,
): [BoothHowItWorksStep, BoothHowItWorksStep, BoothHowItWorksStep] {
  const base = DEFAULT_BOOTH_PAGE_COPY.howItWorksSteps;
  if (!Array.isArray(raw) || raw.length < 3) return [...base];
  return [0, 1, 2].map((i) => ({
    title: raw[i]?.title?.trim() || base[i].title,
    body: raw[i]?.body?.trim() || base[i].body,
  })) as [BoothHowItWorksStep, BoothHowItWorksStep, BoothHowItWorksStep];
}

export function normalizeBoothPageCopy(raw?: Partial<BoothPageCopy>): BoothPageCopy {
  const base = DEFAULT_BOOTH_PAGE_COPY;
  if (!raw) return { ...base, chips: [...base.chips], howItWorksSteps: [...base.howItWorksSteps] };
  return {
    heroEyebrow: raw.heroEyebrow?.trim() || base.heroEyebrow,
    heroTitleLine1: raw.heroTitleLine1?.trim() || base.heroTitleLine1,
    heroTitleLine2: raw.heroTitleLine2?.trim() || base.heroTitleLine2,
    heroDescription: raw.heroDescription?.trim() || base.heroDescription,
    heroCtaLabel: raw.heroCtaLabel?.trim() || base.heroCtaLabel,
    chips: clampChipTuple(raw.chips),
    howItWorksEyebrow: raw.howItWorksEyebrow?.trim() || base.howItWorksEyebrow,
    howItWorksTitle: raw.howItWorksTitle?.trim() || base.howItWorksTitle,
    howItWorksSteps: clampHowItWorksSteps(raw.howItWorksSteps),
    proposalTitle: raw.proposalTitle?.trim() || base.proposalTitle,
    proposalDescription: raw.proposalDescription?.trim() || base.proposalDescription,
    proposalCtaLabel: raw.proposalCtaLabel?.trim() || base.proposalCtaLabel,
    proposalEmailNote: raw.proposalEmailNote?.trim() || base.proposalEmailNote,
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
