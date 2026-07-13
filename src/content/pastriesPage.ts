/** Pastries page copy — aligned with /menu catalog chrome (CMS-driven). */

/** @deprecated Accent blue retired from public pastries UI (brand red only). */
export const PASTRIES_ACCENT = '#9E181D';

/** @deprecated use PASTRIES_ACCENT */
export const MIX_MATCH_BLUE = PASTRIES_ACCENT;

export const PASTRIES_PAGE = {
  hero: {
    eyebrow: 'Fresh from the oven',
    headlineTop: 'Our',
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
    title: 'Daily bake',
    body: 'Browse the list below. Add to your cart for pickup or visit us in Marikina.',
  },
} as const;
