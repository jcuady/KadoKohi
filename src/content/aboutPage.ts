/** About page copy — replace placeholders when final brand story is approved. */

export const ABOUT_HERO = {
  eyebrow: 'About Kado Kohi',
  softOpeningLabel: 'Soft Opening',
  softOpeningDate: 'February 15, 2026',
  tagline: 'A Japanese-inspired urban tambayan — where craft coffee and community share the same corner.',
  locationNote: 'J.P. Laurel corner Mt. Everest · Sta. Elena, Marikina City',
} as const;

export const ABOUT_ORIGINS = {
  eyebrow: 'Origins',
  title: 'Born at the corner.',
  lead:
    'Kado (角) means corner. Kohi (コーヒー) means coffee. Together they describe a place — not just a shop, but a daily ritual anchored in Marikina.',
  paragraphs: [
    '[Placeholder — Founder story: what sparked the idea for Kado Kohi, and why Marikina’s Sta. Elena corner felt like home.]',
    '[Placeholder — Early days: pop-ups, cupping sessions, and the community feedback that shaped the menu and the space.]',
  ],
  imageAlt: 'Kado Kohi cafe interior — placeholder until final photography is approved',
  imageSrc: '/featuredmarikina/kadom1.jpg',
  imageFallback: '/social/cafe-latte.png',
} as const;

export const ABOUT_COMMITMENT = {
  eyebrow: 'Our Commitment',
  title: 'What we promise every guest.',
  intro:
    'Quality, warmth, and consistency — the three threads we never compromise on, from the first pour to the last conversation at the bar.',
  pillars: [
    {
      title: 'Craft in every cup',
      body: '[Placeholder — Sourcing standards, roast partners, and how we train baristas for consistency.]',
    },
    {
      title: 'Hospitality that feels human',
      body: '[Placeholder — Tambayan culture: welcoming regulars, creatives, and first-time visitors the same way.]',
    },
    {
      title: 'A corner that belongs to Marikina',
      body: '[Placeholder — Local partnerships, events, and how we show up for the neighborhood.]',
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
      date: '[Placeholder]',
      title: 'Grand opening',
      body: '[Placeholder — Full launch date, programming, and opening-week celebrations.]',
    },
  ],
} as const;

export const ABOUT_SPACE = {
  eyebrow: 'The Space',
  title: 'Your corner awaits.',
  body: '[Placeholder — Describe the interior: seating, bar flow, natural light, and what makes the space feel like a tambayan.]',
  imageAlt: 'Kado Kohi bar and seating — placeholder',
  imageSrc: '/featuredmarikina/kadom2.jpg',
  imageFallback: '/social/matcha-latte.png',
} as const;

export const ABOUT_CTA = {
  title: 'Find your corner.',
  body: 'Visit us on J.P. Laurel or follow along as we grow into the full Kado Kohi experience.',
  primaryLabel: 'Visit the shop',
  primaryTo: '/contact',
  secondaryLabel: 'View branches',
  secondaryTo: '/branches',
} as const;
