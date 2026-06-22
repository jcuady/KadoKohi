import { create } from 'zustand';
import type { User } from '../types/domain';
import { useUserStore } from './userStore';
import { authRepo } from '../lib/supabase/repositories/auth';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import {
  hydrateCustomerAccount,
  hydrateOpsPortal,
} from '../lib/bootstrapHydration';
import { stopOperationsRealtime } from '../lib/supabase/operationsRealtime';
import { isInternalRole } from '../lib/roles';
import { CLERK_SUPABASE_SETUP_HINT } from '../lib/clerk/supabaseToken';
import { isProfileUuid } from '../lib/id';

function normalizeProfile(profile: User): User {
  if (profile.role === 'admin') {
    return { ...profile, branchId: undefined, loyaltyStamps: undefined };
  }
  return profile;
}

/** After JWT is available, wire live sync for staff surfaces. */
function syncOperationalSession(profile: User): void {
  if (isInternalRole(profile.role)) {
    void hydrateOpsPortal();
    return;
  }
  if (profile.role === 'customer' && isProfileUuid(profile.id)) {
    void hydrateCustomerAccount(profile.id);
  }
}

export interface AuthStore {
  user: User | null;
  loading: boolean;
  hydrateError: string | null;
  setHydrateError: (message: string | null) => void;
  /** Hydrate kk_profiles from Clerk user id (clerk_user_id bridge). */
  hydrateFromClerk: (clerkUserId: string, email: string, name: string) => Promise<void>;
  clearUser: () => void;
  logout: () => Promise<void>;
  addLoyaltyStamps: (delta: number) => void;
  spendLoyaltyStamps: (delta: number) => void;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  loading: true,
  hydrateError: null,
  setHydrateError: (message) => {
    set({ hydrateError: message, loading: message ? false : get().loading });
  },
  clearUser: () => {
    stopOperationsRealtime();
    set({ user: null, loading: false, hydrateError: null });
  },
  hydrateFromClerk: async (clerkUserId, email, name) => {
    set({ loading: true, hydrateError: null });
    try {
      let profile = await orderingRepo.fetchUserByClerkId(clerkUserId);
      if (!profile?.id) {
        profile = await orderingRepo.ensureMyProfile(name);
      }
      if (!profile?.id) {
        profile = await orderingRepo.fetchUserByClerkId(clerkUserId);
      }
      if (!profile?.id || !isProfileUuid(profile.id)) {
        set({
          user: null,
          loading: false,
          hydrateError: 'Your account profile could not be created. Please try again.',
        });
        return;
      }
      profile = normalizeProfile(profile);
      set({ user: profile, loading: false, hydrateError: null });
      useUserStore.getState().setLocalUser(profile);
      syncOperationalSession(profile);
    } catch (err) {
      const pgCode =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: string }).code ?? '')
          : '';
      let message =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Could not load your account. Please try again.';
      if (message === 'Not authenticated') {
        message = `Supabase did not receive a valid Clerk session. ${CLERK_SUPABASE_SETUP_HINT}`;
      } else if (message.includes('invalid input syntax for type uuid')) {
        message = 'Account linking failed (invalid user id format). Please try again in a moment.';
      } else if (
        message.includes('no unique or exclusion constraint matching the ON CONFLICT') ||
        pgCode === '23503'
      ) {
        message = 'Profile setup is updating on the server. Please wait a moment and try again.';
      }
      if (import.meta.env.DEV) console.error('[auth] hydrateFromClerk failed', err);
      set({ user: null, loading: false, hydrateError: message });
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
