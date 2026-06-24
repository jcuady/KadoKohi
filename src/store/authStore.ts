import { create } from 'zustand';
import type { User } from '../types/domain';
import { useUserStore } from './userStore';
import { authRepo } from '../lib/supabase/repositories/auth';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { supabase } from '../lib/supabase/client';
import {
  isInvalidRefreshTokenError,
  invalidateLocalAuthSession,
  pauseAuthListener,
  resumeAuthListener,
} from '../lib/supabase/authSession';
import {
  hydrateCustomerAccount,
  hydrateOpsPortal,
} from '../lib/bootstrapHydration';
import {
  stopOperationsRealtime,
} from '../lib/supabase/operationsRealtime';
import { isInternalRole } from '../lib/roles';

function normalizeProfile(profile: User): User {
  if (profile.role === 'admin') {
    return { ...profile, branchId: undefined, loyaltyStamps: undefined };
  }
  return profile;
}

async function resolveSessionProfile(
  sessionUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  fallbackName?: string,
): Promise<User> {
  const existing = await orderingRepo.fetchUserById(sessionUser.id);
  if (existing) return normalizeProfile(existing);

  const metaName =
    (typeof sessionUser.user_metadata?.name === 'string' ? sessionUser.user_metadata.name : undefined) ??
    fallbackName;
  try {
    const ensured = await orderingRepo.ensureMyProfile(metaName);
    useUserStore.getState().setLocalUser(ensured);
    return normalizeProfile(ensured);
  } catch {
    const metaRole = sessionUser.user_metadata?.role;
    const role =
      metaRole === 'admin' || metaRole === 'barista' || metaRole === 'staff' || metaRole === 'customer'
        ? metaRole
        : 'customer';
    const metaBranch =
      typeof sessionUser.user_metadata?.branch_id === 'string'
        ? sessionUser.user_metadata.branch_id
        : undefined;
    return normalizeProfile({
      id: sessionUser.id,
      email: sessionUser.email ?? '',
      name: metaName ?? 'User',
      role,
      branchId: role === 'admin' || role === 'customer' ? undefined : metaBranch,
      loyaltyStamps: role === 'customer' ? 0 : undefined,
      createdAt: new Date().toISOString(),
    } as User);
  }
}

/** After JWT is available, wire live sync for staff surfaces. */
function syncOperationalSession(profile: User): void {
  if (isInternalRole(profile.role)) {
    void hydrateOpsPortal();
    return;
  }
  if (profile.role === 'customer') {
    void hydrateCustomerAccount(profile.id);
  }
}

export interface AuthStore {
  user: User | null;
  loading: boolean;
  initFromSupabase: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, phone: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
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
        const showBootstrapSpinner = !get().user;
        if (showBootstrapSpinner) set({ loading: true });
        try {
          const session = await authRepo.session();
          if (!session?.user) {
            stopOperationsRealtime();
            set({ user: null, loading: false });
            return;
          }
          const profile = await resolveSessionProfile(session.user);
          set({ user: profile, loading: false });
          useUserStore.getState().setLocalUser(profile);
          syncOperationalSession(profile);
        } catch (err) {
          if (isInvalidRefreshTokenError(err)) {
            await invalidateLocalAuthSession();
          }
          set({ user: null, loading: false });
        }
      },
      signIn: async (email, password) => {
        pauseAuthListener();
        try {
          const res = await authRepo.signIn(email, password);
          const sessionUser = res.user;
          if (!sessionUser) return;
          const profile = await resolveSessionProfile(sessionUser);
          set({ user: profile, loading: false });
          useUserStore.getState().setLocalUser(profile);
          syncOperationalSession(profile);
        } finally {
          resumeAuthListener();
        }
      },
      signUp: async (name, email, phone, password) => {
        pauseAuthListener();
        try {
          const res = await authRepo.signUp(email, password, name, phone);
          const sessionUser = res.user;
          if (!sessionUser) throw new Error('Sign up failed. Please try again.');
          if (sessionUser.identities && sessionUser.identities.length === 0) {
            throw new Error('That email is already registered. Try signing in instead.');
          }
          // When email confirmation is enabled, signUp returns a user but NO session.
          if (!res.session) {
            return { needsEmailConfirmation: true };
          }
          const profile = await resolveSessionProfile(sessionUser, name);
          set({ user: profile, loading: false });
          useUserStore.getState().setLocalUser(profile);
          syncOperationalSession(profile);
          return { needsEmailConfirmation: false };
        } finally {
          resumeAuthListener();
        }
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
