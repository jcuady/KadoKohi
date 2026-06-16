import { create } from 'zustand';
import type { BoothAddon, BoothPackage } from '../types/domain';
import { SEED_BOOTH_ADDONS, SEED_BOOTH_PACKAGES } from '../data/seed';
import { newId } from '../lib/id';
import { orderingRepo } from '../lib/supabase/repositories/ordering';

function normalizeCatalog(raw: unknown): { packages: BoothPackage[]; addons: BoothAddon[] } {
  if (!raw || typeof raw !== 'object') {
    return { packages: SEED_BOOTH_PACKAGES, addons: SEED_BOOTH_ADDONS };
  }
  const row = raw as { packages?: unknown; addons?: unknown };
  const packages = Array.isArray(row.packages) ? (row.packages as BoothPackage[]) : SEED_BOOTH_PACKAGES;
  const addons = Array.isArray(row.addons) ? (row.addons as BoothAddon[]) : SEED_BOOTH_ADDONS;
  return { packages, addons };
}

export interface BoothCatalogStore {
  packages: BoothPackage[];
  addons: BoothAddon[];
  saveError: string | null;
  saving: boolean;
  hydrated: boolean;
  hydrateFromRemote: () => Promise<void>;
  saveToRemote: () => Promise<void>;
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

export const useBoothCatalogStore = create<BoothCatalogStore>()((set, get) => ({
  packages: SEED_BOOTH_PACKAGES,
  addons: SEED_BOOTH_ADDONS,
  saveError: null,
  saving: false,
  hydrated: false,

  hydrateFromRemote: async () => {
    try {
      const remote = await orderingRepo.fetchBoothCatalog();
      if (remote) {
        const { packages, addons } = normalizeCatalog(remote);
        set({ packages, addons, saveError: null, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  saveToRemote: async () => {
    const { packages, addons } = get();
    set({ saving: true, saveError: null });
    try {
      await orderingRepo.upsertBoothCatalog({ packages, addons });
      set({ saving: false, saveError: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save booth catalog.';
      set({ saving: false, saveError: message });
      throw err;
    }
  },

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

  removePackage: (id) => set({ packages: get().packages.filter((pkg) => pkg.id !== id) }),

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

  removeAddon: (id) => set({ addons: get().addons.filter((addon) => addon.id !== id) }),

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

  seed: () => set({ packages: SEED_BOOTH_PACKAGES, addons: SEED_BOOTH_ADDONS, saveError: null }),
}));
