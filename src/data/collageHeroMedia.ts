import type { CollagePolaroid, CollageSticker } from '../components/seo/CollagePageHero';

/** Shared booth / social cuts for collage heroes — swap per page for context. */
const BOOTH = {
  a: { src: '/booth-photos/booth-1.jpg', alt: 'Kado Kohi cafe corner' },
  b: { src: '/booth-photos/booth-2.jpg', alt: 'Kado Kohi event setup' },
  c: { src: '/booth-photos/booth-3.jpg', alt: 'Guests at Kado Kohi' },
  d: { src: '/booth-photos/booth-4.jpg', alt: 'Kado Kohi drinks service' },
  e: { src: '/booth-photos/booth-5.jpg', alt: 'Kado Kohi venue' },
} as const;

const SOCIAL = {
  coffee: { src: '/social/coffee-series.png', alt: 'Kado Kohi coffee drinks' },
  matcha: { src: '/social/matcha-series.png', alt: 'Kado Kohi matcha drinks' },
  latte: { src: '/social/cafe-latte.png', alt: 'Cafe latte at Kado Kohi' },
  matchaLatte: { src: '/social/matcha-latte.png', alt: 'Matcha latte at Kado Kohi' },
} as const;

/** Optimized export of `KADO Website Assets/Heroes/Hero Social.png` */
const HERO_SOCIAL = {
  src: '/events/hero-social.jpg',
  alt: 'Kado Kohi social events collage',
} as const;

const LEFT_STICKER = {
  circle: 'left-[10%] top-[6%]',
  rect: 'bottom-[16%] left-[12%]',
} as const;

/** Four shots: left pair + right pair */
function quartet(
  a: CollagePolaroid,
  b: CollagePolaroid,
  c: CollagePolaroid,
  d: CollagePolaroid,
): [CollagePolaroid, CollagePolaroid, CollagePolaroid, CollagePolaroid] {
  return [
    { rotate: -9, ...a },
    { rotate: 7, ...b },
    { rotate: 8, ...c },
    { rotate: -6, ...d },
  ];
}

function sideStickers(circle: string, rect: string): CollageSticker[] {
  return [
    { kind: 'circle', label: circle, className: LEFT_STICKER.circle },
    { kind: 'rect', label: rect, className: LEFT_STICKER.rect },
  ];
}

export const EVENTS_HERO_POLAROIDS = quartet(BOOTH.b, BOOTH.e, BOOTH.a, BOOTH.c);
export const EVENTS_HERO_STICKERS = sideStickers('Live Laugh Love Coffee', '#Events');

export const CAREERS_HERO_POLAROIDS = quartet(BOOTH.c, BOOTH.d, SOCIAL.coffee, BOOTH.a);
export const CAREERS_HERO_STICKERS = sideStickers('Join The Team', '#Hiring');

export const CONTACT_HERO_POLAROIDS = quartet(BOOTH.a, SOCIAL.latte, BOOTH.e, BOOTH.c);
export const CONTACT_HERO_STICKERS = sideStickers('Say Hello', '#ReachOut');

export const FEATURES_HERO_POLAROIDS = quartet(SOCIAL.matcha, BOOTH.b, SOCIAL.coffee, SOCIAL.matchaLatte);
export const FEATURES_HERO_STICKERS = sideStickers('Stories', '#Features');

export const BRANCHES_HERO_POLAROIDS = quartet(BOOTH.a, BOOTH.e, BOOTH.c, BOOTH.d);
export const BRANCHES_HERO_STICKERS = sideStickers('Find Us', '#Marikina');

export const COFFEE_CART_HERO_POLAROIDS = quartet(
  { ...HERO_SOCIAL, alt: 'Kado coffee cart at a social event', objectPosition: '28% 35%' },
  { ...BOOTH.b, alt: 'Kado event booth setup' },
  { ...SOCIAL.coffee, alt: 'Kado Kohi coffee series drinks' },
  { ...HERO_SOCIAL, alt: 'Guests at a Kado event booth', objectPosition: '72% 55%' },
);
export const COFFEE_CART_HERO_STICKERS = sideStickers('Book The Cart', '#CoffeeCart');

export const MATCHA_BAR_HERO_POLAROIDS = quartet(
  { ...HERO_SOCIAL, alt: 'Kado matcha bar at an event', objectPosition: '55% 28%' },
  { ...SOCIAL.matcha, alt: 'Kado Kohi matcha drinks' },
  { ...SOCIAL.matchaLatte, alt: 'Matcha latte at Kado' },
  { ...HERO_SOCIAL, alt: 'Tambayan atmosphere at Kado', objectPosition: '40% 70%' },
);
export const MATCHA_BAR_HERO_STICKERS = sideStickers('Matcha Bar', '#MatchaBar');
