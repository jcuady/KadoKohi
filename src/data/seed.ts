import type { Branch, LoyaltyConfig, MenuCategory, MerchCategory, MerchProduct, MilkOption, Product, ProductTemperature } from '../types/domain';

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

// ─── Merch seed ─────────────────────────────────────────────────────────────

export const SEED_MERCH_CATEGORIES: MerchCategory[] = [
  { id: 'mcat_apparel', name: 'Apparel', order: 0, visible: true },
  { id: 'mcat_accessories', name: 'Accessories', order: 1, visible: true },
];

const sizeVariant = (id: string) => ({
  id,
  name: 'Size',
  required: true,
  options: [
    { id: `${id}_s`, label: 'S', priceDelta: 0 },
    { id: `${id}_m`, label: 'M', priceDelta: 0 },
    { id: `${id}_l`, label: 'L', priceDelta: 0 },
    { id: `${id}_xl`, label: 'XL', priceDelta: 50 },
  ],
});

export const SEED_MERCH_PRODUCTS: MerchProduct[] = [
  {
    id: 'merch_tee_classic',
    categoryId: 'mcat_apparel',
    name: 'Kado Classic Tee',
    description: 'Heavyweight cotton tee with the 角 logo on the chest.',
    basePrice: 650,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop',
    variants: [sizeVariant('sv_tee_classic')],
    tags: ['bestseller'],
    visible: true,
    order: 0,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'merch_tee_kanji',
    categoryId: 'mcat_apparel',
    name: 'Kanji Oversized Tee',
    description: 'Relaxed-fit tee with the full 角コーヒー print on the back.',
    basePrice: 750,
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=400&auto=format&fit=crop',
    variants: [sizeVariant('sv_tee_kanji')],
    tags: ['new'],
    visible: true,
    order: 1,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'merch_cap',
    categoryId: 'mcat_apparel',
    name: 'Kado Dad Cap',
    description: 'Washed cotton dad cap with embroidered 角 logo.',
    basePrice: 450,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?q=80&w=400&auto=format&fit=crop',
    variants: [{
      id: 'sv_cap_color',
      name: 'Color',
      required: true,
      options: [
        { id: 'sv_cap_black', label: 'Black', priceDelta: 0 },
        { id: 'sv_cap_cream', label: 'Cream', priceDelta: 0 },
        { id: 'sv_cap_red', label: 'Kado Red', priceDelta: 0 },
      ],
    }],
    visible: true,
    order: 2,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'merch_mug',
    categoryId: 'mcat_accessories',
    name: 'Ceramic Mug 12oz',
    description: 'Matte-finish ceramic mug with the Kado Kohi wordmark.',
    basePrice: 350,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=400&auto=format&fit=crop',
    variants: [{
      id: 'sv_mug_color',
      name: 'Color',
      required: true,
      options: [
        { id: 'sv_mug_cream', label: 'Cream', priceDelta: 0 },
        { id: 'sv_mug_black', label: 'Matte Black', priceDelta: 30 },
      ],
    }],
    visible: true,
    order: 0,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'merch_tote',
    categoryId: 'mcat_accessories',
    name: 'Canvas Tote Bag',
    description: '12oz natural canvas tote with screen-printed Kado artwork.',
    basePrice: 280,
    image: 'https://images.unsplash.com/photo-1597633425046-08f5110420b5?q=80&w=400&auto=format&fit=crop',
    variants: [],
    visible: true,
    order: 1,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'merch_stickers',
    categoryId: 'mcat_accessories',
    name: 'Sticker Pack (6pc)',
    description: 'Die-cut vinyl stickers featuring Kado Kohi characters and motifs.',
    basePrice: 120,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=400&auto=format&fit=crop',
    variants: [],
    visible: true,
    order: 2,
    createdAt: now(),
    updatedAt: now(),
  },
];

// ─── Loyalty seed ───────────────────────────────────────────────────────────

export const SEED_LOYALTY_CONFIG: LoyaltyConfig = {
  stampsPerOrder: 1,
  stampOnMerch: false,
  rewards: [
    {
      id: 'reward_free_drink',
      name: 'Free Drink',
      description: 'Redeem any drink on the menu — on us.',
      stampsRequired: 10,
      type: 'free_drink',
      active: true,
    },
    {
      id: 'reward_merch_10',
      name: '10% Off Merch',
      description: 'Get 10% off any single merch item.',
      stampsRequired: 5,
      type: 'discount_percent',
      value: 10,
      active: true,
    },
  ],
};
