import type { BookingShowcaseMedia } from '../types/domain';
import {
  normalizeBoothPageContent,
  normalizeBoothPageCopy,
  type BoothPageContent,
  type BoothPageCopy,
} from './boothPageContent';

export const DEFAULT_MATCHA_PAGE_COPY: BoothPageCopy = {
  heroEyebrow: 'Matcha Bar Experiences',
  heroTitleLine1: 'Premium Matcha,',
  heroTitleLine2: 'Your Event.',
  heroDescription:
    'Host a dedicated matcha bar at weddings, brand activations, and private celebrations. Submit a proposal — our events team will follow up on menu, setup, and pricing.',
  heroCtaLabel: 'Submit a proposal',
  chips: ['Premium Matcha', 'On-Site Baristas', 'Custom Guest Count', 'Talk Before You Commit'],
  howItWorksEyebrow: 'How it works',
  howItWorksTitle: 'Simple, No-Pressure Booking',
  howItWorksSteps: [
    {
      title: 'Share your event',
      body: 'Tell us the occasion, guest count, and whether you want classic matcha drinks or a curated bar menu.',
    },
    {
      title: 'Choose an open date',
      body: 'Use the calendar to see which days are available. Unavailable dates are blocked by our team.',
    },
    {
      title: 'Submit your proposal',
      body: 'We save your request and open email so you can reach our events team to discuss pricing and setup.',
    },
  ],
  proposalTitle: 'Submit your matcha bar proposal',
  proposalDescription:
    'Tell us about your event, pick an open date, then submit — we\'ll email you back to talk through matcha menu, bar setup, and pricing.',
  proposalCtaLabel: 'Submit your proposal',
  proposalEmailNote:
    'Submitting saves your request and opens your email to our events team. We\'ll follow up on matcha bar details — nothing is confirmed until we agree together.',
};

export const SEED_MATCHA_SHOWCASE_GALLERY: BookingShowcaseMedia[] = [
  {
    id: 'matcha_media_1',
    title: 'Matcha Bar Setup',
    caption: 'Premium matcha service for weddings and brand activations.',
    image: '/social/matcha-series.png',
    tags: ['matcha', 'events'],
    visible: true,
    order: 0,
  },
  {
    id: 'matcha_media_2',
    title: 'Matcha Latte Station',
    caption: 'Oat and classic matcha drinks poured on-site by Kado baristas.',
    image: '/social/matcha-latte.png',
    tags: ['matcha', 'latte'],
    visible: true,
    order: 1,
  },
  {
    id: 'matcha_media_3',
    title: 'Private Celebrations',
    caption: 'Intimate gatherings with a dedicated matcha corner.',
    image: '/booth-photos/booth-3.jpg',
    tags: ['celebration'],
    visible: true,
    order: 2,
  },
];

export function normalizeMatchaPageContent(
  raw: Partial<BoothPageContent> | null | undefined,
  fallbackShowcase: BookingShowcaseMedia[],
): BoothPageContent {
  return {
    copy: normalizeBoothPageCopy(raw?.copy, DEFAULT_MATCHA_PAGE_COPY),
    showcase: Array.isArray(raw?.showcase) && raw.showcase.length > 0 ? raw.showcase : fallbackShowcase,
  };
}
