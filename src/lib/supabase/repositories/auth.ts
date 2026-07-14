import type { AuthTokenResponse } from '@supabase/supabase-js';
import { supabase } from '../client';
import type { Role } from '../../../types/domain';
import { getAuthConfirmUrl } from '../../siteUrl';
import {
  clearLocalAuthBeforeSignup,
  invalidateLocalAuthSession,
  isInvalidRefreshTokenError,
  recoverStaleAuthSession,
} from '../authSession';

export type ResetScope = 'all' | 'transactional' | 'orders' | 'bookings' | 'loyalty_activity' | 'customers';

function parseEdgePayload(data: unknown): void {
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String((data as { error: unknown }).error));
  }
}

async function invokeAdminUsers<T = unknown>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('kk-admin-users', { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    if (ctx) {
      try {
        const payload = (await ctx.json()) as { error?: string };
        if (payload?.error) throw new Error(payload.error);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== error.message) throw parseErr;
      }
    }
    throw error;
  }
  parseEdgePayload(data);
  return data as T;
}

let signUpInFlight: Promise<AuthTokenResponse['data']> | null = null;

export const authRepo = {
  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    await recoverStaleAuthSession();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signUp(email: string, password: string, name: string, phone: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    if (signUpInFlight) return signUpInFlight;

    signUpInFlight = (async () => {
      await clearLocalAuthBeforeSignup();

      const emailRedirectTo = getAuthConfirmUrl();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role: 'customer', phone },
          emailRedirectTo,
        },
      });
      if (error) throw error;
      if (data.user?.identities && data.user.identities.length === 0) {
        throw new Error('That email is already registered. Try signing in instead.');
      }
      if (!data.user?.id) {
        throw new Error('Sign up failed. Please try again.');
      }

      const { data: fnData, error: fnError } = await supabase.functions.invoke('kk-customer-signup', {
        body: {
          profileOnly: true,
          userId: data.user.id,
          email,
          name,
          phone,
        },
      });
      if (fnError) throw fnError;
      parseEdgePayload(fnData);

      if (!data.session) {
        return {
          user: data.user,
          session: null,
        };
      }

      return data;
    })();

    try {
      return await signUpInFlight;
    } finally {
      signUpInFlight = null;
    }
  },
  async signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  },
  async session() {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        await invalidateLocalAuthSession();
      } else {
        await recoverStaleAuthSession();
      }
      return null;
    }
    return data.session;
  },
  async updatePassword(newPassword: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
  /**
   * Change password while signed in — verifies current password first (no email OTP).
   * Fresh sign-in satisfies Supabase "Secure password change"; current_password covers
   * projects that require the old password on updateUser.
   */
  async changePassword(currentPassword: string, newPassword: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const current = currentPassword.trim();
    const next = newPassword.trim();
    if (current.length < 1) throw new Error('Enter your current password.');
    if (next.length < 8) throw new Error('Password must be at least 8 characters.');
    if (current === next) throw new Error('New password must be different from your current password.');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const email = userData.user?.email?.trim();
    if (!email) throw new Error('You must be signed in to change your password.');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (signInError) {
      throw new Error('Current password is incorrect.');
    }

    const { error } = await supabase.auth.updateUser({
      password: next,
      current_password: current,
    });
    if (error) throw error;
  },
  async resetPasswordForEmail(email: string, redirectTo: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  },
  async resendSignupConfirmation(email: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: getAuthConfirmUrl() },
    });
    if (error) throw error;
  },
  async createInternalUser(input: {
    email: string;
    password: string;
    name: string;
    role: Extract<Role, 'admin' | 'barista' | 'staff' | 'customer'>;
    branchId?: string;
  }) {
    return invokeAdminUsers<{ user?: { id: string } }>({
      action: 'create_user',
      ...input,
    });
  },
  async updateInternalUser(input: {
    userId: string;
    name: string;
    email: string;
    role: Extract<Role, 'admin' | 'barista' | 'staff' | 'customer'>;
    branchId?: string;
  }) {
    return invokeAdminUsers<{ success: boolean; user?: { id: string } }>({
      action: 'update_user',
      ...input,
    });
  },
  async resetInternalPassword(userId: string, newPassword: string) {
    return invokeAdminUsers({
      action: 'reset_password',
      userId,
      newPassword,
    });
  },
  async sendPasswordResetEmail(userId: string) {
    return invokeAdminUsers<{ success: boolean }>({
      action: 'send_password_reset',
      userId,
    });
  },
  async deleteUser(userId: string) {
    return invokeAdminUsers<{ success: boolean }>({
      action: 'delete_user',
      userId,
    });
  },
  async resetAllData(confirmPhrase: string) {
    return this.resetData('all', confirmPhrase);
  },
  async resetData(scope: ResetScope, confirmPhrase: string) {
    return invokeAdminUsers<{
      success: boolean;
      scope: string;
      deleted: Record<string, number | boolean>;
      usersRemoved?: number;
    }>({
      action: 'reset_scope',
      scope,
      confirmPhrase,
    });
  },
};
