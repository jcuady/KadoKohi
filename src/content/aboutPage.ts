/** About page copy — brand-aligned, crawlable, customer-facing. */

export const ABOUT_HERO = {
  eyebrow: 'About Kado Kohi',
  softOpeningLabel: 'Soft Opening',
  softOpeningDate: 'February 15, 2026',
  headline: 'Born at the corner.',
  tagline:
    'A Japanese-inspired urban tambayan where craft coffee, premium matcha, and Marikina community share the same ritual.',
  locationNote: 'J.P. Laurel corner Mt. Everest · Sta. Elena, Marikina City',
  heroImageSrc: '/featuredmarikina/kadom2.jpg',
  heroImageFallback: '/social/matcha-latte.png',
  heroImageAlt: 'Matcha and craft coffee at Kado Kohi Marikina',
} as const;

/** Hatton-style editorial headlines — accent words use kado-red on dark / cream panels.
 *  Hero lines on /about are CMS-driven (`landingContentStore.aboutPage`); defaults mirror seed below. */
export const ABOUT_EDITORIAL = {
  heroLines: [
    [
      { text: 'Rooted in ', accent: false },
      { text: 'Matcha', accent: true },
    ],
    [
      { text: 'Reshaping ', accent: false },
      { text: 'Ritual', accent: true },
    ],
  ] as const,
  aboutLines: [
    [{ text: 'About', accent: false }],
    [{ text: 'Kado Kohi', accent: true }],
  ] as const,
  craftLines: [
    [{ text: 'Crafting the', accent: false }],
    [{ text: 'Unconventional', accent: true }],
  ] as const,
  futureParts: [
    { text: 'Crafting the future of ', accent: false },
    { text: 'coffee', accent: true },
    { text: ' by blending ', accent: false },
    { text: 'tradition', accent: true },
    { text: ' and ', accent: false },
    { text: 'innovation', accent: true },
    { text: '.', accent: false },
  ] as const,
  commitmentLines: [
    [{ text: 'Our', accent: false }],
    [{ text: 'Commitment', accent: true }],
  ] as const,
  philosophyLines: [
    [{ text: 'How we', accent: false }],
    [{ text: 'Show Up', accent: true }],
  ] as const,
  journeyLines: [
    [{ text: 'Evolution of a', accent: false }],
    [{ text: 'Tambayan', accent: true }],
  ] as const,
  marqueeWords: ['Craft', 'Tambayan', 'Matcha', 'Marikina', 'Kohi', 'Community', 'Ritual', 'Corner'] as const,
  processLabel: 'From concept to craftsmanship',
  discoverCta: { label: 'Discover our menu', to: '/menu' },
} as const;

export const ABOUT_STATS = [
  { value: '4.9★', label: 'Google rating', detail: 'Local favorite in Sta. Elena' },
  { value: '角', label: 'Kado means corner', detail: 'A place anchored in the neighborhood' },
  { value: '2026', label: 'Soft opening', detail: 'Feb 15 — doors open to neighbors' },
  { value: 'Matcha', label: 'Signature series', detail: 'Oat lattes & hojicha craft' },
] as const;

export const ABOUT_ORIGINS = {
  eyebrow: 'Origins',
  title: 'Where corner meets craft.',
  lead:
    'Kado (角) means corner. Kohi (コーヒー) means coffee. Together they name a daily ritual — not just a shop, but Marikina’s living room for creatives, early risers, and anyone who treats a great cup seriously.',
  paragraphs: [
    'Kado Kohi began as a vision for a minimalist sanctuary: Japanese restraint, Filipino warmth, and coffee culture you can feel in every pour. Sta. Elena’s J.P. Laurel corner felt right — walkable, creative, and rooted in local life.',
    'Before the doors opened, months of cupping, menu testing, and community feedback shaped what you taste today — from signature matcha oat lattes to pastries that belong beside the bar.',
  ],
  imageAlt: 'Kado Kohi cafe interior in Marikina — warm wood, concrete, and bar craft',
  imageSrc: '/featuredmarikina/kadom1.jpg',
  imageFallback: '/social/cafe-latte.png',
} as const;

export const ABOUT_COMMITMENT = {
  eyebrow: 'Our Commitment',
  title: 'What we promise every guest.',
  intro:
    'Quality, warmth, and consistency — three threads we never compromise on, from the first pour to the last conversation at the bar.',
  pillars: [
    {
      title: 'Craft in every cup',
      body:
        'Thoughtful sourcing, calibrated recipes, and bar training built for repeatability — so your matcha oat latte tastes the same on rush hour and on a quiet Tuesday.',
    },
    {
      title: 'Hospitality that feels human',
      body:
        'Tambayan culture means everyone belongs: regulars, first-timers, remote workers, and friends meeting after class. Coffee is the excuse; connection is the product.',
    },
    {
      title: 'A corner that belongs to Marikina',
      body:
        'We show up for the neighborhood — local features, booth bookings, collaborations, and a space designed for the people who made Sta. Elena feel like home.',
    },
  ],
} as const;

export const ABOUT_VALUES = {
  eyebrow: 'Philosophy',
  title: 'How we show up daily.',
  intro: 'The standards behind every roast, every pour, and every shift on the bar.',
  items: [
    {
      title: 'Uncompromised quality',
      body: 'From farm selection to pour temperature — we control the variables that define a great cup.',
    },
    {
      title: 'Community first',
      body: 'Kado Kohi is Marikina’s living room — a gathering place for creatives, dreamers, and early risers.',
    },
    {
      title: 'Radical empathy',
      body: 'Coffee is the bridge. Genuine warmth and hospitality are the product we’re proudest of.',
    },
    {
      title: 'Constant refinement',
      body: 'We treat every service like day one. Mastery is a practice, not a finish line.',
    },
  ],
} as const;

export const ABOUT_TIMELINE = {
  eyebrow: 'The Journey',
  title: 'Evolution of a tambayan.',
  milestones: [
    {
      date: '2024',
      title: 'The concept',
      body: 'The vision takes shape — a minimalist sanctuary blending Japanese aesthetics with Filipino warmth.',
    },
    {
      date: '2025',
      title: 'The sourcing',
      body: 'Months of cupping and profiling to define signature coffee, matcha, and pastry pairings.',
    },
    {
      date: 'Jan 2026',
      title: 'The buildout',
      body: 'Our permanent corner on J.P. Laurel begins construction — wood, concrete, and warm light.',
    },
    {
      date: 'Feb 15, 2026',
      title: 'Soft opening',
      body: 'Doors open to friends, neighbors, and early supporters. Limited menu · extended hours coming soon.',
      highlight: true,
    },
    {
      date: '2026',
      title: 'Grand chapter ahead',
      body: 'Full menu rollout, extended hours, and programming that keeps the corner alive — follow us for opening-week news.',
    },
  ],
} as const;

export const ABOUT_SPACE = {
  eyebrow: 'The Space',
  title: 'Your corner awaits.',
  body:
    'Warm ambient light, wood and concrete textures, and a bar built for craft visibility. Whether you’re staying for a meeting, a matcha moment, or a pastry pause, the layout flows like a true tambayan — open, grounded, and premium without pretense.',
  imageAlt: 'Kado Kohi bar and seating in Marikina',
  imageSrc: '/featuredmarikina/kadom2.jpg',
  imageFallback: '/social/matcha-latte.png',
  secondaryImageSrc: '/booth-photos/booth-1.jpg',
  secondaryImageFallback: '/social/matcha-series.png',
  secondaryImageAlt: 'Guests and community at Kado Kohi',
} as const;

export const ABOUT_EXPERIENCE = {
  eyebrow: 'Explore',
  title: 'More than a cup.',
  items: [
    {
      title: 'Signature menu',
      body: 'Matcha oat lattes, hojicha, KADO Latte, and seasonal specials — order in-store or browse online.',
      to: '/menu',
      label: 'View menu',
    },
    {
      title: 'Events & collabs',
      body: 'Pop-ups, booth bookings, and community moments — see what’s brewing at the corner.',
      to: '/events',
      label: 'See events',
    },
    {
      title: 'Merch & gifts',
      body: 'Take a piece of Kado home — official merch with branch pickup in Marikina.',
      to: '/merch',
      label: 'Shop merch',
    },
  ],
} as const;

export const ABOUT_CTA = {
  title: 'Find your corner.',
  body: 'Visit us on J.P. Laurel or follow along as we grow into the full Kado Kohi experience.',
  primaryLabel: 'Visit the shop',
  primaryTo: '/contact',
  secondaryLabel: 'View branches',
  secondaryTo: '/branches',
} as const;
