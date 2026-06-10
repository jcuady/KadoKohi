import { KADO_GOOGLE_LISTING, KADO_GOOGLE_REVIEW_ITEMS } from './kadoGoogleReviews';

/**
 * Search-first brand: guests Google "Kado Coffee" more than "Kado Kohi".
 * Site/legal name remains Kado Kohi everywhere in the UI.
 */
export const SEO_BRAND = {
  /** Primary keyword brand (Google Maps, reviews, social) */
  searchName: 'Kado Coffee',
  /** Official site / legal name */
  siteName: 'Kado Kohi',
  googleMapsName: KADO_GOOGLE_LISTING.name,
  alternateNames: [
    'Kado Coffee',
    'Kado Coffee Marikina',
    'Kado Kohi Marikina',
    'Kado Kohi Coffee Shop',
    'Kado Coffee Sta Elena',
    'Kado Coffee JP Laurel',
  ],
} as const;

/** Official social profiles — used in schema sameAs and footer/contact. */
export const SEO_SOCIAL = {
  facebook: 'https://www.facebook.com/KadoKohi',
  instagram: 'https://www.instagram.com/kadocoffeeph/?hl=en',
  tiktok: 'https://www.tiktok.com/@kadokohiph',
} as const;

export const SEO_SOCIAL_SAME_AS = [
  SEO_SOCIAL.facebook,
  SEO_SOCIAL.instagram,
  SEO_SOCIAL.tiktok,
] as const;

/** Barangays & landmarks people search with (near-me / local intent). */
export const SEO_LOCAL_AREAS = [
  'Marikina City',
  'Sta. Elena',
  'Sta Elena',
  'Santo Niño Marikina',
  'Parang Marikina',
  'Concepcion Marikina',
  'J.P. Laurel Marikina',
  'Mt. Everest Street Marikina',
  'Metro Manila',
  'Eastern Metro Manila',
] as const;

export const SEO_LOCATION = {
  locality: 'Marikina City',
  neighborhood: 'Sta. Elena',
  region: 'Metro Manila',
  country: 'PH',
  streetAddress: 'J.P. Laurel St., Corner Mt. Everest',
  postalCode: '1801',
  fullAddress: KADO_GOOGLE_LISTING.address,
  geo: {
    latitude: 14.6502,
    longitude: 121.1024,
  },
} as const;

/** High-intent local & branded queries (meta + schema; natural use in copy). */
export const SEO_KEYWORDS = [
  'kado coffee',
  'kado kohi',
  'kado kohi marikina',
  'kado coffee marikina',
  'best coffee in marikina',
  'best coffee marikina',
  'best cafe marikina',
  'marikina coffee',
  'marikina city coffee',
  'coffee shop marikina',
  'coffee shop near me',
  'coffee near me',
  'coffee near me marikina',
  'marikina coffee near me',
  'cafe near me marikina',
  'cafe marikina',
  'specialty coffee marikina',
  'specialty cafe marikina',
  'sta elena coffee',
  'sta elena marikina coffee',
  'coffee sta elena marikina',
  'coffee shop sta elena',
  'jp laurel coffee marikina',
  'jp laurel coffee shop',
  'mt everest coffee marikina',
  'tambayan coffee marikina',
  'tambayan coffee',
  'hangout cafe marikina',
  'event coffee marikina',
  'event coffee',
  'booth coffee',
  'mobile coffee booth marikina',
  'coffee catering marikina',
  'wedding coffee booth philippines',
  'corporate coffee catering',
  'matcha marikina',
  'matcha latte marikina',
  'kado latte',
  'kado coffee menu',
  'kado coffee location',
  'kado coffee hours',
  'kado coffee sta elena',
  'kado coffee reviews',
  'arabica coffee marikina',
  'order coffee online marikina',
  'gcash coffee order',
  'kado circle',
  'coffee place marikina',
  'third wave coffee marikina',
  'mairkina coffee',
] as const;

/** Comma-separated meta keywords (capped for HTML meta length). */
export const SEO_META_KEYWORDS = SEO_KEYWORDS.slice(0, 40).join(', ');

export const SEO_DEFAULT_DESCRIPTION =
  'Kado Coffee (Kado Kohi) — specialty cafe on J.P. Laurel, Sta. Elena, Marikina. One of the top-rated coffee shops near you (4.9★ on Google). Order online, events, booth coffee.';

export type SeoRouteMeta = {
  path: string;
  title: string;
  description: string;
  keywords?: string[];
};

function routeKeywords(...extra: string[]): string[] {
  return [...new Set([...SEO_KEYWORDS, ...extra])];
}

export const SEO_PUBLIC_ROUTES: SeoRouteMeta[] = [
  {
    path: '/',
    title: 'Kado Coffee | Best Coffee in Marikina | Coffee Near Me',
    description: SEO_DEFAULT_DESCRIPTION,
    keywords: routeKeywords(),
  },
  {
    path: '/menu',
    title: 'Kado Coffee Menu | Best Coffee in Marikina',
    description:
      'Kado Coffee menu — signature lattes, matcha, and specialty drinks at our Sta. Elena, Marikina cafe (Kado Kohi). Best coffee picks updated from the live menu.',
    keywords: routeKeywords('kado coffee menu', 'marikina coffee menu'),
  },
  {
    path: '/merch',
    title: 'Kado Coffee Merch | Kado Kohi Marikina',
    description:
      'Official Kado Coffee / Kado Kohi merch — pickup at our Marikina cafe on J.P. Laurel, Sta. Elena.',
  },
  {
    path: '/events',
    title: 'Kado Coffee Events | Tambayan Marikina',
    description:
      'Kado Coffee events and tambayan nights in Marikina — pop-ups, community hangouts, and seasonal gatherings near Sta. Elena.',
    keywords: routeKeywords('kado coffee events', 'coffee events marikina'),
  },
  {
    path: '/book/booth',
    title: 'Kado Coffee Booth Booking | Event Coffee Marikina',
    description:
      'Book Kado Coffee mobile booth and event coffee for weddings, parties, and corporate events in Marikina, Sta. Elena, and Metro Manila.',
    keywords: routeKeywords('book kado coffee booth'),
  },
  {
    path: '/branches',
    title: 'Kado Coffee Location | Marikina Coffee Near Me',
    description:
      'Find Kado Coffee (Kado Kohi) — J.P. Laurel corner Mt. Everest, Sta. Elena, Marikina City. Directions, hours, and coffee near me in Marikina.',
    keywords: routeKeywords('kado coffee address', 'coffee shop near sta elena'),
  },
  {
    path: '/about',
    title: 'About Kado Coffee | Specialty Cafe Marikina',
    description:
      'The story of Kado Coffee — Marikina’s specialty coffee tambayan in Sta. Elena. Quality beans, warm hospitality, and community (Kado Kohi).',
  },
  {
    path: '/contact',
    title: 'Contact Kado Coffee | Marikina Events & Collabs',
    description:
      'Contact Kado Coffee / Kado Kohi for booth bookings, collaborations, and inquiries — Sta. Elena, Marikina City.',
  },
  {
    path: '/legal/terms',
    title: 'Terms of Service | Kado Kohi',
    description:
      'Terms for Kado Kohi customer accounts, online ordering, GCash payment, Kado Circle loyalty, and events.',
  },
  {
    path: '/legal/privacy',
    title: 'Privacy Policy | Kado Kohi',
    description:
      'How Kado Kohi collects and protects your personal information when you order, earn stamps, or book with us.',
  },
];

export const SEO_BREADCRUMBS: Array<{ path: string; name: string }> = [
  { path: '/', name: 'Home' },
  { path: '/menu', name: 'Coffee Menu' },
  { path: '/merch', name: 'Merch' },
  { path: '/events', name: 'Events' },
  { path: '/book/booth', name: 'Booth Booking' },
  { path: '/branches', name: 'Branches' },
  { path: '/about', name: 'About' },
  { path: '/contact', name: 'Contact' },
];

export const SEO_SITEMAP_PATHS: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/menu', changefreq: 'daily', priority: '0.9' },
  { path: '/events', changefreq: 'daily', priority: '0.9' },
  { path: '/book/booth', changefreq: 'weekly', priority: '0.85' },
  { path: '/merch', changefreq: 'weekly', priority: '0.8' },
  { path: '/branches', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/legal/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/legal/privacy', changefreq: 'yearly', priority: '0.3' },
];

export const SEO_FAQ = [
  {
    question: 'What is Kado Coffee? Is it the same as Kado Kohi?',
    answer:
      'Yes. Kado Coffee is how most guests find us on Google Maps and social media. Kado Kohi is our official cafe name — the same specialty coffee shop on J.P. Laurel, Sta. Elena, Marikina City.',
  },
  {
    question: 'Where is the best coffee in Marikina?',
    answer:
      'Kado Coffee is on J.P. Laurel St. at the corner of Mt. Everest in Sta. Elena, Marikina City (1801 Metro Manila). We serve specialty coffee, matcha, and a cozy tambayan atmosphere rated 4.9 on Google.',
  },
  {
    question: 'Is there good coffee near me in Marikina or Sta. Elena?',
    answer:
      'If you are in Marikina, Sta. Elena, or nearby barangays, Kado Coffee is a walkable specialty cafe on J.P. Laurel. Search “coffee near me” or “marikina coffee near me” on Google Maps for directions to Kado Coffee (Kado Kohi).',
  },
  {
    question: 'Where can I get Sta. Elena coffee or a cafe in Sta Elena Marikina?',
    answer:
      'Kado Coffee serves Sta. Elena and greater Marikina from our corner on J.P. Laurel and Mt. Everest — signature lattes, matcha, and food in a small specialty coffee shop setting.',
  },
  {
    question: 'Can I book Kado Coffee for event coffee or a mobile booth?',
    answer:
      'Yes. Book event coffee and our mobile booth for weddings, parties, and corporate gatherings in Marikina and Metro Manila through the booth booking page on kadokohi.com.',
  },
  {
    question: 'Does Kado Coffee host events or tambayan nights?',
    answer:
      'We host community events, tambayan nights, and pop-ups. Follow @kadocoffeeph on Instagram, @kadokohiph on TikTok, or KadoKohi on Facebook for updates, or check the Events page.',
  },
  {
    question: 'What are Kado Coffee social media accounts?',
    answer:
      'Facebook: facebook.com/KadoKohi — Instagram: instagram.com/kadocoffeeph — TikTok: tiktok.com/@kadokohiph. Email: kadocoffeeph@gmail.com.',
  },
  {
    question: 'What is on the Kado Coffee menu?',
    answer:
      'Signature drinks include the Kado Latte, matcha series, specialty lattes, and seasonal items. View the full Kado Coffee menu online at kadokohi.com/menu with live pricing.',
  },
  {
    question: 'Can I order Kado Coffee online in Marikina?',
    answer:
      'Yes. Order from the website with GCash QR checkout during open hours, or visit us on J.P. Laurel, Sta. Elena for walk-in and table QR ordering.',
  },
  {
    question: 'Is Kado Coffee good for studying or tambayan hangouts?',
    answer:
      'Guests love our cozy specialty coffee shop vibe — a popular tambayan in Marikina for coffee, conversation, and community events.',
  },
] as const;

export type PageSeoBlurbContent = {
  heading: string;
  paragraphs: string[];
  links?: Array<{ label: string; to?: string; href?: string; external?: boolean }>;
};

const PAGE_SEO_BLURBS: Record<string, PageSeoBlurbContent> = {
  '/menu': {
    heading: 'Kado Coffee menu — specialty drinks in Marikina',
    paragraphs: [
      'Browse the Kado Coffee (Kado Kohi) menu for signature lattes, matcha, and best-selling specialty coffee in Marikina. Ideal for guests searching marikina coffee, sta elena coffee, or coffee near me.',
    ],
    links: [
      { label: 'Branches & hours', to: '/branches' },
      { label: 'Book event coffee booth', to: '/book/booth' },
    ],
  },
  '/events': {
    heading: 'Kado Coffee events & tambayan nights',
    paragraphs: [
      'Kado Coffee hosts community events, tambayan nights, and pop-ups in Marikina City near Sta. Elena — your go-to for event coffee culture and local hangouts.',
    ],
    links: [
      { label: 'Follow on Instagram', href: SEO_SOCIAL.instagram, external: true },
      { label: 'Contact for collabs', to: '/contact' },
    ],
  },
  '/book/booth': {
    heading: 'Book Kado Coffee booth & event coffee',
    paragraphs: [
      'Hire Kado Coffee for mobile booth coffee at weddings, birthdays, corporate events, and parties in Marikina, Sta. Elena, and Metro Manila. Specialty event coffee with on-site baristas.',
    ],
    links: [{ label: 'Contact the team', to: '/contact' }],
  },
  '/branches': {
    heading: 'Kado Coffee location — Marikina coffee near me',
    paragraphs: [
      'Find Kado Coffee (Kado Kohi) at J.P. Laurel corner Mt. Everest, Sta. Elena, Marikina City. Directions for marikina coffee near me, sta elena coffee shop, and best coffee in Marikina searches.',
    ],
    links: [
      { label: 'Google Maps', href: KADO_GOOGLE_LISTING.mapsUrl, external: true },
      { label: 'View menu', to: '/menu' },
    ],
  },
  '/about': {
    heading: 'About Kado Coffee & Kado Kohi',
    paragraphs: [
      'Kado Coffee is Marikina’s specialty coffee tambayan — quality Arabica, matcha, and hospitality on J.P. Laurel. Known online as Kado Kohi, rated 4.9 on Google.',
    ],
    links: [{ label: 'Read Google reviews', href: KADO_GOOGLE_LISTING.reviewsUrl, external: true }],
  },
  '/contact': {
    heading: 'Contact Kado Coffee Marikina',
    paragraphs: [
      'Reach Kado Coffee for booth bookings, collaborations, event coffee, and general questions. Located in Sta. Elena, Marikina City — kadocoffeeph@gmail.com.',
    ],
    links: [
      { label: 'Book a booth', to: '/book/booth' },
      { label: 'Facebook', href: SEO_SOCIAL.facebook, external: true },
    ],
  },
  '/merch': {
    heading: 'Kado Coffee merch — Marikina pickup',
    paragraphs: [
      'Shop official Kado Coffee / Kado Kohi merch with branch pickup in Marikina. Pair your visit with the best coffee in Marikina at our Sta. Elena cafe.',
    ],
    links: [{ label: 'Visit the cafe', to: '/branches' }],
  },
};

export function getPageSeoBlurb(pathname: string): PageSeoBlurbContent | null {
  return PAGE_SEO_BLURBS[pathname] ?? null;
}

export function buildSeoSameAs(origin: string): string[] {
  const listing = KADO_GOOGLE_LISTING;
  return [...SEO_SOCIAL_SAME_AS, listing.mapsUrl, listing.shareUrl, origin];
}

export function buildLocalBusinessJsonLd(origin: string) {
  const listing = KADO_GOOGLE_LISTING;
  return {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    '@id': `${origin}/#cafe`,
    name: SEO_BRAND.searchName,
    alternateName: [SEO_BRAND.siteName, ...SEO_BRAND.alternateNames],
    description: SEO_DEFAULT_DESCRIPTION,
    url: origin,
    image: `${origin}/logo/Logo1.png`,
    telephone: '+63-920-948-2934',
    email: 'kadocoffeeph@gmail.com',
    priceRange: '₱₱',
    servesCuisine: ['Coffee', 'Specialty Coffee', 'Matcha', 'Cafe'],
    keywords: SEO_KEYWORDS.join(', '),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '07:00',
        closes: '23:00',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: SEO_LOCATION.streetAddress,
      addressLocality: SEO_LOCATION.locality,
      addressRegion: SEO_LOCATION.region,
      postalCode: SEO_LOCATION.postalCode,
      addressCountry: SEO_LOCATION.country,
    },
    containedInPlace: {
      '@type': 'Place',
      name: SEO_LOCATION.neighborhood,
      containedInPlace: {
        '@type': 'City',
        name: SEO_LOCATION.locality,
      },
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SEO_LOCATION.geo.latitude,
      longitude: SEO_LOCATION.geo.longitude,
    },
    areaServed: SEO_LOCAL_AREAS.map((name) => ({
      '@type': 'Place',
      name,
    })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(listing.rating),
      reviewCount: String(listing.reviewCount),
      bestRating: '5',
      worstRating: '1',
    },
    review: KADO_GOOGLE_REVIEW_ITEMS.slice(0, 5).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.name },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: String(r.rating),
        bestRating: '5',
      },
      reviewBody: r.content,
    })),
    sameAs: buildSeoSameAs(origin),
    hasMap: listing.mapsUrl,
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin}/book/booth`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      name: 'Book Kado Coffee event booth',
    },
  };
}

export function buildOrganizationJsonLd(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: SEO_BRAND.searchName,
    alternateName: SEO_BRAND.siteName,
    url: origin,
    logo: `${origin}/logo/Logo1.png`,
    email: 'kadocoffeeph@gmail.com',
    sameAs: buildSeoSameAs(origin),
  };
}

export function buildWebSiteJsonLd(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    name: SEO_BRAND.searchName,
    alternateName: SEO_BRAND.siteName,
    url: origin,
    description: SEO_DEFAULT_DESCRIPTION,
    publisher: { '@id': `${origin}/#organization` },
    inLanguage: 'en-PH',
  };
}

export function buildFaqPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SEO_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
