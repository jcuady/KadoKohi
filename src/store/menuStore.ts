import { create } from 'zustand';
import type { MenuCategory, Product } from '../types/domain';
import {
  MENU_CATEGORIES,
  MENU_PRODUCTS,
  filterCoffeeMenu,
} from '../data/menuCatalog';
import { coffeeMenuIsEmpty } from '../lib/menuCatalogSync';
import { newId } from '../lib/id';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { supabase } from '../lib/supabase/client';
import { logAudit } from '../lib/audit';

export type MenuDataSource = 'seed' | 'remote';

export interface MenuStore {
  categories: MenuCategory[];
  products: Product[];
  remoteLoaded: boolean;
  dataSource: MenuDataSource;
  hydrateError: string | null;
  hydrateFromRemote: () => Promise<void>;
  ensureCatalogInDatabase: () => Promise<void>;
  setCategories: (c: MenuCategory[]) => void;
  setProducts: (p: Product[]) => void;
  addCategory: (name: string, order?: number) => Promise<MenuCategory>;
  updateCategory: (id: string, patch: Partial<MenuCategory>) => void;
  removeCategory: (id: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  setProductInStock: (id: string, inStock: boolean) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  productsByCategory: (categoryId: string) => Product[];
  reorderCategories: (fromIndex: number, toIndex: number) => void;
  reorderProductsInCategory: (categoryId: string, fromIndex: number, toIndex: number) => void;
  seed: () => void;
}

function applyMenuSnapshot(
  categories: MenuCategory[],
  products: Product[],
  dataSource: MenuDataSource,
  hydrateError: string | null = null,
) {
  const coffee = filterCoffeeMenu(categories, products);
  return {
    categories: coffee.categories,
    products: coffee.products,
    dataSource,
    remoteLoaded: true,
    hydrateError,
  };
}

async function loadRemoteMenu(): Promise<{ categories: MenuCategory[]; products: Product[] }> {
  return orderingRepo.fetchMenu();
}

async function bootstrapRemoteCatalog(): Promise<{ categories: MenuCategory[]; products: Product[] }> {
  let remote = await loadRemoteMenu();
  if (!coffeeMenuIsEmpty(remote.categories, remote.products)) {
    return remote;
  }

  await orderingRepo.ensureMenuCatalog();
  remote = await loadRemoteMenu();
  return remote;
}

export const useMenuStore = create<MenuStore>()((set, get) => ({
      categories: [],
      products: [],
      remoteLoaded: false,
      dataSource: 'seed',
      hydrateError: null,

      hydrateFromRemote: async () => {
        if (!supabase) {
          set(applyMenuSnapshot(MENU_CATEGORIES, MENU_PRODUCTS, 'seed', null));
          return;
        }
        try {
          const remote = await bootstrapRemoteCatalog();
          if (coffeeMenuIsEmpty(remote.categories, remote.products)) {
            set(
              applyMenuSnapshot(
                MENU_CATEGORIES,
                MENU_PRODUCTS,
                'seed',
                'Menu tables are empty in this Supabase project. Use “Initialize KADO MENU V2” or check VITE_SUPABASE_URL.',
              ),
            );
            return;
          }
          set(applyMenuSnapshot(remote.categories, remote.products, 'remote', null));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Could not load menu from Supabase.';
          const prev = get();
          // ponytail: keep last good remote snapshot — seed fallback has no uploaded images.
          if (prev.dataSource === 'remote' && prev.products.length > 0) {
            set({ hydrateError: message, remoteLoaded: true });
            return;
          }
          set(applyMenuSnapshot(MENU_CATEGORIES, MENU_PRODUCTS, 'seed', message));
        }
      },

      ensureCatalogInDatabase: async () => {
        if (!supabase) throw new Error('Supabase is not configured.');
        await orderingRepo.ensureMenuCatalog();
        await get().hydrateFromRemote();
      },

      setCategories: (categories) =>
        set({
          ...applyMenuSnapshot(categories, get().products, get().dataSource, get().hydrateError),
        }),
      setProducts: (products) =>
        set({
          ...applyMenuSnapshot(get().categories, products, get().dataSource, get().hydrateError),
        }),

      addCategory: async (name, order) => {
        const list = get().categories;
        const c: MenuCategory = {
          id: newId(),
          branchId: null,
          name,
          order: order ?? list.length,
          visible: true,
        };
        set({ categories: [...list, c], hydrateError: null });
        try {
          await orderingRepo.upsertCategory(c);
          logAudit({
            action: 'menu.category_created',
            entityType: 'menu_category',
            entityId: c.id,
            summary: `Created category ${c.name}`,
          });
          return c;
        } catch {
          set({
            categories: list,
            hydrateError: 'Could not save category to database.',
          });
          throw new Error('Could not save category to database.');
        }
      },

      updateCategory: (id, patch) => {
        const prev = get().categories.find((c) => c.id === id);
        if (!prev) return;
        const updated = { ...prev, ...patch };
        set({
          categories: get().categories.map((c) => (c.id === id ? updated : c)),
          hydrateError: null,
        });
        void orderingRepo.upsertCategory(updated).then(() => {
          logAudit({
            action: 'menu.category_updated',
            entityType: 'menu_category',
            entityId: id,
            summary: `Updated category ${updated.name}`,
            metadata: { changedKeys: Object.keys(patch) },
          });
        }).catch(() => {
          set({
            categories: get().categories.map((c) => (c.id === id ? prev : c)),
            hydrateError: 'Could not update category in database.',
          });
        });
      },

      removeCategory: (id) => {
        const prevCats = get().categories;
        const prevProds = get().products;
        set({
          categories: prevCats.filter((c) => c.id !== id),
          products: prevProds.filter((p) => p.categoryId !== id),
          hydrateError: null,
        });
        void orderingRepo.deleteCategory(id).then(() => {
          logAudit({
            action: 'menu.category_deleted',
            entityType: 'menu_category',
            entityId: id,
            summary: `Deleted category ${prevCats.find((c) => c.id === id)?.name ?? id}`,
          });
        }).catch(() => {
          set({ categories: prevCats, products: prevProds, hydrateError: 'Could not delete category.' });
        });
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
          discountType: input.discountType ?? null,
          discountValue: input.discountValue ?? null,
          image: input.image,
          temperature: input.temperature,
          sizes: input.sizes ?? [],
          milks: input.milks ?? [],
          tags: input.tags,
          customFields: input.customFields ?? [],
          visible: input.visible ?? true,
          inStock: input.inStock !== false,
          order: input.order ?? get().products.filter((x) => x.categoryId === input.categoryId).length,
          createdAt: t,
          updatedAt: t,
        };
        set({ products: [...get().products, p], hydrateError: null });
        void orderingRepo.upsertProduct(p).then(() => {
          logAudit({
            action: 'menu.product_created',
            entityType: 'menu_product',
            entityId: p.id,
            summary: `Created product ${p.name}`,
          });
        }).catch(() => {
          set({
            products: get().products.filter((row) => row.id !== p.id),
            hydrateError: 'Could not save product to database.',
          });
        });
      },

      updateProduct: (id, patch) => {
        const prev = get().products.find((p) => p.id === id);
        if (!prev) return;
        const updated = { ...prev, ...patch, updatedAt: new Date().toISOString() };
        set({
          products: get().products.map((pr) => (pr.id === id ? updated : pr)),
          hydrateError: null,
        });
        void orderingRepo.upsertProduct(updated).then(() => {
          logAudit({
            action: 'menu.product_updated',
            entityType: 'menu_product',
            entityId: id,
            summary: `Updated product ${updated.name}`,
            metadata: { changedKeys: Object.keys(patch) },
          });
        }).catch(() => {
          set({
            products: get().products.map((pr) => (pr.id === id ? prev : pr)),
            hydrateError: 'Could not update product in database.',
          });
        });
      },

      setProductInStock: async (id, inStock) => {
        const prev = get().products.find((p) => p.id === id);
        if (!prev) throw new Error('Product not found');
        const updated = { ...prev, inStock, updatedAt: new Date().toISOString() };
        set({
          products: get().products.map((pr) => (pr.id === id ? updated : pr)),
          hydrateError: null,
        });
        try {
          await orderingRepo.setProductInStock(id, inStock);
          logAudit({
            action: 'menu.stock_changed',
            entityType: 'menu_product',
            entityId: id,
            summary: `${prev.name}: ${inStock ? 'in stock' : 'out of stock'}`,
            metadata: { inStock },
          });
        } catch (err) {
          try {
            await orderingRepo.upsertProduct(updated);
          } catch {
            set({
              products: get().products.map((pr) => (pr.id === id ? prev : pr)),
              hydrateError: 'Could not update stock in database.',
            });
            throw err;
          }
        }
      },

      removeProduct: async (id) => {
        const prev = get().products;
        set({ products: prev.filter((pr) => pr.id !== id), hydrateError: null });
        try {
          await orderingRepo.deleteProduct(id);
          logAudit({
            action: 'menu.product_deleted',
            entityType: 'menu_product',
            entityId: id,
            summary: `Deleted product ${prev.find((pr) => pr.id === id)?.name ?? id}`,
          });
        } catch (err) {
          set({ products: prev, hydrateError: 'Could not delete product.' });
          throw err;
        }
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
        void Promise.all(next.map((c) => orderingRepo.upsertCategory(c))).catch(() => {
          set({ hydrateError: 'Could not save category order.' });
        });
      },

      reorderProductsInCategory: (categoryId, fromIndex, toIndex) => {
        const inCat = [...get().products.filter((p) => p.categoryId === categoryId)].sort((a, b) => a.order - b.order);
        if (fromIndex < 0 || fromIndex >= inCat.length || toIndex < 0 || toIndex >= inCat.length) return;
        const [removed] = inCat.splice(fromIndex, 1);
        inCat.splice(toIndex, 0, removed);
        const orderMap = new Map(inCat.map((p, i) => [p.id, i]));
        const t = new Date().toISOString();
        const prev = get().products;
        const next = prev.map((p) =>
          orderMap.has(p.id) ? { ...p, order: orderMap.get(p.id)!, updatedAt: t } : p,
        );
        set({ products: next });
        void Promise.all(
          next.filter((row) => orderMap.has(row.id)).map((p) => orderingRepo.upsertProduct(p)),
        ).catch(() => {
          set({ products: prev, hydrateError: 'Could not save product order.' });
        });
      },

      seed: () => set(applyMenuSnapshot(MENU_CATEGORIES, MENU_PRODUCTS, 'seed', null)),
}));
