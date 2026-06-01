import { supabase } from '../client';
import type { Role } from '../../../types/domain';
import { recoverStaleAuthSession } from '../authSession';

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

export const authRepo = {
  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    await recoverStaleAuthSession();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signUp(email: string, password: string, name: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    // Stale refresh tokens in localStorage cause 400 refresh errors that block signUp.
    await recoverStaleAuthSession();
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/login` : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: 'customer' },
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;
    return data;
  },
  async signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  },
  async session() {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      await recoverStaleAuthSession();
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
