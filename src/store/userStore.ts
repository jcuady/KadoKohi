import { create } from 'zustand';
import type { Role, User } from '../types/domain';
import { newId } from '../lib/id';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { authRepo } from '../lib/supabase/repositories/auth';
import { logAudit } from '../lib/audit';

const SEED_USERS: User[] = [
  {
    id: 'user_admin',
    email: 'admin@kadokohi.com',
    name: 'Owner',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_barista',
    email: 'barista@kadokohi.com',
    name: 'Barista',
    role: 'barista',
    branchId: 'branch_marikina',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_customer',
    email: 'customer@kadokohi.com',
    name: 'Customer',
    role: 'customer',
    loyaltyStamps: 8,
    createdAt: new Date().toISOString(),
  },
];

export interface UserStore {
  users: User[];
  hydrateFromRemote: () => Promise<void>;
  addUser: (input: Omit<User, 'id' | 'createdAt'> & { id?: string }) => User;
  updateUser: (id: string, patch: Partial<User>) => Promise<void>;
  /** Admin/barista manual stamp adjustment (delta can be negative). Audited. */
  adjustLoyaltyStamps: (id: string, delta: number, reason?: string) => void;
  removeUser: (id: string) => Promise<void>;
  getById: (id: string) => User | undefined;
  seed: () => void;
}

export const useUserStore = create<UserStore>()((set, get) => ({
      users: [],
      hydrateFromRemote: async () => {
        try {
          const users = await orderingRepo.fetchUsers();
          set({ users });
        } catch {
          // Keep in-memory state when remote fetch fails.
        }
      },

      addUser: (input) => {
        const u: User = {
          id: input.id ?? newId(),
          email: input.email,
          name: input.name,
          role: input.role,
          branchId: input.branchId,
          loyaltyStamps: input.role === 'customer' ? (input.loyaltyStamps ?? 0) : undefined,
          createdAt: new Date().toISOString(),
        };
        set({ users: [...get().users, u] });
        void orderingRepo.upsertUser(u);
        return u;
      },

      updateUser: async (id, patch) => {
        const existing = get().users.find((u) => u.id === id);
        if (!existing) {
          const inserted: User = {
            id,
            email: typeof patch.email === 'string' ? patch.email : `${id}@kadokohi.local`,
            name: typeof patch.name === 'string' ? patch.name : 'User',
            role: (patch.role as Role | undefined) ?? 'customer',
            branchId: patch.branchId,
            loyaltyStamps: patch.loyaltyStamps,
            createdAt: typeof patch.createdAt === 'string' ? patch.createdAt : new Date().toISOString(),
          };
          await orderingRepo.upsertUser(inserted);
          set({ users: [...get().users, inserted] });
          return;
        }
        const merged = { ...existing, ...patch };
        const updated: User =
          merged.role === 'admin'
            ? { ...merged, branchId: undefined, phone: undefined }
            : merged.role === 'customer'
              ? { ...merged, branchId: undefined }
              : { ...merged, phone: undefined, branchId: merged.branchId };
        await orderingRepo.upsertUser(updated);
        set({
          users: get().users.map((u) => (u.id === id ? updated : u)),
        });
      },

      adjustLoyaltyStamps: (id, delta, reason) => {
        const user = get().getById(id);
        if (!user || delta === 0) return;
        const before = user.loyaltyStamps ?? 0;
        const after = Math.max(0, before + delta);
        if (after === before) return;
        const updated = { ...user, loyaltyStamps: after };
        set({ users: get().users.map((u) => (u.id === id ? updated : u)) });
        void orderingRepo.updateUserStamps(id, after);
        logAudit({
          action: 'loyalty.stamps_adjusted',
          entityType: 'customer',
          entityId: id,
          summary: `${user.name}: ${before} → ${after} stamps (${delta > 0 ? '+' : ''}${delta})`,
          metadata: { before, after, delta, reason: reason ?? null },
        });
      },

      removeUser: async (id) => {
        const deleted = get().users.find((u) => u.id === id);
        await authRepo.deleteUser(id);
        set({ users: get().users.filter((u) => u.id !== id) });
        logAudit({
          action: 'user.deleted',
          entityType: 'user',
          entityId: id,
          summary: deleted ? `Deleted user ${deleted.name} (${deleted.email})` : `Deleted user ${id}`,
        });
      },

      getById: (id) => get().users.find((u) => u.id === id),

      seed: () => set({ users: SEED_USERS }),
}));
