import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '../lib/id';

export interface CartLine {
  key: string;
  productId: string;
  productNameSnapshot: string;
  qty: number;
  milkId?: string;
  milkLabelSnapshot?: string;
  temperature?: 'hot' | 'iced';
  unitPrice: number;
  lineTotal: number;
}

interface CartStore {
  items: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (input: Omit<CartLine, 'key'>) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (input) => {
        const line: CartLine = { ...input, key: newId() };
        set({ items: [...get().items, line], isOpen: true });
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
    }),
    {
      name: 'kado-cart-v1',
      // Only persist the item list; isOpen always starts false on load
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
