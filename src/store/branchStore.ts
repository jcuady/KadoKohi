import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Branch } from '../types/domain';
import { SEED_BRANCHES } from '../data/seed';
import { newId } from '../lib/id';
import { useTableStore } from './tableStore';

export interface BranchStore {
  branches: Branch[];
  adminPosBranchId: string | null;
  setAdminPosBranchId: (id: string | null) => void;
  addBranch: (input: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  updateBranch: (id: string, patch: Partial<Branch>) => void;
  removeBranch: (id: string) => void;
  getBranch: (id: string) => Branch | undefined;
  seed: () => void;
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set, get) => ({
      branches: SEED_BRANCHES,
      adminPosBranchId: SEED_BRANCHES[0]?.id ?? null,

      setAdminPosBranchId: (id) => set({ adminPosBranchId: id }),

      addBranch: (input) => {
        const t = new Date().toISOString();
        const b: Branch = {
          id: input.id ?? newId(),
          slug: input.slug.trim().toLowerCase().replace(/\s+/g, '-'),
          name: input.name,
          address: input.address,
          city: input.city,
          status: input.status,
          hours: input.hours ?? [],
          heroImage: input.heroImage,
          lat: input.lat,
          lng: input.lng,
          createdAt: t,
          updatedAt: t,
        };
        const next = [...get().branches, b];
        set({
          branches: next,
          adminPosBranchId: get().adminPosBranchId ?? b.id,
        });

        // Auto-seed 4 default tables for the new branch
        const tableStore = useTableStore.getState();
        for (let i = 1; i <= 4; i++) {
          tableStore.addTable(b.id, `Table ${i}`, b.slug);
        }
      },

      updateBranch: (id, patch) =>
        set({
          branches: get().branches.map((br) =>
            br.id === id ? { ...br, ...patch, updatedAt: new Date().toISOString() } : br,
          ),
        }),

      removeBranch: (id) => {
        const remaining = get().branches.filter((br) => br.id !== id);
        const nextPos =
          get().adminPosBranchId === id ? remaining[0]?.id ?? null : get().adminPosBranchId;
        set({ branches: remaining, adminPosBranchId: nextPos });
      },

      getBranch: (id) => get().branches.find((br) => br.id === id),

      seed: () => set({ branches: SEED_BRANCHES, adminPosBranchId: SEED_BRANCHES[0]?.id ?? null }),
    }),
    { name: 'kado-branches-v1' },
  ),
);
