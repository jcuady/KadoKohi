import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, User } from '../types/domain';
import { newId } from '../lib/id';

export interface AuthStore {
  user: User | null;
  /** Pass `id` after signup so the session matches the persisted user row (orders, API). */
  loginAs: (
    role: Exclude<Role, 'guest'>,
    opts?: { id?: string; name?: string; email?: string; branchId?: string; loyaltyStamps?: number; createdAt?: string },
  ) => void;
  logout: () => void;
  /** Earn loyalty stamps (customers only). */
  addLoyaltyStamps: (delta: number) => void;
}

function makeUser(
  role: Exclude<Role, 'guest'>,
  opts?: { id?: string; name?: string; email?: string; branchId?: string; loyaltyStamps?: number; createdAt?: string },
): User {
  const t = opts?.createdAt ?? new Date().toISOString();
  const base = {
    id: opts?.id ?? newId(),
    email: opts?.email ?? `${role}@kadokohi.local`,
    name: opts?.name ?? (role === 'admin' ? 'Owner' : role === 'barista' ? 'Barista' : role === 'staff' ? 'Staff' : 'Customer'),
    role,
    createdAt: t,
  };
  if (role === 'barista' || role === 'staff') {
    return { ...base, branchId: opts?.branchId ?? 'branch_marikina' };
  }
  if (role === 'customer') {
    return { ...base, loyaltyStamps: opts?.loyaltyStamps ?? 0 };
  }
  return base;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loginAs: (role, opts) => set({ user: makeUser(role, opts) }),
      logout: () => set({ user: null }),
      addLoyaltyStamps: (delta) => {
        const u = get().user;
        if (!u || u.role !== 'customer' || delta <= 0) return;
        const next = (u.loyaltyStamps ?? 0) + delta;
        set({ user: { ...u, loyaltyStamps: next } });
      },
    }),
    { name: 'kado-auth-v1' },
  ),
);
