import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Branch } from '../types/domain';
import { SEED_BRANCHES } from '../data/seed';
import { newId } from '../lib/id';
import { useTableStore } from './tableStore';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { logAudit } from '../lib/audit';

export interface BranchStore {
  branches: Branch[];
  adminPosBranchId: string | null;
  hydrateFromRemote: () => Promise<void>;
  setAdminPosBranchId: (id: string | null) => void;
  addBranch: (input: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<Branch>;
  updateBranch: (id: string, patch: Partial<Branch>) => Promise<void>;
  removeBranch: (id: string) => Promise<void>;
  getBranch: (id: string) => Branch | undefined;
  seed: () => void;
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set, get) => ({
      branches: SEED_BRANCHES,
      adminPosBranchId: SEED_BRANCHES[0]?.id ?? null,
      hydrateFromRemote: async () => {
        try {
          const branches = await orderingRepo.fetchBranches();
          if (branches.length) {
            set((s) => ({
              branches,
              adminPosBranchId:
                (s.adminPosBranchId && branches.some((b) => b.id === s.adminPosBranchId)
                  ? s.adminPosBranchId
                  : branches[0]?.id) ?? null,
            }));
          }
        } catch {
          // Keep seed fallback when remote fetch fails.
        }
      },

      setAdminPosBranchId: (id) => set({ adminPosBranchId: id }),

      addBranch: async (input) => {
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

        const tableStore = useTableStore.getState();
        const seededTableIds: string[] = [];
        let branchPersisted = false;

        try {
          await orderingRepo.upsertBranch(b);
          branchPersisted = true;

          for (let i = 1; i <= 4; i++) {
            const table = await tableStore.addTable(b.id, `Table ${i}`, b.slug);
            seededTableIds.push(table.id);
          }

          const next = [...get().branches, b];
          set({
            branches: next,
            adminPosBranchId: get().adminPosBranchId ?? b.id,
          });

          logAudit({
            action: 'branch.created',
            entityType: 'branch',
            entityId: b.id,
            branchId: b.id,
            summary: `Created branch ${b.name}`,
          });

          return b;
        } catch (err) {
          for (const tableId of [...seededTableIds].reverse()) {
            await tableStore.removeTable(tableId).catch(() => undefined);
          }
          if (branchPersisted) {
            await orderingRepo.deleteBranch(b.id).catch(() => undefined);
          }
          set({
            branches: get().branches.filter((br) => br.id !== b.id),
          });
          throw err;
        }
      },

      updateBranch: async (id, patch) => {
        const updated = get().branches.find((br) => br.id === id);
        if (!updated) return;
        const normalizedPatch = { ...patch };
        if (typeof normalizedPatch.slug === 'string') {
          normalizedPatch.slug = normalizedPatch.slug.trim().toLowerCase().replace(/\s+/g, '-');
        }
        const next: Branch = { ...updated, ...normalizedPatch, updatedAt: new Date().toISOString() };
        await orderingRepo.upsertBranch(next);
        set({
          branches: get().branches.map((br) => (br.id === id ? next : br)),
        });
        logAudit({
          action: 'branch.updated',
          entityType: 'branch',
          entityId: id,
          branchId: id,
          summary: `Updated branch ${next.name}`,
          metadata: { changedKeys: Object.keys(patch) },
        });
      },

      removeBranch: async (id) => {
        const deleted = get().branches.find((br) => br.id === id);
        const tableStore = useTableStore.getState();
        await tableStore.hydrateFromRemote().catch(() => undefined);
        for (const table of tableStore.tables.filter((t) => t.branchId === id)) {
          await tableStore.removeTable(table.id);
        }
        await orderingRepo.deleteBranch(id);

        const remaining = get().branches.filter((br) => br.id !== id);
        const nextPos =
          get().adminPosBranchId === id ? remaining[0]?.id ?? null : get().adminPosBranchId;
        set({ branches: remaining, adminPosBranchId: nextPos });
        logAudit({
          action: 'branch.deleted',
          entityType: 'branch',
          entityId: id,
          summary: `Deleted branch ${deleted?.name ?? id}`,
        });
      },

      getBranch: (id) => get().branches.find((br) => br.id === id),

      seed: () => set({ branches: SEED_BRANCHES, adminPosBranchId: SEED_BRANCHES[0]?.id ?? null }),
    }),
    {
      name: 'kado-admin-prefs-v1',
      partialize: (state) => ({ adminPosBranchId: state.adminPosBranchId }),
    },
  ),
);
