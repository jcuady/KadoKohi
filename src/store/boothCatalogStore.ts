import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoothAddon, BoothPackage } from '../types/domain';
import { SEED_BOOTH_ADDONS, SEED_BOOTH_PACKAGES } from '../data/seed';
import { newId } from '../lib/id';

export interface BoothCatalogStore {
  packages: BoothPackage[];
  addons: BoothAddon[];
  addPackage: (input: Omit<BoothPackage, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  updatePackage: (id: string, patch: Partial<BoothPackage>) => void;
  removePackage: (id: string) => void;
  reorderPackages: (fromIndex: number, toIndex: number) => void;
  addAddon: (input: Omit<BoothAddon, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  updateAddon: (id: string, patch: Partial<BoothAddon>) => void;
  removeAddon: (id: string) => void;
  reorderAddons: (fromIndex: number, toIndex: number) => void;
  visiblePackages: () => BoothPackage[];
  visibleAddons: () => BoothAddon[];
  visiblePackagesForBranch: (branchId: string) => BoothPackage[];
  visibleAddonsForBranch: (branchId: string) => BoothAddon[];
  seed: () => void;
}

export const useBoothCatalogStore = create<BoothCatalogStore>()(
  persist(
    (set, get) => ({
      packages: SEED_BOOTH_PACKAGES,
      addons: SEED_BOOTH_ADDONS,

      addPackage: (input) => {
        const now = new Date().toISOString();
        const next: BoothPackage = {
          ...input,
          id: input.id ?? newId(),
          order: input.order ?? get().packages.length,
          visible: input.visible ?? true,
          createdAt: now,
          updatedAt: now,
        };
        set({ packages: [...get().packages, next] });
      },

      updatePackage: (id, patch) =>
        set({
          packages: get().packages.map((pkg) =>
            pkg.id === id ? { ...pkg, ...patch, updatedAt: new Date().toISOString() } : pkg,
          ),
        }),

      removePackage: (id) =>
        set({
          packages: get().packages.filter((pkg) => pkg.id !== id),
        }),

      reorderPackages: (fromIndex, toIndex) => {
        const sorted = [...get().packages].sort((a, b) => a.order - b.order);
        if (fromIndex < 0 || fromIndex >= sorted.length || toIndex < 0 || toIndex >= sorted.length) return;
        const [removed] = sorted.splice(fromIndex, 1);
        sorted.splice(toIndex, 0, removed);
        set({ packages: sorted.map((pkg, i) => ({ ...pkg, order: i })) });
      },

      addAddon: (input) => {
        const now = new Date().toISOString();
        const next: BoothAddon = {
          ...input,
          id: input.id ?? newId(),
          order: input.order ?? get().addons.length,
          visible: input.visible ?? true,
          createdAt: now,
          updatedAt: now,
        };
        set({ addons: [...get().addons, next] });
      },

      updateAddon: (id, patch) =>
        set({
          addons: get().addons.map((addon) =>
            addon.id === id ? { ...addon, ...patch, updatedAt: new Date().toISOString() } : addon,
          ),
        }),

      removeAddon: (id) =>
        set({
          addons: get().addons.filter((addon) => addon.id !== id),
        }),

      reorderAddons: (fromIndex, toIndex) => {
        const sorted = [...get().addons].sort((a, b) => a.order - b.order);
        if (fromIndex < 0 || fromIndex >= sorted.length || toIndex < 0 || toIndex >= sorted.length) return;
        const [removed] = sorted.splice(fromIndex, 1);
        sorted.splice(toIndex, 0, removed);
        set({ addons: sorted.map((addon, i) => ({ ...addon, order: i })) });
      },

      visiblePackages: () =>
        get()
          .packages.filter((pkg) => pkg.visible)
          .sort((a, b) => a.order - b.order),

      visibleAddons: () =>
        get()
          .addons.filter((addon) => addon.visible)
          .sort((a, b) => a.order - b.order),

      visiblePackagesForBranch: (branchId) =>
        get()
          .packages.filter((pkg) => pkg.visible && (!pkg.branchId || pkg.branchId === branchId))
          .sort((a, b) => a.order - b.order),

      visibleAddonsForBranch: (branchId) =>
        get()
          .addons.filter((addon) => addon.visible && (!addon.branchId || addon.branchId === branchId))
          .sort((a, b) => a.order - b.order),

      seed: () => set({ packages: SEED_BOOTH_PACKAGES, addons: SEED_BOOTH_ADDONS }),
    }),
    { name: 'kado-booth-catalog-v1' },
  ),
);
