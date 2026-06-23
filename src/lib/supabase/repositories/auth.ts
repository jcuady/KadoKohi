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

function parseEdgePayload(data: unknown): void {
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String((data as { error: unknown }).error));
  }
}

async function invokeAdminUsers<T = unknown>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('kk-admin-users', { body });
  if (error) throw error;
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
    return invokeAdminUsers<{
      success: boolean;
      deleted: Record<string, number | boolean>;
    }>({
      action: 'reset_all_data',
      confirmPhrase,
    });
  },
};
