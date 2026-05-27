import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, User } from '../types/domain';
import { newId } from '../lib/id';

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
  addUser: (input: Omit<User, 'id' | 'createdAt'> & { id?: string }) => User;
  updateUser: (id: string, patch: Partial<User>) => void;
  removeUser: (id: string) => void;
  getById: (id: string) => User | undefined;
  seed: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      users: SEED_USERS,

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
        return u;
      },

      updateUser: (id, patch) =>
        set({ users: get().users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }),

      removeUser: (id) => set({ users: get().users.filter((u) => u.id !== id) }),

      getById: (id) => get().users.find((u) => u.id === id),

      seed: () => set({ users: SEED_USERS }),
    }),
    { name: 'kado-users-v1' },
  ),
);
