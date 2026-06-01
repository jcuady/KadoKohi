import { create } from 'zustand';
import type { MerchCategory, MerchProduct } from '../types/domain';
import { SEED_MERCH_CATEGORIES, SEED_MERCH_PRODUCTS } from '../data/seed';
import { newId } from '../lib/id';
import { orderingRepo } from '../lib/supabase/repositories/ordering';

export interface MerchStore {
  categories: MerchCategory[];
  products: MerchProduct[];
  hydrateFromRemote: () => Promise<void>;
  setCategories: (c: MerchCategory[]) => void;
  setProducts: (p: MerchProduct[]) => void;
  addCategory: (name: string, order?: number) => void;
  updateCategory: (id: string, patch: Partial<MerchCategory>) => void;
  removeCategory: (id: string) => void;
  addProduct: (product: Omit<MerchProduct, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  updateProduct: (id: string, patch: Partial<MerchProduct>) => void;
  removeProduct: (id: string) => void;
  productsByCategory: (categoryId: string) => MerchProduct[];
  reorderCategories: (fromIndex: number, toIndex: number) => void;
  reorderProductsInCategory: (categoryId: string, fromIndex: number, toIndex: number) => void;
  seed: () => void;
}

export const useMerchStore = create<MerchStore>()((set, get) => ({
      categories: SEED_MERCH_CATEGORIES,
      products: SEED_MERCH_PRODUCTS,
      hydrateFromRemote: async () => {
        try {
          const remote = await orderingRepo.fetchMerch();
          if (remote.categories.length > 0 || remote.products.length > 0) {
            set({
              categories: remote.categories,
              products: remote.products,
            });
          }
        } catch {
          // Keep seed fallback when remote fetch fails.
        }
      },

      setCategories: (categories) => set({ categories }),
      setProducts: (products) => set({ products }),

      addCategory: (name, order) => {
        const list = get().categories;
        const c: MerchCategory = {
          id: newId(),
          name,
          order: order ?? list.length,
          visible: true,
        };
        set({ categories: [...list, c] });
        void orderingRepo.upsertMerchCategory(c);
      },

      updateCategory: (id, patch) =>
        set({
          categories: get().categories.map((c) => {
            if (c.id !== id) return c;
            const updated = { ...c, ...patch };
            void orderingRepo.upsertMerchCategory(updated);
            return updated;
          }),
        }),

      removeCategory: (id) => {
        set({
          categories: get().categories.filter((c) => c.id !== id),
          products: get().products.filter((p) => p.categoryId !== id),
        });
        void orderingRepo.deleteMerchCategory(id);
      },

      addProduct: (input) => {
        const t = new Date().toISOString();
        const p: MerchProduct = {
          id: input.id ?? newId(),
          categoryId: input.categoryId,
          name: input.name,
          description: input.description,
          basePrice: input.basePrice,
          image: input.image,
          variants: input.variants ?? [],
          tags: input.tags,
          visible: input.visible ?? true,
          order: input.order ?? get().products.filter((x) => x.categoryId === input.categoryId).length,
          createdAt: t,
          updatedAt: t,
        };
        set({ products: [...get().products, p] });
        void orderingRepo.upsertMerchProduct(p);
      },

      updateProduct: (id, patch) =>
        set({
          products: get().products.map((pr) =>
            pr.id === id
              ? (() => {
                  const updated = { ...pr, ...patch, updatedAt: new Date().toISOString() };
                  void orderingRepo.upsertMerchProduct(updated);
                  return updated;
                })()
              : pr,
          ),
        }),

      removeProduct: (id) => {
        set({ products: get().products.filter((pr) => pr.id !== id) });
        void orderingRepo.deleteMerchProduct(id);
      },

      productsByCategory: (categoryId) =>
        get()
          .products.filter((pr) => pr.categoryId === categoryId && pr.visible)
          .sort((a, b) => a.order - b.order),

      reorderCategories: (fromIndex, toIndex) => {
        const sorted = [...get().categories].sort((a, b) => a.order - b.order);
        if (fromIndex < 0 || fromIndex >= sorted.length || toIndex < 0 || toIndex >= sorted.length) return;
        const [removed] = sorted.splice(fromIndex, 1);
        sorted.splice(toIndex, 0, removed);
        set({ categories: sorted.map((c, i) => ({ ...c, order: i })) });
      },

      reorderProductsInCategory: (categoryId, fromIndex, toIndex) => {
        const inCat = [...get().products.filter((p) => p.categoryId === categoryId)].sort(
          (a, b) => a.order - b.order,
        );
        if (fromIndex < 0 || fromIndex >= inCat.length || toIndex < 0 || toIndex >= inCat.length) return;
        const [removed] = inCat.splice(fromIndex, 1);
        inCat.splice(toIndex, 0, removed);
        const orderMap = new Map(inCat.map((p, i) => [p.id, i]));
        const t = new Date().toISOString();
        set({
          products: get().products.map((p) =>
            orderMap.has(p.id) ? { ...p, order: orderMap.get(p.id)!, updatedAt: t } : p,
          ),
        });
      },

      seed: () => set({ categories: SEED_MERCH_CATEGORIES, products: SEED_MERCH_PRODUCTS }),
    }),
);
