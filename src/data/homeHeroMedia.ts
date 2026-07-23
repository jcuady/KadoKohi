import type { CmsText } from '../lib/cmsTypography';

export type HomeMediaSource = 'KadoKohi Social' | 'InsideMarikina';

export interface HomeHeroCardMedia {
  id: string;
  src: string;
  alt: string;
  title: CmsText;
  tag: CmsText;
  source: HomeMediaSource;
}

export interface HomeHeroSlide {
  id: string;
  title: CmsText;
  subtitle: CmsText;
  /** Desktop / landscape banner (wide cream campaign art). */
  image: string;
  /** Portrait art from Heroes/Mobile — used below lg. */
  imageMobile: string;
  imageAlt: string;
  source: HomeMediaSource;
  cards: HomeHeroCardMedia[];
}

/** Figma desktop Heroes — cream full-bleed banners (product lives in the art). */
const HERO = '/heroes';
const HERO_MOBILE = '/heroes/mobile';

/** True for pre-Figma seed/CMS paths so clamp can adopt the new banners. */
export function isLegacyHeroImage(src: string | undefined): boolean {
  if (!src) return true;
  return (
    src.includes('Social Media References') ||
    src.includes('featuredmarikina') ||
    src.startsWith('/social/')
  );
}

/** Missing or non-mobile path → adopt seed portrait assets. */
export function isLegacyOrMissingMobileHero(src: string | undefined): boolean {
  if (!src) return true;
  if (isLegacyHeroImage(src)) return true;
  return !src.includes('/heroes/mobile/');
}

function bannerCards(
  slideId: string,
  image: string,
  alt: string,
  source: HomeMediaSource,
): HomeHeroCardMedia[] {
  // Collage is hidden in the public hero; CMS still expects four card slots.
  return [0, 1, 2, 3].map((i) => ({
    id: `${slideId}-card-${i + 1}`,
    src: image,
    alt,
    title: i === 0 ? 'Hero banner' : `Frame ${i + 1}`,
    tag: 'Banner',
    source,
  }));
}

export const HOME_HERO_SLIDES: HomeHeroSlide[] = [
  {
    id: 'handcrafted-espresso',
    title: 'Handcrafted With Care',
    subtitle: 'Every cup tells a story of dedicated craftsmanship and rich local heritage.',
    image: `${HERO}/espresso.webp`,
    imageMobile: `${HERO_MOBILE}/espresso.webp`,
    imageAlt: 'Kado Kohi iced espresso latte with coffee splash on cream brand banner',
    source: 'KadoKohi Social',
    cards: bannerCards(
      'handcrafted-espresso',
      `${HERO}/espresso.webp`,
      'Kado Kohi iced espresso latte with coffee splash',
      'KadoKohi Social',
    ),
  },
  {
    id: 'kado-kohi-social',
    title: 'Kado Kohi Social',
    subtitle: 'Follow our journey and stay updated with our latest community stories and offerings.',
    image: `${HERO}/social.webp`,
    imageMobile: `${HERO_MOBILE}/social.webp`,
    imageAlt: 'Kado Kohi café Polaroid collage with Live Laugh Love Coffee sticker',
    source: 'InsideMarikina',
    cards: bannerCards(
      'kado-kohi-social',
      `${HERO}/social.webp`,
      'Kado Kohi café Polaroid collage',
      'InsideMarikina',
    ),
  },
  {
    id: 'premium-matcha-rituals',
    title: 'Premium Matcha Rituals',
    subtitle: 'Carefully sourced and traditionally prepared, our matcha brings balance to your day.',
    image: `${HERO}/matcha.webp`,
    imageMobile: `${HERO_MOBILE}/matcha.webp`,
    imageAlt: 'Kado Kohi iced matcha oat lattes with matcha leaves',
    source: 'KadoKohi Social',
    cards: bannerCards(
      'premium-matcha-rituals',
      `${HERO}/matcha.webp`,
      'Kado Kohi iced matcha oat lattes',
      'KadoKohi Social',
    ),
  },
];
