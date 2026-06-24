import { create } from 'zustand';
import type { MerchCategory, MerchProduct } from '../types/domain';
import { SEED_MERCH_CATEGORIES, SEED_MERCH_PRODUCTS } from '../data/seed';
import { newId } from '../lib/id';
import { orderingRepo } from '../lib/supabase/repositories/ordering';

export interface MerchStore {
  categories: MerchCategory[];
  products: MerchProduct[];
  remoteLoaded: boolean;
  hydrateFromRemote: () => Promise<void>;
  setCategories: (c: MerchCategory[]) => void;
  setProducts: (p: MerchProduct[]) => void;
  addCategory: (name: string, order?: number) => Promise<void>;
  updateCategory: (id: string, patch: Partial<MerchCategory>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  addProduct: (product: Omit<MerchProduct, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  updateProduct: (id: string, patch: Partial<MerchProduct>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  productsByCategory: (categoryId: string) => MerchProduct[];
  reorderCategories: (fromIndex: number, toIndex: number) => void;
  reorderProductsInCategory: (categoryId: string, fromIndex: number, toIndex: number) => void;
  seed: () => void;
}

export const useMerchStore = create<MerchStore>()((set, get) => ({
      categories: [],
      products: [],
      remoteLoaded: false,
      hydrateFromRemote: async () => {
        try {
          const remote = await orderingRepo.fetchMerch();
          set({
            categories: remote.categories,
            products: remote.products,
            remoteLoaded: true,
          });
        } catch {
          set({ categories: [], products: [], remoteLoaded: true });
        }
      },

      setCategories: (categories) => set({ categories }),
      setProducts: (products) => set({ products }),

      addCategory: async (name, order) => {
        const list = get().categories;
        const c: MerchCategory = {
          id: newId(),
          name,
          order: order ?? list.length,
          visible: true,
        };
        await orderingRepo.upsertMerchCategory(c);
        set({ categories: [...list, c] });
      },

      updateCategory: async (id, patch) => {
        const existing = get().categories.find((c) => c.id === id);
        if (!existing) return;
        const updated = { ...existing, ...patch };
        await orderingRepo.upsertMerchCategory(updated);
        set({
          categories: get().categories.map((c) => (c.id === id ? updated : c)),
        });
      },

      removeCategory: async (id) => {
        await orderingRepo.deleteMerchCategory(id);
        set({
          categories: get().categories.filter((c) => c.id !== id),
          products: get().products.filter((p) => p.categoryId !== id),
        });
      },

      addProduct: async (input) => {
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
        await orderingRepo.upsertMerchProduct(p);
        set({ products: [...get().products, p] });
      },

      updateProduct: async (id, patch) => {
        const existing = get().products.find((pr) => pr.id === id);
        if (!existing) return;
        const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
        await orderingRepo.upsertMerchProduct(updated);
        set({
          products: get().products.map((pr) => (pr.id === id ? updated : pr)),
        });
      },

      removeProduct: async (id) => {
        await orderingRepo.deleteMerchProduct(id);
        set({ products: get().products.filter((pr) => pr.id !== id) });
      },

      productsByCategory: (categoryId) =>
        get()
          .products.filter((pr) => pr.categoryId === categoryId && pr.visible)
          .sort((a, b) => a.order - b.order),

      reorderCategories: async (fromIndex, toIndex) => {
        const sorted = [...get().categories].sort((a, b) => a.order - b.order);
        if (fromIndex < 0 || fromIndex >= sorted.length || toIndex < 0 || toIndex >= sorted.length) return;
        const [removed] = sorted.splice(fromIndex, 1);
        sorted.splice(toIndex, 0, removed);
        const updated = sorted.map((c, i) => ({ ...c, order: i }));
        for (const c of updated) {
          await orderingRepo.upsertMerchCategory(c);
        }
        set({ categories: updated });
      },

      reorderProductsInCategory: async (categoryId, fromIndex, toIndex) => {
        const inCat = [...get().products.filter((p) => p.categoryId === categoryId)].sort(
          (a, b) => a.order - b.order,
        );
        if (fromIndex < 0 || fromIndex >= inCat.length || toIndex < 0 || toIndex >= inCat.length) return;
        const [removed] = inCat.splice(fromIndex, 1);
        inCat.splice(toIndex, 0, removed);
        const orderMap = new Map(inCat.map((p, i) => [p.id, i]));
        const t = new Date().toISOString();
        const products = get().products.map((p) =>
          orderMap.has(p.id) ? { ...p, order: orderMap.get(p.id)!, updatedAt: t } : p,
        );
        set({ products });
        for (const p of inCat) {
          const row = products.find((x) => x.id === p.id);
          if (row) await orderingRepo.upsertMerchProduct(row);
        }
      },

      seed: () => set({ categories: SEED_MERCH_CATEGORIES, products: SEED_MERCH_PRODUCTS }),
    }),
);
