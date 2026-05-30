import { supabase } from '../client';
import type { Role } from '../../../types/domain';

export const authRepo = {
  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signUp(email: string, password: string, name: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
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
    const { data } = await supabase.auth.getSession();
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
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.functions.invoke('kk-admin-users', {
      body: {
        action: 'create_user',
        ...input,
      },
    });
    if (error) throw error;
    return data;
  },
  async resetInternalPassword(userId: string, newPassword: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.functions.invoke('kk-admin-users', {
      body: {
        action: 'reset_password',
        userId,
        newPassword,
      },
    });
    if (error) throw error;
    return data;
  },
  async resetAllData(confirmPhrase: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.functions.invoke('kk-admin-users', {
      body: {
        action: 'reset_all_data',
        confirmPhrase,
      },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error as string);
    return data as {
      success: boolean;
      deleted: {
        orderItems: number;
        orders: number;
        auditLogs: number;
        pushSubscriptions: number;
        promoClaims: number;
        promoCodes: number;
        users: number;
      };
    };
  },
};
