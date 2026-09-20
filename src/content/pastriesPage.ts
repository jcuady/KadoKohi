/** Pastries page copy — kukidō collab chrome. */

export const PASTRIES_ACCENT = '#1B4FCC';

/** @deprecated alias — kukidō royal blue */
export const MIX_MATCH_BLUE = PASTRIES_ACCENT;

export const PASTRIES_PAGE = {
  hero: {
    eyebrow: 'kukidō × Kado Kohi',
    headlineTop: 'Cookie',
    headlineBottom: 'Menu',
    subhead: 'Handcrafted kukidō cookies at ₱100. Build a 4, 5, 6, or 10-pc Kuki Box — tap + to pick flavors. Pickup in Marikina or Greenhills.',
    badge: 'Collab bake',
    badgeNote: 'Single ₱100 · boxes from 4',
  },
  poster: {
    primaryImage: '/kukido/collab-hero.webp',
    secondaryImage: '/kukido/collab-plate.webp',
  },
  cta: {
    title: 'Daily bake',
    body: 'Browse singles below, or tap a Kuki Box size and pick flavors with +. Pickup in Marikina or Greenhills.',
  },
} as const;
