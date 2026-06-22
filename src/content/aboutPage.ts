/** About page copy — brand-aligned, crawlable, customer-facing. */

export const ABOUT_HERO = {
  eyebrow: 'About Kado Kohi',
  softOpeningLabel: 'Soft Opening',
  softOpeningDate: 'February 15, 2026',
  headline: 'Coffee culture at the corner.',
  tagline:
    'A Japanese-inspired urban tambayan where craft coffee, premium matcha, and Marikina community share the same ritual.',
  locationNote: 'J.P. Laurel corner Mt. Everest · Sta. Elena, Marikina City',
  heroImage: '/featuredmarikina/kadom1.jpg',
  heroImageFallback: '/social/cafe-latte.png',
  heroImageAlt: 'Kado Kohi cafe interior — warm light and bar craft in Marikina',
} as const;

export const ABOUT_PHILOSOPHY = {
  eyebrow: 'Philosophy',
  titleLine1: 'Crafted from passion.',
  titleLine2: 'Poured with purpose.',
  body:
    'Kado (角) means corner. Kohi means coffee. We built a minimalist sanctuary where Japanese restraint meets Filipino warmth — and every cup is the bridge between them.',
} as const;

export const ABOUT_SIGNATURE = {
  eyebrow: 'Signature Series',
  title: 'Gallery of pours.',
  intro: 'Three pillars of the bar — matcha craft, signature latte, and hojicha calm.',
  drinks: [
    {
      name: 'Matcha Oat Latte',
      tag: 'The Matcha',
      price: 'from ₱150',
      image: '/social/matcha-latte.png',
      to: '/menu',
    },
    {
      name: 'KADO Latte',
      tag: 'The Signature',
      price: 'from ₱150',
      image: '/social/cafe-latte.png',
      to: '/menu',
    },
    {
      name: 'Hojicha Oat',
      tag: 'The Hojicha',
      price: 'from ₱150',
      image: '/social/matcha-series.png',
      to: '/menu',
    },
  ],
} as const;

export const ABOUT_WISDOM = {
  eyebrow: 'The Corner',
  quote: 'A sip of warmth, a world of flavor.',
  body:
    'Premium without pretense — wood, concrete, warm light, and a bar you can watch craft your ritual. This is Marikina’s tambayan for early risers, creatives, and anyone who takes their cup seriously.',
  imageSrc: '/featuredmarikina/kadom2.jpg',
  imageFallback: '/social/matcha-latte.png',
  imageAlt: 'Kado Kohi bar and seating in Sta. Elena, Marikina',
} as const;

export const ABOUT_GALLERY = {
  eyebrow: 'Legacy',
  title: 'A place to feed our corner.',
  images: [
    { src: '/booth-photos/booth-1.jpg', fallback: '/social/cafe-latte.png', alt: 'Community at Kado Kohi' },
    { src: '/booth-photos/booth-2.jpg', fallback: '/social/matcha-latte.png', alt: 'Kado Kohi booth and events' },
    { src: '/booth-photos/booth-3.jpg', fallback: '/social/matcha-series.png', alt: 'Coffee craft at the bar' },
    { src: '/mix-match/kukido1.jpg', fallback: '/social/coffee-series.png', alt: 'Collaborations and seasonal specials' },
  ],
} as const;

export const ABOUT_VOICES = {
  eyebrow: 'Voices of the corner',
  title: 'What neighbors are saying.',
  intro: '4.9 stars on Google — real guests, real tambayan moments.',
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
