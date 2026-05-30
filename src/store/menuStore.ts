import { create } from 'zustand';
import type { MenuCategory, Product } from '../types/domain';
import { SEED_CATEGORIES, SEED_PRODUCTS } from '../data/seed';
import { newId } from '../lib/id';
import { orderingRepo } from '../lib/supabase/repositories/ordering';

export interface MenuStore {
  categories: MenuCategory[];
  products: Product[];
  hydrateFromRemote: () => Promise<void>;
  setCategories: (c: MenuCategory[]) => void;
  setProducts: (p: Product[]) => void;
  addCategory: (name: string, order?: number) => void;
  updateCategory: (id: string, patch: Partial<MenuCategory>) => void;
  removeCategory: (id: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  productsByCategory: (categoryId: string) => Product[];
  reorderCategories: (fromIndex: number, toIndex: number) => void;
  reorderProductsInCategory: (categoryId: string, fromIndex: number, toIndex: number) => void;
  seed: () => void;
}

export const useMenuStore = create<MenuStore>()((set, get) => ({
      categories: SEED_CATEGORIES,
      products: SEED_PRODUCTS,
      hydrateFromRemote: async () => {
        try {
          const remote = await orderingRepo.fetchMenu();
          set({
            categories: remote.categories,
            products: remote.products,
          });
        } catch {
          // Keep seed fallback when remote fetch fails.
        }
      },

      setCategories: (categories) => set({ categories }),
      setProducts: (products) => set({ products }),

      addCategory: (name, order) => {
        const t = new Date().toISOString();
        const list = get().categories;
        const c: MenuCategory = {
          id: newId(),
          branchId: null,
          name,
          order: order ?? list.length,
          visible: true,
        };
        set({ categories: [...list, c] });
        void orderingRepo.upsertCategory(c);
      },

      updateCategory: (id, patch) =>
        set({
          categories: get().categories.map((c) => {
            if (c.id !== id) return c;
            const updated = { ...c, ...patch };
            void orderingRepo.upsertCategory(updated);
            return updated;
          }),
        }),

      removeCategory: (id) =>
        set({
          categories: get().categories.filter((c) => c.id !== id),
          products: get().products.filter((p) => p.categoryId !== id),
        }),

      addProduct: (input) => {
        const t = new Date().toISOString();
        const p: Product = {
          id: input.id ?? newId(),
          categoryId: input.categoryId,
          branchId: input.branchId ?? null,
          name: input.name,
          description: input.description,
          basePrice: input.basePrice,
          image: input.image,
          temperature: input.temperature,
          sizes: input.sizes ?? [],
          milks: input.milks ?? [],
          tags: input.tags,
          customFields: input.customFields,
          visible: input.visible ?? true,
          order: input.order ?? get().products.filter((x) => x.categoryId === input.categoryId).length,
          createdAt: t,
          updatedAt: t,
        };
        set({ products: [...get().products, p] });
        void orderingRepo.upsertProduct(p);
      },

      updateProduct: (id, patch) =>
        set({
          products: get().products.map((pr) => {
            if (pr.id !== id) return pr;
            const updated = { ...pr, ...patch, updatedAt: new Date().toISOString() };
            void orderingRepo.upsertProduct(updated);
            return updated;
          }),
        }),

      removeProduct: (id) => set({ products: get().products.filter((pr) => pr.id !== id) }),

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
        const inCat = [...get().products.filter((p) => p.categoryId === categoryId)].sort((a, b) => a.order - b.order);
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

      seed: () => set({ categories: SEED_CATEGORIES, products: SEED_PRODUCTS }),
}));
