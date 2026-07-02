/** Pastries page copy — cookies and bakes sold individually. */

export const PASTRIES_ACCENT = '#1e4d8c';

/** @deprecated use PASTRIES_ACCENT */
export const MIX_MATCH_BLUE = PASTRIES_ACCENT;

export const PASTRIES_PAGE = {
  hero: {
    eyebrow: 'Fresh from the oven',
    headlineTop: 'Kado',
    headlineBottom: 'Pastries',
    subhead: 'Cookies and seasonal bakes — order for pickup online or grab one in-store.',
    badge: 'Made in-house',
    badgeNote: 'Selection updates daily',
  },
  poster: {
    primaryImage: '/featuredmarikina/kadom1.jpg',
    secondaryImage: '/social/cafe-latte.png',
  },
  cta: {
    title: 'Our pastries',
    body: 'Browse the full list below. Add to your cart for pickup or visit us in Marikina.',
  },
} as const;
