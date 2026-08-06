import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '../lib/id';

export interface CartLineVariant {
  groupName: string;
  optionId: string;
  optionLabel: string;
  priceDelta: number;
  /** Cookie count inside a Kuki Box flavor row. */
  qty?: number;
}

export interface CartLine {
  key: string;
  itemType: 'coffee' | 'merch' | 'mix-match';
  productId: string;
  productNameSnapshot: string;
  mixMatchCookieId?: string;
  qty: number;
  milkId?: string;
  milkLabelSnapshot?: string;
  sizeId?: string;
  sizeLabelSnapshot?: string;
  temperature?: 'hot' | 'iced';
  selectedVariants?: CartLineVariant[];
  unitPrice: number;
  lineTotal: number;
  image?: string;
}

/** Same catalog config → one line with summed qty (avoids redundant 1× rows). */
export function cartLineMergeKey(line: Omit<CartLine, 'key' | 'qty' | 'lineTotal' | 'image'>): string {
  const variants = (line.selectedVariants ?? [])
    .map((v) => `${v.groupName}:${v.optionId}:${v.optionLabel}:${v.priceDelta}`)
    .sort()
    .join('|');
  return [
    line.itemType,
    line.productId,
    line.mixMatchCookieId ?? '',
    line.milkId ?? '',
    line.sizeId ?? '',
    line.temperature ?? '',
    variants,
    String(line.unitPrice),
  ].join('::');
}

interface CartStore {
  items: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (input: Omit<CartLine, 'key'>, options?: { openCart?: boolean }) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clear: () => void;
  coffeeItems: () => CartLine[];
  merchItems: () => CartLine[];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (input, options) => {
        const openCart = options?.openCart ?? true;
        const identity = cartLineMergeKey(input);
        const existing = get().items.find((i) => cartLineMergeKey(i) === identity);
        if (existing) {
          const qty = existing.qty + input.qty;
          set({
            items: get().items.map((i) =>
              i.key === existing.key
                ? { ...i, qty, lineTotal: i.unitPrice * qty, image: i.image ?? input.image }
                : i,
            ),
            ...(openCart ? { isOpen: true } : {}),
          });
          return;
        }
        const line: CartLine = { ...input, key: newId() };
        set({
          items: [...get().items, line],
          ...(openCart ? { isOpen: true } : {}),
        });
      },

      removeItem: (key) => set({ items: get().items.filter((i) => i.key !== key) }),

      updateQty: (key, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.key !== key) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.key === key ? { ...i, qty, lineTotal: i.unitPrice * qty } : i,
          ),
        });
      },

      clear: () => set({ items: [] }),
      coffeeItems: () => get().items.filter((i) => i.itemType === 'coffee'),
      merchItems: () => get().items.filter((i) => i.itemType === 'merch'),
    }),
    {
      name: 'kado-cart-v2',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
