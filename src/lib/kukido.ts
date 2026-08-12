/** Kukidō collab — cookies, boxes, and branding tokens. */

export const KUKIDO_BLUE = '#1B4FCC';
export const KUKIDO_BLUE_DEEP = '#143A9E';
export const KUKIDO_BLUE_SOFT = '#E8EEFF';
export const KUKIDO_PAPER = '#FFFEFA';
/** Bright cream for Kuki Singles / light product surfaces (never charcoal). */
export const KUKIDO_CREAM = '#FFF9E5';

export const KUKIDO_COOKIE_IDS = [
  'cookie_klassic',
  'cookie_campfire',
  'cookie_double_dark',
  'cookie_birthday',
  'cookie_blondie',
  'cookie_white_walnut',
] as const;

export type KukidoCookieId = (typeof KUKIDO_COOKIE_IDS)[number];

/** Local cutouts — used before remote hydrate / as ResilientImage fallback. */
export const KUKIDO_COOKIE_IMAGE: Record<KukidoCookieId, string> = {
  cookie_klassic: '/kukido/klassic.webp',
  cookie_campfire: '/kukido/campfire.webp',
  cookie_double_dark: '/kukido/double-dark.webp',
  cookie_birthday: '/kukido/birthday-bake.webp',
  cookie_blondie: '/kukido/blondie.webp',
  cookie_white_walnut: '/kukido/white-chocolate-walnut.webp',
};

export const KUKIDO_COOKIE_LABEL: Record<KukidoCookieId, string> = {
  cookie_klassic: 'klassic',
  cookie_campfire: 'campfire',
  cookie_double_dark: 'double dark',
  cookie_birthday: 'birthday bake',
  cookie_blondie: 'blondie',
  cookie_white_walnut: 'white chocolate walnut',
};

export const KUKI_SINGLE_PRICE = 100;

export type KukiBoxSize = 4 | 5 | 6 | 10;

export const KUKI_BOX_OPTIONS: ReadonlyArray<{
  size: KukiBoxSize;
  productId: string;
  price: number;
  perCookie: number;
}> = [
  { size: 4, productId: 'kuki_box_4', price: 400, perCookie: 100 },
  { size: 5, productId: 'kuki_box_5', price: 500, perCookie: 100 },
  { size: 6, productId: 'kuki_box_6', price: 540, perCookie: 90 },
  { size: 10, productId: 'kuki_box_10', price: 900, perCookie: 90 },
];

/** Local box product art (generated collab packaging on cream). */
export const KUKI_BOX_IMAGE: Record<string, string> = {
  kuki_box_4: '/kukido/kuki-box-4.webp',
  kuki_box_5: '/kukido/kuki-box-5.webp',
  kuki_box_6: '/kukido/kuki-box-6.webp',
  kuki_box_10: '/kukido/kuki-box-10.webp',
};

export const KUKI_PACK_SINGLE_ID = 'kuki_pack_single';
export const KUKI_PACK_BIG_ID = 'kuki_pack_big';
export const KUKI_PACK_SINGLE_PRICE = 10;
export const KUKI_PACK_BIG_PRICE = 25;

export function isKukidoCookieId(id: string): id is KukidoCookieId {
  return (KUKIDO_COOKIE_IDS as readonly string[]).includes(id);
}

/** Box/pack SKUs — orderable, but sold via KukiBoxBuilder (not the pastry grid). */
export function isKukiBuilderOnlyProduct(id: string): boolean {
  return id.startsWith('kuki_box_') || id.startsWith('kuki_pack_');
}

export function kukiBoxOption(size: KukiBoxSize) {
  return KUKI_BOX_OPTIONS.find((o) => o.size === size)!;
}

/** Live menu prices from admin catalog (falls back to collab defaults). */
export function resolveKukiBoxOptions(
  products: ReadonlyArray<{ id: string; basePrice: number; visible?: boolean; inStock?: boolean; name?: string }>,
): Array<{
  size: KukiBoxSize;
  productId: string;
  price: number;
  perCookie: number;
  name: string;
  orderable: boolean;
}> {
  const byId = new Map(products.map((p) => [p.id, p]));
  return KUKI_BOX_OPTIONS.map((opt) => {
    const row = byId.get(opt.productId);
    const price =
      row && Number.isFinite(row.basePrice) && row.basePrice > 0 ? Number(row.basePrice) : opt.price;
    return {
      size: opt.size,
      productId: opt.productId,
      price,
      perCookie: Math.round((price / opt.size) * 100) / 100,
      name: row?.name?.trim() || `Kuki Box - ${opt.size} pcs`,
      orderable: Boolean(row && row.visible !== false && row.inStock !== false),
    };
  });
}

export function resolveKukiPackPrices(
  products: ReadonlyArray<{ id: string; basePrice: number; visible?: boolean; inStock?: boolean }>,
): { single: number; big: number; singleOrderable: boolean; bigOrderable: boolean } {
  const byId = new Map(products.map((p) => [p.id, p]));
  const single = byId.get(KUKI_PACK_SINGLE_ID);
  const big = byId.get(KUKI_PACK_BIG_ID);
  return {
    single:
      single && Number.isFinite(single.basePrice) && single.basePrice >= 0
        ? Number(single.basePrice)
        : KUKI_PACK_SINGLE_PRICE,
    big:
      big && Number.isFinite(big.basePrice) && big.basePrice >= 0
        ? Number(big.basePrice)
        : KUKI_PACK_BIG_PRICE,
    singleOrderable: Boolean(single && single.visible !== false && single.inStock !== false),
    bigOrderable: Boolean(big && big.visible !== false && big.inStock !== false),
  };
}

export function resolveKukidoCookieImage(productId: string, remote?: string | null): string {
  if (remote?.trim()) return remote.trim();
  if (isKukidoCookieId(productId)) return KUKIDO_COOKIE_IMAGE[productId];
  return '/kukido/collab-plate.webp';
}

export function kukidoAdminBadge(productId: string): 'cookie' | 'box' | 'pack' | null {
  if (isKukidoCookieId(productId) || productId.startsWith('cookie_')) return 'cookie';
  if (productId.startsWith('kuki_box_')) return 'box';
  if (productId.startsWith('kuki_pack_')) return 'pack';
  return null;
}
