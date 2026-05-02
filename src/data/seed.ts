import type { Branch, MenuCategory, MilkOption, Product, ProductTemperature } from '../types/domain';

const now = () => new Date().toISOString();

const defaultMilks: MilkOption[] = [
  { id: 'milk_fresh', label: 'Fresh', priceDelta: 0 },
  { id: 'milk_oat', label: 'Oat', priceDelta: 50 },
  { id: 'milk_soy', label: 'Soy', priceDelta: 50 },
];

/** Espresso-based drinks that are steamed/frothed with milk — supports Fresh/Oat/Soy */
const espressoMilks: MilkOption[] = defaultMilks;

function p(
  id: string,
  categoryId: string,
  name: string,
  basePrice: number,
  temperature: ProductTemperature,
  order: number,
  opts?: { tags?: string[]; milks?: MilkOption[]; description?: string },
): Product {
  return {
    id,
    categoryId,
    branchId: null,
    name,
    description: opts?.description,
    basePrice,
    temperature,
    sizes: [],
    milks: opts?.milks ?? [],
    tags: opts?.tags,
    visible: true,
    order,
    createdAt: now(),
    updatedAt: now(),
  };
}

export const SEED_BRANCHES: Branch[] = [
  {
    id: 'branch_marikina',
    slug: 'marikina',
    name: 'Kado Kohi — Marikina',
    address: 'J.P. Laurel St. Corner Mt. Everest',
    city: 'Marikina City',
    status: 'active',
    hours: [
      { day: 'mon', open: '07:00', close: '23:00' },
      { day: 'tue', open: '07:00', close: '23:00' },
      { day: 'wed', open: '07:00', close: '23:00' },
      { day: 'thu', open: '07:00', close: '23:00' },
      { day: 'fri', open: '07:00', close: '23:00' },
      { day: 'sat', open: '07:00', close: '23:00' },
      { day: 'sun', open: '07:00', close: '23:00' },
    ],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'branch_greenhills',
    slug: 'greenhills',
    name: 'Kado Kohi — Greenhills Mall',
    address: 'Greenhills Mall (opening soon)',
    city: 'San Juan City',
    status: 'coming_soon',
    hours: [],
    createdAt: now(),
    updatedAt: now(),
  },
];

export const SEED_CATEGORIES: MenuCategory[] = [
  { id: 'cat_classics', branchId: null, name: 'Espresso Based Classics', order: 0, visible: true },
  { id: 'cat_signatures', branchId: null, name: 'Espresso Based Signatures', order: 1, visible: true },
  { id: 'cat_matcha', branchId: null, name: 'Matcha & Hojicha', order: 2, visible: true },
  { id: 'cat_yuzu', branchId: null, name: 'Yuzu Soda', order: 3, visible: true },
];

/** From `public/KADO MENU V2 FLYER.jpg` */
export const SEED_PRODUCTS: Product[] = [
  p('prod_amerikado',    'cat_classics', 'AmeriKADO',     130, 'both', 0),
  p('prod_cafe_latte',  'cat_classics', 'Cafe Latte',    160, 'both', 1, { milks: espressoMilks }),
  p('prod_cappuccino',  'cat_classics', 'Cappuccino',    160, 'both', 2, { milks: espressoMilks }),
  p('prod_flat_white',  'cat_classics', 'Flat White',    150, 'both', 3, { milks: espressoMilks }),
  p('prod_moka_latte',  'cat_classics', 'Moka Latte',    170, 'both', 4, { milks: espressoMilks }),
  p('prod_karamel_latte','cat_classics', 'Karamel Latte', 170, 'both', 5, { milks: espressoMilks }),
  p('prod_spanish_latte','cat_classics', 'Spanish Latte', 170, 'both', 6, { milks: espressoMilks }),

  p('prod_kado_latte',   'cat_signatures', 'KADO Latte',               195, 'iced', 0, { tags: ['iced-only'], milks: espressoMilks }),
  p('prod_ube_shio',     'cat_signatures', 'Ube Shio Karamel Latte',   195, 'both', 1, { milks: espressoMilks }),
  p('prod_yuzu_amerikado','cat_signatures','Yuzu AmeriKado',            195, 'iced', 2, { tags: ['iced-only'] }),
  p('prod_nori_salted',  'cat_signatures', 'Nori Salted Cream Latte',  195, 'iced', 3, { tags: ['iced-only'], milks: espressoMilks }),

  p('prod_matcha_oat', 'cat_matcha', 'Matcha Oat Latte', 170, 'both', 0, { milks: defaultMilks }),
  p('prod_dirty_matcha', 'cat_matcha', 'Dirty Matcha Oat Latte', 200, 'both', 1, { milks: defaultMilks }),
  p('prod_matcha_straw', 'cat_matcha', 'Matcha Strawberry Oat Latte', 180, 'iced', 2, { tags: ['iced-only'], milks: defaultMilks }),
  p('prod_hojicha_oat', 'cat_matcha', 'Hojicha Oat Latte', 200, 'both', 3, { milks: defaultMilks }),
  p('prod_salted_hojicha', 'cat_matcha', 'Salted Cream Hojicha Oat Latte', 210, 'iced', 4, { tags: ['iced-only'], milks: defaultMilks }),

  p('prod_yuzu_lime', 'cat_yuzu', 'Yuzu Lime Soda', 140, 'iced', 0, { tags: ['iced-only'] }),
  p('prod_yuzu_straw', 'cat_yuzu', 'Yuzu Strawberry Soda', 140, 'iced', 1, { tags: ['iced-only'] }),
];
