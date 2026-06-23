import type { CmsText } from '../lib/cmsTypography';
import { SEO_CEREMONIAL_MATCHA_MARIKINA } from '../content/seo';

const CEREMONIAL_MATCHA_ALT = SEO_CEREMONIAL_MATCHA_MARIKINA;

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
  image: string;
  imageAlt: string;
  source: HomeMediaSource;
  cards: HomeHeroCardMedia[];
}

const SOCIAL = '/Social Media References';
const FEATURED = '/featuredmarikina';

export const HOME_HERO_SLIDES: HomeHeroSlide[] = [
  {
    id: 'matcha-series',
    title: 'Matcha Series',
    subtitle: 'Bold Japanese-inspired visuals, premium matcha, and modern cafe craft in every cup.',
    image: `${SOCIAL}/Copy of 3.png`,
    imageAlt: 'Kado Kohi matcha latte poster from social media campaign',
    source: 'KadoKohi Social',
    cards: [
      {
        id: 'social-10',
        src: `${SOCIAL}/Copy of 10.png`,
        alt: 'Kado Kohi story campaign',
        title: 'Story Campaign',
        tag: 'Story',
        source: 'KadoKohi Social',
      },
      {
        id: 'social-5',
        src: '/social/matcha-latte.png',
        alt: CEREMONIAL_MATCHA_ALT,
        title: 'Ceremonial Matcha',
        tag: 'Marikina',
        source: 'KadoKohi Social',
      },
      {
        id: 'social-4',
        src: '/social/matcha-series.png',
        alt: CEREMONIAL_MATCHA_ALT,
        title: 'Ceremonial Matcha',
        tag: 'Marikina',
        source: 'KadoKohi Social',
      },
      {
        id: 'social-8',
        src: `${SOCIAL}/Copy of 8.png`,
        alt: 'Kado Kohi coffee series square campaign art',
        title: 'Coffee Series',
        tag: 'Square',
        source: 'KadoKohi Social',
      },
    ],
  },
  {
    id: 'coffee-culture',
    title: 'Coffee Culture In Marikina',
    subtitle: 'Rooted in local culture, featured in community stories, and built for modern coffee rituals.',
    image: `${FEATURED}/kadom1.jpg`,
    imageAlt: 'Kado Kohi featured photo from InsideMarikina',
    source: 'InsideMarikina',
    cards: [
      {
        id: 'featured-1',
        src: `${FEATURED}/kadom1.jpg`,
        alt: 'InsideMarikina featured photo of Kado Kohi',
        title: 'Featured Marikina',
        tag: 'Community',
        source: 'InsideMarikina',
      },
      {
        id: 'featured-2',
        src: '/social/matcha-latte.png',
        alt: CEREMONIAL_MATCHA_ALT,
        title: 'Ceremonial Matcha',
        tag: 'Marikina',
        source: 'KadoKohi Social',
      },
      {
        id: 'social-6',
        src: '/social/matcha-series.png',
        alt: CEREMONIAL_MATCHA_ALT,
        title: 'Ceremonial Matcha',
        tag: 'Marikina',
        source: 'KadoKohi Social',
      },
      {
        id: 'social-2',
        src: `${SOCIAL}/Copy of 2.png`,
        alt: 'Kado Kohi cafe latte social card',
        title: 'Cafe Latte',
        tag: 'Portrait',
        source: 'KadoKohi Social',
      },
    ],
  },
  {
    id: 'campaign-grid',
    title: 'Designed For Social-First Moments',
    subtitle: 'Campaign-driven aesthetics with strong typography, elevated drink styling, and clear brand identity.',
    image: `${SOCIAL}/Copy of 9.png`,
    imageAlt: 'Kado Kohi portrait campaign board',
    source: 'KadoKohi Social',
    cards: [
      {
        id: 'social-10b',
        src: `${SOCIAL}/Copy of 10.png`,
        alt: 'Kado Kohi story format campaign visual',
        title: 'Story Campaign',
        tag: 'Story',
        source: 'KadoKohi Social',
      },
      {
        id: 'social-5b',
        src: '/social/matcha-latte.png',
        alt: CEREMONIAL_MATCHA_ALT,
        title: 'Ceremonial Matcha',
        tag: 'Marikina',
        source: 'KadoKohi Social',
      },
      {
        id: 'social-2square',
        src: '/social/matcha-series.png',
        alt: CEREMONIAL_MATCHA_ALT,
        title: 'Ceremonial Matcha',
        tag: 'Marikina',
        source: 'KadoKohi Social',
      },
      {
        id: 'social-4b',
        src: `${SOCIAL}/Copy of 4.png`,
        alt: 'Kado Kohi matcha portrait',
        title: 'Matcha Visual',
        tag: 'Portrait',
        source: 'KadoKohi Social',
      },
    ],
  },
];
