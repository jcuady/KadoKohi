import type { BoothPageCopy } from './boothPageContent';

export type BookingPageKind = 'coffee-cart' | 'matcha-bar';

export const BOOKING_PAGE_PATHS: Record<BookingPageKind, string> = {
  'coffee-cart': '/book/coffee-cart',
  'matcha-bar': '/book/matcha-bar',
};

export const BOOKING_PAGE_LABELS: Record<BookingPageKind, string> = {
  'coffee-cart': 'Coffee Cart Bookings',
  'matcha-bar': 'Matcha Bar Bookings',
};

export const BOOKING_SERVICE_TAGS: Record<BookingPageKind, string> = {
  'coffee-cart': 'Coffee cart booking',
  'matcha-bar': 'Matcha bar booking',
};

/** Static copy for matcha bar — coffee cart uses CMS (booth showcase store). */
export const MATCHA_BAR_PAGE_COPY: BoothPageCopy = {
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

export const MATCHA_BAR_HERO_IMAGES = [
  { src: '/social/matcha-series.png', alt: 'Kado Kohi matcha bar setup' },
  { src: '/social/matcha-latte.png', alt: 'Matcha drinks at Kado Kohi events' },
  { src: '/booth-photos/booth-3.jpg', alt: 'Guests at a Kado Kohi event bar' },
] as const;
