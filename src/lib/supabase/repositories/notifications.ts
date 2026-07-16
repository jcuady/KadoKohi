import { supabase } from '../client';

export type CustomerNotificationKind = 'order' | 'payment' | 'marketing' | 'system';

export type CustomerNotification = {
  id: string;
  customerId: string;
  kind: CustomerNotificationKind;
  title: string;
  body: string;
  url: string | null;
  tag: string | null;
  readAt: string | null;
  createdAt: string;
};

function mapRow(row: Record<string, unknown>): CustomerNotification {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    kind: (row.kind as CustomerNotificationKind) ?? 'system',
    title: String(row.title ?? ''),
    body: String(row.body ?? ''),
    url: row.url != null ? String(row.url) : null,
    tag: row.tag != null ? String(row.tag) : null,
    readAt: row.read_at != null ? String(row.read_at) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export const notificationsRepo = {
  async listForCustomer(customerId: string, limit = 40): Promise<CustomerNotification[]> {
    if (!supabase || !customerId) return [];
    const { data, error } = await supabase
      .from('kk_customer_notifications')
      .select('id, customer_id, kind, title, body, url, tag, read_at, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  },

  async markRead(id: string): Promise<void> {
    if (!supabase) return;
    await supabase
      .from('kk_customer_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .is('read_at', null);
  },

  async markAllRead(customerId: string): Promise<void> {
    if (!supabase || !customerId) return;
    await supabase
      .from('kk_customer_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('customer_id', customerId)
      .is('read_at', null);
  },
};
