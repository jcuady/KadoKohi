import { KADO_GOOGLE_LISTING, KADO_GOOGLE_REVIEW_ITEMS } from './kadoGoogleReviews';
import { menuProductHref } from '../lib/menuProductLink';

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
  streetAddress: 'J.P. Laurel St. corner Mt. Everest',
  postalCode: '1807',
  fullAddress: KADO_GOOGLE_LISTING.address,
  geo: {
    latitude: 14.6291,
    longitude: 121.1045,
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
  'ceremonial matcha marikina',
  'kado kohi ceremonial matcha',
  'best matcha marikina',
  'matcha near me marikina',
  'matcha latte marikina',
  'matcha oat latte',
  'matcha oat latte marikina',
  'hojicha marikina',
  'hojicha oat latte',
  'hojicha oat latte marikina',
  'oat latte marikina',
  'oat milk latte marikina',
  'dirty matcha oat latte',
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

/** Homepage title — under 580px, no repeated words (Seobility). */
export const SEO_HOME_TITLE = 'Kado Coffee | Ceremonial Grade Matcha and Coffee';

/** Meta description — under Seobility ~1000px width limit. */
export const SEO_DEFAULT_DESCRIPTION =
  'Kado Coffee (Kado Kohi) — ceremonial grade matcha, specialty coffee, and oat lattes across Metro Manila. Order online. Rated 4.9★.';

export const SEO_HOME_H1 = 'Kado Coffee — Ceremonial Grade Matcha & Specialty Coffee';

/** Image alt / campaign line for premium matcha hero & menu SEO pillars. */
export const SEO_PREMIUM_MATCHA_MARIKINA = 'Kado Kohi — Ceremonial Grade Matcha & Specialty Coffee';

/** Signature drinks for homepage copy & schema (aligned with live menu catalog). */
export const SEO_SIGNATURE_DRINKS = [
  { name: 'KADO Latte', category: 'Signatures', productId: 'prod_kado_latte', keywords: 'signature latte marikina' },
  { name: 'Matcha Oat Latte', category: 'Matcha & Hojicha', productId: 'prod_matcha_oat', keywords: 'best matcha marikina, matcha oat latte' },
  { name: 'Dirty Matcha Oat Latte', category: 'Matcha & Hojicha', productId: 'prod_dirty_matcha', keywords: 'dirty matcha oat latte marikina' },
  { name: 'Matcha Strawberry Oat Latte', category: 'Matcha & Hojicha', productId: 'prod_matcha_straw', keywords: 'matcha strawberry oat latte' },
  { name: 'Hojicha Oat Latte', category: 'Matcha & Hojicha', productId: 'prod_hojicha_oat', keywords: 'hojicha oat latte marikina' },
  { name: 'Salted Cream Hojicha Oat Latte', category: 'Matcha & Hojicha', productId: 'prod_salted_hojicha', keywords: 'hojicha marikina' },
  { name: 'Ube Shio Karamel Latte', category: 'Signatures', productId: 'prod_ube_shio', keywords: 'ube latte marikina' },
  { name: 'Yuzu AmeriKado', category: 'Signatures', productId: 'prod_yuzu_amerikado', keywords: 'yuzu coffee marikina' },
  { name: 'Spanish Latte', category: 'Classics', productId: 'prod_spanish_latte', keywords: 'spanish latte marikina' },
  { name: 'Moka Latte', category: 'Classics', productId: 'prod_moka_latte', keywords: 'moka latte marikina' },
  { name: 'Karamel Latte', category: 'Classics', productId: 'prod_karamel_latte', keywords: 'karamel latte marikina' },
  { name: 'Yuzu Lime Soda', category: 'Yuzu', productId: 'prod_yuzu_lime', keywords: 'yuzu soda marikina' },
  { name: 'Yuzu Strawberry Soda', category: 'Yuzu', productId: 'prod_yuzu_straw', keywords: 'yuzu strawberry soda marikina' },
] as const;

export const SEO_INTERNAL_LINKS = [
  { to: '/menu', label: 'Coffee & matcha menu' },
  { to: '/branches', label: 'Location & hours' },
  { to: '/events', label: 'Events & tambayan' },
  { to: '/book/coffee-cart', label: 'Coffee cart bookings' },
  { to: '/book/matcha-bar', label: 'Matcha bar bookings' },
  { to: '/careers', label: 'Careers & collaborations' },
  { to: '/merch', label: 'Merch' },
  { to: '/about', label: 'About Kado Kohi' },
  { to: '/contact', label: 'Contact' },
  { to: '/legal/terms', label: 'Terms of service' },
  { to: '/legal/privacy', label: 'Privacy policy' },
] as const;

/** Full homepage copy for crawlers (index.html prerender + sr-only). */
export const SEO_HOME_BODY_PARAGRAPHS = [
  'Kado Coffee (Kado Kohi) is a Japanese-inspired specialty cafe serving ceremonial grade matcha and specialty coffee across Metro Manila — find us in Marikina and Greenhills, with more branches on the way. Guests searching for matcha near me, specialty coffee, or a cozy tambayan rated 4.9 stars on Google discover warm barista service and drinks crafted for everyday ritual.',
  'Our menu highlights ceremonial grade matcha and hojicha drinks crafted with quality ingredients — Matcha Oat Latte, Dirty Matcha Oat Latte, Matcha Strawberry Oat Latte, Hojicha Oat Latte, and Salted Cream Hojicha Oat Latte — popular choices for oat latte lovers who want café-quality drinks wherever they are in Metro Manila.',
  'Signature espresso drinks include the KADO Latte with torched muscovado, Ube Shio Karamel Latte, and Yuzu AmeriKado, while classic lattes such as Spanish Latte, Moka Latte, and Karamel Latte are available hot or iced with regular milk or oat milk for every kind of coffee drinker.',
  'Refreshing yuzu sodas round out the menu for guests who want something bright and citrus-forward after coffee or matcha, and our team keeps the lineup updated with seasonal specials you can follow on social media throughout the year.',
  'Visit us for dine-in, table QR ordering, takeout, or online GCash checkout during open hours, and join tambayan events and community nights listed on our events calendar whenever you want a relaxed hangout with great drinks.',
  'Book our mobile coffee booth for weddings, birthdays, and corporate functions across Metro Manila — follow @kadocoffeeph on Instagram and KadoKohi on Facebook for menu updates, branch hours, and booth availability.',
] as const;

/** Concise copy shown in the UI — keywords live in headings, cards, links, and sr-only block. */
export const SEO_HOME_BODY_VISIBLE = [
  'Japanese-inspired specialty cafe for ceremonial grade matcha, specialty coffee, and oat lattes across Metro Manila — rated 4.9 stars on Google.',
  'Dine-in, takeout, or order online. Join our events or book the mobile booth for gatherings across Metro Manila.',
] as const;

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
    title: SEO_HOME_TITLE,
    description: SEO_DEFAULT_DESCRIPTION,
    keywords: routeKeywords(
      'ceremonial grade matcha',
      'ceremonial matcha',
      'specialty coffee metro manila',
      'kado coffee matcha',
      'hojicha oat latte',
    ),
  },
  {
    path: '/menu',
    title: 'Kado Coffee Menu | Matcha, Hojicha & Oat Lattes Marikina',
    description:
      'Kado Coffee menu — Matcha Oat Latte, Hojicha Oat Latte, KADO Latte, dirty matcha, and oat lattes at Sta. Elena, Marikina (Kado Kohi). Live pricing & best sellers.',
    keywords: routeKeywords('kado coffee menu', 'matcha oat latte marikina', 'hojicha oat latte'),
  },
  {
    path: '/merch',
    title: 'Kado Coffee Merch | Kado Kohi Marikina',
    description:
      'Official Kado Coffee / Kado Kohi merch — pickup at our Marikina cafe on J.P. Laurel, Sta. Elena.',
  },
  {
    path: '/events',
    title: 'Kado Coffee Events | Marikina & Greenhills',
    description:
      'Kado Coffee events and tambayan nights in Marikina and Greenhills — pop-ups, community hangouts, and seasonal gatherings.',
    keywords: routeKeywords('kado coffee events', 'coffee events marikina', 'coffee events greenhills'),
  },
  {
    path: '/book/coffee-cart',
    title: 'Coffee Cart Booking | Kado Coffee Events Marikina',
    description:
      'Book the Kado Coffee mobile cart for weddings, parties, and corporate events in Marikina, Sta. Elena, and Metro Manila.',
    keywords: routeKeywords('book kado coffee cart', 'mobile coffee booth marikina'),
  },
  {
    path: '/book/matcha-bar',
    title: 'Matcha Bar Booking | Kado Coffee Events Marikina',
    description:
      'Book a Kado Kohi matcha bar for weddings, brand activations, and private celebrations in Marikina and Metro Manila.',
    keywords: routeKeywords('matcha bar booking marikina', 'event matcha bar'),
  },
  {
    path: '/careers',
    title: 'Careers at Kado Kohi | Kickstart Your Career in Marikina',
    description:
      'Join Kado Kohi in Marikina — barista roles, content creator partnerships, and brand collaborations at our Japanese-inspired specialty cafe tambayan.',
    keywords: routeKeywords('kado kohi careers', 'barista jobs marikina', 'coffee shop hiring marikina'),
  },
  {
    path: '/pastries',
    title: 'Kado Coffee Pastries | Fresh Bakes Marikina',
    description:
      'Daily pastries and bakes at Kado Kohi in Sta. Elena, Marikina — pair with matcha, hojicha, and specialty coffee in-store.',
  },
  {
    path: '/features',
    title: 'Kado Kohi Features | Community Runs & Events',
    description:
      'Stories from Kado Kohi — Kado Run community mornings, tambayan nights, mobile booth season, and cafe updates in Marikina.',
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
  { path: '/pastries', name: 'Pastries' },
  { path: '/events', name: 'Events' },
  { path: '/book/coffee-cart', name: 'Coffee Cart Bookings' },
  { path: '/book/matcha-bar', name: 'Matcha Bar Bookings' },
  { path: '/careers', name: 'Careers' },
  { path: '/features', name: 'Features' },
  { path: '/branches', name: 'Branches' },
  { path: '/about', name: 'About' },
  { path: '/contact', name: 'Contact' },
];

export const SEO_SITEMAP_PATHS: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/menu', changefreq: 'daily', priority: '0.9' },
  { path: '/events', changefreq: 'daily', priority: '0.9' },
  { path: '/book/coffee-cart', changefreq: 'weekly', priority: '0.85' },
  { path: '/book/matcha-bar', changefreq: 'weekly', priority: '0.85' },
  { path: '/careers', changefreq: 'weekly', priority: '0.75' },
  { path: '/merch', changefreq: 'weekly', priority: '0.8' },
  { path: '/pastries', changefreq: 'weekly', priority: '0.75' },
  { path: '/features', changefreq: 'weekly', priority: '0.75' },
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
      'Kado Coffee is on J.P. Laurel St. at the corner of Mt. Everest in Sta. Elena, Marikina City (1807, Philippines). We serve specialty coffee, matcha, and a cozy tambayan atmosphere rated 4.9 on Google.',
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
      'Signature drinks include the KADO Latte, Matcha Oat Latte, Dirty Matcha Oat Latte, Hojicha Oat Latte, Salted Cream Hojicha Oat Latte, Ube Shio Karamel Latte, Yuzu AmeriKado, and classic oat lattes. View the full menu at kadokohi.com/menu with live pricing.',
  },
  {
    question: 'Where can I get the best matcha in Marikina?',
    answer:
      'Kado Coffee (Kado Kohi) in Sta. Elena, Marikina serves premium matcha drinks including Matcha Oat Latte, Dirty Matcha Oat Latte, and Matcha Strawberry Oat Latte — plus event matcha bar experiences for weddings and activations. Popular for guests searching matcha near me in Marikina.',
  },
  {
    question: 'Does Kado Coffee serve hojicha and oat lattes?',
    answer:
      'Yes. Try our Hojicha Oat Latte and Salted Cream Hojicha Oat Latte, plus oat-milk options across espresso drinks. Order at our J.P. Laurel cafe or browse kadokohi.com/menu.',
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
  '/': {
    heading: 'Kado Coffee — ceremonial grade matcha & specialty coffee',
    paragraphs: [
      'Kado Coffee (Kado Kohi) serves ceremonial grade matcha, specialty coffee, hojicha oat lattes, and signature drinks across Metro Manila — Marikina, Greenhills, and expanding. Rated 4.9 stars on Google for guests searching matcha near me or specialty coffee.',
    ],
    links: [
      { label: 'Full menu', to: '/menu' },
      { label: 'Branches', to: '/branches' },
      { label: 'Coffee cart booking', to: '/book/coffee-cart' },
      { label: 'Matcha bar booking', to: '/book/matcha-bar' },
    ],
  },
  '/menu': {
    heading: 'Kado Coffee menu — matcha, hojicha & oat lattes in Marikina',
    paragraphs: [
      'Browse the Kado Coffee (Kado Kohi) menu for Matcha Oat Latte, Hojicha Oat Latte, Dirty Matcha Oat Latte, KADO Latte, and classic oat lattes in Sta. Elena, Marikina. Ideal for marikina coffee, best matcha marikina, or coffee near me searches.',
    ],
    links: [
      { label: 'Branches & hours', to: '/branches' },
      { label: 'Coffee cart booking', to: '/book/coffee-cart' },
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
  '/book/coffee-cart': {
    heading: 'Book Kado Coffee cart & event coffee',
    paragraphs: [
      'Hire Kado Coffee for mobile cart service at weddings, birthdays, corporate events, and parties in Marikina, Sta. Elena, and Metro Manila. Specialty event coffee with on-site baristas.',
    ],
    links: [
      { label: 'Matcha bar booking', to: '/book/matcha-bar' },
      { label: 'Contact the team', to: '/contact' },
    ],
  },
  '/book/matcha-bar': {
    heading: 'Book a Kado Kohi matcha bar',
    paragraphs: [
      'Bring a dedicated matcha bar to weddings, brand activations, and private celebrations in Marikina and Metro Manila. Submit a proposal and our events team will follow up on menu and setup.',
    ],
    links: [
      { label: 'Coffee cart booking', to: '/book/coffee-cart' },
      { label: 'Contact the team', to: '/contact' },
    ],
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
      'Kado Coffee is Marikina’s specialty coffee tambayan on J.P. Laurel, Sta. Elena — soft opening February 15, 2026. Known online as Kado Kohi, rated 4.9 on Google.',
    ],
    links: [{ label: 'Read Google reviews', href: KADO_GOOGLE_LISTING.reviewsUrl, external: true }],
  },
  '/contact': {
    heading: 'Contact Kado Coffee Marikina',
    paragraphs: [
      'Reach Kado Coffee for booth bookings, collaborations, event coffee, and general questions. Located in Sta. Elena, Marikina City — kadocoffeeph@gmail.com.',
    ],
    links: [
      { label: 'Coffee cart booking', to: '/book/coffee-cart' },
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
        urlTemplate: `${origin}/book/coffee-cart`,
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

export function menuProductSeoDescription(name: string, category?: string): string {
  const cat = category ? `${category} — ` : '';
  return `${cat}${name} at Kado Coffee (Kado Kohi), Sta. Elena, Marikina. Specialty coffee, matcha, hojicha & oat lattes. Order online or visit J.P. Laurel.`;
}

const SEO_MENU_PRIORITY = [
  'matcha',
  'hojicha',
  'oat',
  'kado',
  'ube',
  'yuzu',
  'latte',
] as const;

export function sortMenuProductsForSeo<
  T extends { name: string; sortOrder?: number; categoryId?: string; basePrice?: number; description?: string; image?: string },
>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const score = (name: string) => {
      const lower = name.toLowerCase();
      let s = 0;
      for (let i = 0; i < SEO_MENU_PRIORITY.length; i++) {
        if (lower.includes(SEO_MENU_PRIORITY[i])) s += (SEO_MENU_PRIORITY.length - i) * 10;
      }
      return s;
    };
    const diff = score(b.name) - score(a.name);
    if (diff !== 0) return diff;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export function buildHomeMenuItemListJsonLd(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Kado Coffee signature menu — matcha & oat lattes Marikina',
    itemListElement: SEO_SIGNATURE_DRINKS.map((drink, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'MenuItem',
        name: drink.name,
        description: menuProductSeoDescription(drink.name, drink.category),
        url: `${origin}${menuProductHref(drink.productId)}`,
      },
    })),
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
