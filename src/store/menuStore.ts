import { create } from 'zustand';
import type { MenuCategory, Product } from '../types/domain';
import {
  MENU_CATEGORIES,
  MENU_PRODUCTS,
  filterCoffeeMenu,
} from '../data/menuCatalog';
import { newId } from '../lib/id';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { supabase } from '../lib/supabase/client';

export type MenuDataSource = 'seed' | 'remote';

export interface MenuStore {
  categories: MenuCategory[];
  products: Product[];
  /** True after the first remote hydrate attempt finishes. */
  remoteLoaded: boolean;
  /** `remote` when menu rows were loaded from Supabase (`kk_*` tables). */
  dataSource: MenuDataSource;
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

function applyMenuSnapshot(
  categories: MenuCategory[],
  products: Product[],
  dataSource: MenuDataSource,
) {
  const coffee = filterCoffeeMenu(categories, products);
  return {
    categories: coffee.categories,
    products: coffee.products,
    dataSource,
    remoteLoaded: true,
  };
}

export const useMenuStore = create<MenuStore>()((set, get) => ({
      categories: [],
      products: [],
      remoteLoaded: false,
      dataSource: 'seed',
      hydrateFromRemote: async () => {
        if (!supabase) {
          set(applyMenuSnapshot(MENU_CATEGORIES, MENU_PRODUCTS, 'seed'));
          return;
        }
        try {
          const remote = await orderingRepo.fetchMenu();
          set(applyMenuSnapshot(remote.categories, remote.products, 'remote'));
        } catch {
          set(applyMenuSnapshot(MENU_CATEGORIES, MENU_PRODUCTS, 'seed'));
        }
      },

      setCategories: (categories) =>
        set(applyMenuSnapshot(categories, get().products, get().dataSource)),
      setProducts: (products) =>
        set(applyMenuSnapshot(get().categories, products, get().dataSource)),

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

      removeCategory: (id) => {
        set({
          categories: get().categories.filter((c) => c.id !== id),
          products: get().products.filter((p) => p.categoryId !== id),
        });
        void orderingRepo.deleteCategory(id);
      },

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

      removeProduct: (id) => {
        set({ products: get().products.filter((pr) => pr.id !== id) });
        void orderingRepo.deleteProduct(id);
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
        const next = sorted.map((c, i) => ({ ...c, order: i }));
        set({ categories: next });
        for (const c of next) void orderingRepo.upsertCategory(c);
      },

      reorderProductsInCategory: (categoryId, fromIndex, toIndex) => {
        const inCat = [...get().products.filter((p) => p.categoryId === categoryId)].sort((a, b) => a.order - b.order);
        if (fromIndex < 0 || fromIndex >= inCat.length || toIndex < 0 || toIndex >= inCat.length) return;
        const [removed] = inCat.splice(fromIndex, 1);
        inCat.splice(toIndex, 0, removed);
        const orderMap = new Map(inCat.map((p, i) => [p.id, i]));
        const t = new Date().toISOString();
        const next = get().products.map((p) =>
          orderMap.has(p.id) ? { ...p, order: orderMap.get(p.id)!, updatedAt: t } : p,
        );
        set({ products: next });
        for (const p of next.filter((row) => orderMap.has(row.id))) void orderingRepo.upsertProduct(p);
      },

      seed: () => set(applyMenuSnapshot(MENU_CATEGORIES, MENU_PRODUCTS, 'seed')),
}));
