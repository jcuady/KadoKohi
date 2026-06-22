import type { AuthTokenResponse, User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '../client';
import type { Role } from '../../../types/domain';
import {
  clearLocalAuthBeforeSignup,
  invalidateLocalAuthSession,
  isInvalidRefreshTokenError,
  isRateLimitAuthError,
  recoverStaleAuthSession,
  startAuthAutoRefresh,
  stopAuthAutoRefresh,
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

type CustomerSignupResult = {
  ok?: boolean;
  userId?: string;
  needsEmailConfirmation?: boolean;
};

let signUpInFlight: Promise<AuthTokenResponse['data']> | null = null;

export const authRepo = {
  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    await recoverStaleAuthSession();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    startAuthAutoRefresh();
    return data;
  },
  async signUp(email: string, password: string, name: string, phone: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    if (signUpInFlight) return signUpInFlight;

    signUpInFlight = (async () => {
      await clearLocalAuthBeforeSignup();

      const { data: fnData, error: fnError } = await supabase.functions.invoke('kk-customer-signup', {
        body: { email, password, name, phone },
      });
      if (fnError) throw fnError;
      parseEdgePayload(fnData);

      const result = fnData as CustomerSignupResult;
      if (result.needsEmailConfirmation && result.userId) {
        return {
          user: {
            id: result.userId,
            email,
            user_metadata: { name },
          } as unknown as AuthUser,
          session: null,
        };
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        if (isRateLimitAuthError(signInError)) {
          throw new Error(
            'Your account was created. Please wait a minute, then sign in with your email and password.',
          );
        }
        throw signInError;
      }
      startAuthAutoRefresh();
      return signInData;
    })();

    try {
      return await signUpInFlight;
    } finally {
      signUpInFlight = null;
    }
  },
  async signOut() {
    if (!supabase) return;
    stopAuthAutoRefresh();
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
  async resetInternalPassword(userId: string, newPassword: string) {
    return invokeAdminUsers({
      action: 'reset_password',
      userId,
      newPassword,
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
