import { create } from 'zustand';
import type { User } from '../types/domain';
import { useUserStore } from './userStore';
import { authRepo } from '../lib/supabase/repositories/auth';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { supabase } from '../lib/supabase/client';

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
            set({ user: null, loading: false });
            return;
          }
          const users = await orderingRepo.fetchUsers();
          const profile =
            users.find((u) => u.id === session.user.id) ??
            ({
              id: session.user.id,
              email: session.user.email ?? '',
              name: (session.user.user_metadata?.name as string | undefined) ?? 'Customer',
              role: 'customer',
              createdAt: new Date().toISOString(),
            } as User);
          set({ user: profile, loading: false });
          useUserStore.getState().updateUser(profile.id, profile);
        } catch {
          set({ loading: false });
        }
      },
      signIn: async (email, password) => {
        const res = await authRepo.signIn(email, password);
        const sessionUser = res.user;
        if (!sessionUser) return;
        const users = await orderingRepo.fetchUsers();
        const profile =
          users.find((u) => u.id === sessionUser.id) ??
          ({
            id: sessionUser.id,
            email: sessionUser.email ?? email,
            name: (sessionUser.user_metadata?.name as string | undefined) ?? 'Customer',
            role: 'customer',
            createdAt: new Date().toISOString(),
          } as User);
        set({ user: profile });
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
        const profile: User = {
          id: sessionUser.id,
          email: email.toLowerCase(),
          name,
          role: 'customer',
          loyaltyStamps: 0,
          createdAt: new Date().toISOString(),
        };
        useUserStore.getState().updateUser(profile.id, profile);
        set({ user: profile });
        return { needsEmailConfirmation: false };
      },
      logout: async () => {
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
