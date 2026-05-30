import { supabase } from '../client';

export interface PushTarget {
  userId?: string;
  branchId?: string;
  roles?: string[];
}

export const pushRepo = {
  async saveSubscription(input: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    role?: string | null;
    branchId?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('kk_push_subscriptions').upsert(
      {
        user_id: input.userId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        role: input.role ?? null,
        branch_id: input.branchId ?? null,
        user_agent: input.userAgent ?? null,
      },
      { onConflict: 'endpoint' },
    );
    if (error) throw error;
  },

  async removeSubscription(endpoint: string): Promise<void> {
    if (!supabase) return;
    await supabase.from('kk_push_subscriptions').delete().eq('endpoint', endpoint);
  },

  /** Invoke the kk-send-push edge function to deliver a notification. Best-effort. */
  async send(input: {
    targets: PushTarget[];
    title: string;
    body: string;
    url?: string;
    tag?: string;
  }): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.functions.invoke('kk-send-push', { body: input });
    } catch {
      // Delivery is best-effort; never break the order flow.
    }
  },
};
