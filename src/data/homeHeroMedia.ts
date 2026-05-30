export type HomeMediaSource = 'KadoKohi Social' | 'InsideMarikina';

export interface HomeHeroCardMedia {
  id: string;
  src: string;
  alt: string;
  title: string;
  tag: string;
  source: HomeMediaSource;
}

export interface HomeHeroSlide {
  id: string;
  title: string;
  subtitle: string;
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
        src: `${SOCIAL}/Copy of 5.png`,
        alt: 'Kado Kohi editorial portrait',
        title: 'Matcha Editorial',
        tag: 'Portrait',
        source: 'KadoKohi Social',
      },
      {
        id: 'social-4',
        src: `${SOCIAL}/Copy of 4.png`,
        alt: 'Kado Kohi matcha visual social card',
        title: 'Matcha Visual',
        tag: 'Portrait',
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
        src: `${FEATURED}/kadom2.jpg`,
        alt: 'InsideMarikina local feature photo of Kado Kohi',
        title: 'Local Culture',
        tag: 'Feature',
        source: 'InsideMarikina',
      },
      {
        id: 'social-6',
        src: `${SOCIAL}/Copy of 6.png`,
        alt: 'Kado Kohi story artwork',
        title: 'Kado Story',
        tag: 'Square',
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
        src: `${SOCIAL}/Copy of 5.png`,
        alt: 'Kado Kohi editorial social sample',
        title: 'Editorial',
        tag: 'Portrait',
        source: 'KadoKohi Social',
      },
      {
        id: 'social-2square',
        src: `${SOCIAL}/Copy of 2 Kado Social Media Samples.png`,
        alt: 'Kado Kohi square social samples collage',
        title: 'Square Samples',
        tag: 'Square',
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
