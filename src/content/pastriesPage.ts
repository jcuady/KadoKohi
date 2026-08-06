/** Pastries page copy — kukidō collab chrome. */

export const PASTRIES_ACCENT = '#1B4FCC';

/** @deprecated alias — kukidō royal blue */
export const MIX_MATCH_BLUE = PASTRIES_ACCENT;

export const PASTRIES_PAGE = {
  hero: {
    eyebrow: 'kukidō × Kado Kohi',
    headlineTop: 'Cookie',
    headlineBottom: 'Menu',
    subhead: 'Handcrafted kukidō cookies at ₱100. Build a Kuki Box from 4 pcs, or grab singles for pickup.',
    badge: 'Collab bake',
    badgeNote: 'Single ₱100 · boxes from 4',
  },
  poster: {
    primaryImage: '/kukido/collab-hero.webp',
    secondaryImage: '/kukido/collab-plate.webp',
  },
  cta: {
    title: 'Daily bake',
    body: 'Browse cookies below or build a Kuki Box. Add to cart for pickup in Marikina or Greenhills.',
  },
} as const;
