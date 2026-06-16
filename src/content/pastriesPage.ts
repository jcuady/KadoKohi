/** Pastries / Mix & Match page copy — edit here to customize promo and pairing lists. */

export const MIX_MATCH_BLUE = '#1e4d8c';

export const PASTRIES_PAGE = {
  hero: {
    eyebrow: 'Kukidō x Kado Kohi',
    headlineTop: 'Mix',
    headlineBottom: '& Match',
    subhead: 'Choose a Kado Kohi drink, a Kukidō cookie, or both — 10% off when you pair them.',
    badge: '10% off on your bundle',
    badgeNote: 'Bundle discount applied at checkout',
  },
  poster: {
    /** Local assets from Mix&Match/ — served from public/mix-match/ */
    primaryImage: '/mix-match/kukido1.jpg',
    secondaryImage: '/mix-match/kukido2.jpg',
  },
  steps: {
    drinks: {
      step: 'Step 1',
      title: 'Choose your Kado Kohi',
      footnote: 'Tag drinks with mix-match in Menu Manager to control this list.',
    },
    cookies: {
      step: 'Step 2',
      title: 'Choose your Kukidō cookie',
      footnote: 'Managed in Menu Manager → Pastries tab (Mix & Match cookie type).',
    },
  },
  mixMatchDrinkTag: 'mix-match',
  mixMatchCookieTag: 'mix-match',
  collabTag: 'collab',
  bundleDiscountPercent: 10,
  defaultDrinkNames: [
    'Kado Latte',
    'Ube Shio Karamel',
    'Nori Salted Cream',
    'Yuzu Amerikado',
    'Matcha Oat Latte',
    'Matcha Strawberry Oat Latte',
    'Hojicha Oat Latte',
  ],
  defaultCookieNames: [
    'Klassic Kuki',
    'Campfire',
    'Double Dark',
    'Birthday Bake',
    'Blondie',
    'White Chocolate Walnut',
  ],
  cta: {
    title: 'Build your bundle',
    body: 'Pick a drink, a cookie, or both — bundle discount applies when you add a pair.',
  },
} as const;

export type PastryKind = 'mix-match' | 'collab' | 'other';

export const PASTRY_KIND_OPTIONS: { value: PastryKind; label: string; hint: string }[] = [
  {
    value: 'mix-match',
    label: 'Kukidō cookie (Mix & Match)',
    hint: 'Shows in Step 2 on the pastries page and in bundle builder.',
  },
  {
    value: 'collab',
    label: 'Collab exclusive (e.g. Kukilatte)',
    hint: 'Featured takeover item — ordered individually, not in the cookie list.',
  },
  {
    value: 'other',
    label: 'Other bake',
    hint: 'General pastry — optional listing only.',
  },
];

export function tagsForPastryKind(kind: PastryKind): string[] {
  switch (kind) {
    case 'mix-match':
      return ['mix-match', 'cookie'];
    case 'collab':
      return ['collab', 'takeover', 'exclusive', 'featured'];
    case 'other':
      return [];
  }
}

export function pastryKindFromTags(tags: string[] | undefined): PastryKind {
  const lower = (tags ?? []).map((t) => t.trim().toLowerCase());
  if (lower.includes('collab') || lower.includes('kukilatte')) return 'collab';
  if (lower.includes('mix-match') || lower.includes('cookie')) return 'mix-match';
  return 'other';
}
