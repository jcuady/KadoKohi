import { KADO_GOOGLE_LISTING } from './kadoGoogleReviews';

/** Public brand: site uses Kado Kohi; Google Maps lists Kado Coffee. */
export const SEO_BRAND = {
  primary: 'Kado Kohi',
  googleMapsName: KADO_GOOGLE_LISTING.name,
  alternateNames: [
    'Kado Coffee',
    'Kado Kohi Marikina',
    'Kado Coffee Marikina',
    'Kado Kohi Coffee Shop',
  ],
} as const;

export const SEO_LOCATION = {
  locality: 'Marikina City',
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

/** Target queries — woven into titles, copy, and schema (not stuffed). */
export const SEO_KEYWORDS = [
  'best coffee in marikina',
  'kado coffee',
  'kado kohi',
  'specialty coffee marikina',
  'coffee shop marikina',
  'tambayan coffee marikina',
  'event coffee',
  'booth coffee',
  'mobile coffee booth',
  'coffee catering marikina',
  'cafe marikina city',
  'matcha marikina',
] as const;

export const SEO_DEFAULT_DESCRIPTION =
  'Kado Coffee (Kado Kohi) — specialty coffee, tambayan vibes, and events in Marikina City. Rated 4.9 on Google. Order online, book our booth for parties, and join Kado Circle.';

export type SeoRouteMeta = {
  path: string;
  title: string;
  description: string;
  keywords?: string[];
};

export const SEO_PUBLIC_ROUTES: SeoRouteMeta[] = [
  {
    path: '/',
    title: 'Kado Coffee | Best Coffee in Marikina — Kado Kohi',
    description: SEO_DEFAULT_DESCRIPTION,
    keywords: [...SEO_KEYWORDS],
  },
  {
    path: '/menu',
    title: 'Coffee Menu | Best Coffee in Marikina — Kado Kohi',
    description:
      'Explore Kado Coffee’s specialty menu — signature lattes, matcha, and tambayan favorites crafted fresh at Kado Kohi in Marikina City.',
    keywords: ['coffee menu marikina', 'kado latte', 'specialty coffee menu', 'kado coffee'],
  },
  {
    path: '/merch',
    title: 'Merch & Shop | Kado Kohi Marikina',
    description:
      'Official Kado Kohi merch — pickup at our Marikina cafe. Take the Kado Coffee brand home.',
  },
  {
    path: '/events',
    title: 'Events & Tambayan Nights | Kado Coffee Marikina',
    description:
      'Upcoming Kado Kohi events — community nights, pop-ups, and tambayan coffee gatherings in Marikina. See what’s on and sign up.',
    keywords: ['event coffee marikina', 'coffee events', 'tambayan coffee', 'kado kohi events'],
  },
  {
    path: '/book/booth',
    title: 'Booth & Event Coffee Booking | Kado Kohi',
    description:
      'Book Kado Coffee’s mobile booth for weddings, parties, and corporate events in Marikina and Metro Manila. Specialty event coffee, on-site baristas, online estimate.',
    keywords: ['booth coffee', 'event coffee catering', 'mobile coffee booth', 'coffee booth rental'],
  },
  {
    path: '/branches',
    title: 'Branches & Location | Kado Coffee Marikina',
    description:
      'Find Kado Kohi (Kado Coffee) on J.P. Laurel, Marikina City — hours, directions, and branch details for your next coffee run.',
    keywords: ['kado coffee location', 'coffee shop marikina address', 'kado kohi branches'],
  },
  {
    path: '/about',
    title: 'About Kado Coffee & Kado Kohi | Marikina',
    description:
      'The story behind Kado Kohi — Marikina’s specialty coffee tambayan built on quality beans, warm hospitality, and community.',
  },
  {
    path: '/contact',
    title: 'Contact Kado Coffee | Collaborations & Events',
    description:
      'Reach Kado Kohi for collaborations, booth bookings, event coffee, and general inquiries in Marikina City.',
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
    question: 'Is Kado Kohi the same as Kado Coffee on Google Maps?',
    answer:
      'Yes. Guests often find us as Kado Coffee on Google Maps and reviews; our brand name is Kado Kohi — the same specialty coffee shop in Marikina City.',
  },
  {
    question: 'Where is the best coffee in Marikina?',
    answer:
      'Kado Kohi is on J.P. Laurel St. at the corner of Mt. Everest, Marikina City (1801 Metro Manila). We serve specialty coffee and matcha with a cozy tambayan atmosphere.',
  },
  {
    question: 'Can I book Kado for event coffee or a mobile booth?',
    answer:
      'Yes. Use our booth booking page to request event coffee service for parties, weddings, and corporate gatherings in Marikina and nearby areas.',
  },
  {
    question: 'Does Kado Kohi host community events?',
    answer:
      'We run tambayan nights, pop-ups, and seasonal events. Check the Events page for upcoming dates and online sign-up.',
  },
] as const;

export function buildLocalBusinessJsonLd(origin: string) {
  const listing = KADO_GOOGLE_LISTING;
  return {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    '@id': `${origin}/#cafe`,
    name: SEO_BRAND.primary,
    alternateName: SEO_BRAND.alternateNames,
    description: SEO_DEFAULT_DESCRIPTION,
    url: origin,
    image: `${origin}/logo/Logo1.png`,
    telephone: '+63-920-948-2934',
    priceRange: '₱₱',
    servesCuisine: ['Coffee', 'Specialty Coffee', 'Matcha', 'Cafe'],
    keywords: SEO_KEYWORDS.join(', '),
    address: {
      '@type': 'PostalAddress',
      streetAddress: SEO_LOCATION.streetAddress,
      addressLocality: SEO_LOCATION.locality,
      addressRegion: SEO_LOCATION.region,
      postalCode: SEO_LOCATION.postalCode,
      addressCountry: SEO_LOCATION.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SEO_LOCATION.geo.latitude,
      longitude: SEO_LOCATION.geo.longitude,
    },
    areaServed: {
      '@type': 'City',
      name: 'Marikina City',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(listing.rating),
      reviewCount: String(listing.reviewCount),
      bestRating: '5',
      worstRating: '1',
    },
    sameAs: [listing.mapsUrl, listing.shareUrl, origin],
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
      name: 'Book event coffee booth',
    },
  };
}

export function buildWebSiteJsonLd(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    name: SEO_BRAND.primary,
    alternateName: SEO_BRAND.googleMapsName,
    url: origin,
    description: SEO_DEFAULT_DESCRIPTION,
    publisher: { '@id': `${origin}/#cafe` },
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
