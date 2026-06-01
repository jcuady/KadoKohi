import { create } from 'zustand';
import type { User } from '../types/domain';
import { useUserStore } from './userStore';
import { useOrderStore } from './orderStore';
import { authRepo } from '../lib/supabase/repositories/auth';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { supabase } from '../lib/supabase/client';
import {
  refreshOperationsData,
  startOperationsRealtime,
  stopOperationsRealtime,
} from '../lib/supabase/operationsRealtime';

function normalizeProfile(profile: User): User {
  if (profile.role === 'admin') {
    return { ...profile, branchId: undefined, loyaltyStamps: undefined };
  }
  return profile;
}

function isInternalRole(role: User['role']): boolean {
  return role === 'admin' || role === 'barista' || role === 'staff';
}

async function resolveSessionProfile(
  sessionUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  fallbackName?: string,
): Promise<User> {
  const users = await orderingRepo.fetchUsers();
  const existing = users.find((u) => u.id === sessionUser.id);
  if (existing) return normalizeProfile(existing);

  const metaName =
    (typeof sessionUser.user_metadata?.name === 'string' ? sessionUser.user_metadata.name : undefined) ??
    fallbackName;
  try {
    const ensured = await orderingRepo.ensureMyProfile(metaName);
    useUserStore.getState().updateUser(ensured.id, ensured);
    return normalizeProfile(ensured);
  } catch {
    return normalizeProfile({
      id: sessionUser.id,
      email: sessionUser.email ?? '',
      name: metaName ?? 'Customer',
      role: 'customer',
      loyaltyStamps: 0,
      createdAt: new Date().toISOString(),
    } as User);
  }
}

/** After JWT is available, wire live sync for staff surfaces. */
function syncOperationalSession(profile: User): void {
  if (isInternalRole(profile.role)) {
    startOperationsRealtime();
    void refreshOperationsData();
    return;
  }
  // Customers: refresh their own orders (no full ops channel).
  void useOrderStore.getState().hydrateFromRemote();
}

export interface AuthStore {
  user: User | null;
  loading: boolean;
  initFromSupabase: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  /** Earn loyalty stamps (customers only). */
  addLoyaltyStamps: (delta: number) => void;
  /** Spend stamps when claiming a voucher (customers only). */
  spendLoyaltyStamps: (delta: number) => void;
}

/** Session lives in Supabase Auth (localStorage). No Zustand persist — avoids stale user after logout. */
export const useAuthStore = create<AuthStore>()((set, get) => ({
      user: null,
      // Starts true so route guards show a spinner (not a redirect) until the
      // Supabase session is restored on a fresh load / hard refresh / deep link.
      loading: true,
      initFromSupabase: async () => {
        if (!supabase) {
          set({ loading: false });
          return;
        }
        set({ loading: true });
        try {
          const session = await authRepo.session();
          if (!session?.user) {
            stopOperationsRealtime();
            set({ user: null, loading: false });
            return;
          }
          const profile = await resolveSessionProfile(session.user);
          set({ user: profile, loading: false });
          useUserStore.getState().updateUser(profile.id, profile);
          syncOperationalSession(profile);
        } catch {
          set({ loading: false });
        }
      },
      signIn: async (email, password) => {
        const res = await authRepo.signIn(email, password);
        const sessionUser = res.user;
        if (!sessionUser) return;
        const profile = await resolveSessionProfile(sessionUser);
        set({ user: profile });
        useUserStore.getState().updateUser(profile.id, profile);
        syncOperationalSession(profile);
      },
      signUp: async (name, email, password) => {
        const res = await authRepo.signUp(email, password, name);
        const sessionUser = res.user;
        if (!sessionUser) throw new Error('Sign up failed. Please try again.');
        // When email confirmation is enabled, signUp returns a user but NO session.
        // Don't fake a logged-in state — let the UI ask them to confirm their email.
        if (!res.session) {
          return { needsEmailConfirmation: true };
        }
        const profile = await resolveSessionProfile(sessionUser, name);
        set({ user: profile });
        return { needsEmailConfirmation: false };
      },
      logout: async () => {
        stopOperationsRealtime();
        await authRepo.signOut();
        set({ user: null });
      },
      addLoyaltyStamps: (delta) => {
        const u = get().user;
        if (!u || u.role !== 'customer' || delta <= 0) return;
        const next = (u.loyaltyStamps ?? 0) + delta;
        set({ user: { ...u, loyaltyStamps: next } });
        useUserStore.getState().updateUser(u.id, { loyaltyStamps: next });
      },
      spendLoyaltyStamps: (delta) => {
        const u = get().user;
        if (!u || u.role !== 'customer' || delta <= 0) return;
        const current = u.loyaltyStamps ?? 0;
        if (current < delta) return;
        const next = current - delta;
        set({ user: { ...u, loyaltyStamps: next } });
        useUserStore.getState().updateUser(u.id, { loyaltyStamps: next });
      },
}));
