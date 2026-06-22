import { supabase } from '../client';
import { clerkSignOut } from '../../clerk/tokenBridge';
import type { Role } from '../../../types/domain';

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

async function invokeInternalLogin<T = unknown>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('kk-internal-login', { body });
  if (error) throw error;
  parseEdgePayload(data);
  return data as T;
}

export const authRepo = {
  async signInInternal(input: {
    email: string;
    password: string;
    expectedRole: Extract<Role, 'admin' | 'barista' | 'staff'>;
  }) {
    return invokeInternalLogin<{ ticket: string }>(input);
  },
  async signOut() {
    await clerkSignOut();
  },
  async createInternalUser(input: {
    email: string;
    password: string;
    name: string;
    role: Extract<Role, 'admin' | 'barista' | 'staff' | 'customer'>;
    branchId?: string;
  }) {
    return invokeAdminUsers<{ user?: { id: string; clerkUserId?: string } }>({
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
