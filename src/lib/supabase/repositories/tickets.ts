import { supabase } from '../client';

export const TICKET_IMAGE_BUCKET = 'kado-ticket-images';
export const TICKET_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 'bug' | 'order' | 'menu' | 'other';
export type TicketPriority = 'low' | 'normal' | 'urgent';

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'New',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const TICKET_STATUS_BADGE: Record<TicketStatus, string> = {
  open: 'bg-amber-100 text-amber-900 border-amber-200',
  in_progress: 'bg-sky-100 text-sky-900 border-sky-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  bug: 'App bug',
  order: 'Order or payment',
  menu: 'Menu or stock',
  other: 'Other',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  urgent: 'Urgent',
};

export function isTicketFinal(status: TicketStatus): boolean {
  return status === 'resolved' || status === 'closed';
}

export interface SupportTicket {
  id: string;
  createdBy: string;
  reporterName: string | null;
  reporterEmail: string | null;
  reporterRole: string;
  branchId: string | null;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  imagePath: string | null;
  adminNote: string | null;
  readAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewTicketInput {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  image?: File | null;
}

function mapRow(r: Record<string, unknown>): SupportTicket {
  return {
    id: r.id as string,
    createdBy: r.created_by as string,
    reporterName: (r.reporter_name as string) ?? null,
    reporterEmail: (r.reporter_email as string) ?? null,
    reporterRole: r.reporter_role as string,
    branchId: (r.branch_id as string) ?? null,
    title: r.title as string,
    description: r.description as string,
    category: r.category as TicketCategory,
    priority: r.priority as TicketPriority,
    status: r.status as TicketStatus,
    imagePath: (r.image_path as string) ?? null,
    adminNote: (r.admin_note as string) ?? null,
    readAt: (r.read_at as string) ?? null,
    resolvedAt: (r.resolved_at as string) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function client() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function imageExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && /^(jpe?g|png|webp|heic|heif)$/.test(fromName)) return fromName;
  return file.type.split('/')[1] || 'jpg';
}

async function removeImage(path: string): Promise<void> {
  const { error } = await client().storage.from(TICKET_IMAGE_BUCKET).remove([path]);
  if (error) throw new Error(`Could not delete the screenshot: ${error.message}`);
}

export const ticketsRepo = {
  /** RLS returns only the caller's tickets for barista/staff, every ticket for admin. */
  async list(limit = 200): Promise<SupportTicket[]> {
    const { data, error } = await client()
      .from('kk_support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },

  async countOpen(): Promise<number> {
    const { count, error } = await client()
      .from('kk_support_tickets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']);
    if (error) throw error;
    return count ?? 0;
  },

  /** Uploads the screenshot to `<profileId>/…`, then inserts the ticket; rolls the upload back on failure. */
  async create(profileId: string, input: NewTicketInput): Promise<SupportTicket> {
    let imagePath: string | null = null;
    if (input.image) {
      if (!input.image.type.startsWith('image/')) throw new Error('Screenshot must be an image file.');
      if (input.image.size > TICKET_IMAGE_MAX_BYTES) throw new Error('Screenshot must be 5 MB or smaller.');
      imagePath = `${profileId}/${crypto.randomUUID()}.${imageExtension(input.image)}`;
      const { error } = await client()
        .storage.from(TICKET_IMAGE_BUCKET)
        // Short CDN cache so a deleted screenshot stops being served soon after resolve.
        .upload(imagePath, input.image, { contentType: input.image.type, upsert: false, cacheControl: '60' });
      if (error) throw new Error(`Screenshot upload failed: ${error.message}`);
    }
    const { data, error } = await client()
      .from('kk_support_tickets')
      .insert({
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        priority: input.priority,
        image_path: imagePath,
      })
      .select('*')
      .single();
    if (error) {
      if (imagePath) await removeImage(imagePath).catch(() => undefined);
      throw error;
    }
    return mapRow(data);
  },

  async imageUrl(path: string): Promise<string | null> {
    const { data, error } = await client().storage.from(TICKET_IMAGE_BUCKET).createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  },

  /** Admin. Resolved/closed deletes the screenshot object first; the DB trigger then clears image_path. */
  async update(
    ticket: SupportTicket,
    patch: { status?: TicketStatus; adminNote?: string | null; markRead?: boolean },
  ): Promise<SupportTicket> {
    const nextStatus = patch.status ?? ticket.status;
    if (ticket.imagePath && isTicketFinal(nextStatus)) {
      await removeImage(ticket.imagePath);
    }
    const row: Record<string, unknown> = {};
    if (patch.status) row.status = patch.status;
    if (patch.adminNote !== undefined) row.admin_note = patch.adminNote?.trim() || null;
    if (patch.markRead && !ticket.readAt) row.read_at = new Date().toISOString();
    const { data, error } = await client()
      .from('kk_support_tickets')
      .update(row)
      .eq('id', ticket.id)
      .select('*')
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  /** Admin. */
  async remove(ticket: SupportTicket): Promise<void> {
    if (ticket.imagePath) await removeImage(ticket.imagePath);
    const { error } = await client().from('kk_support_tickets').delete().eq('id', ticket.id);
    if (error) throw error;
  },

  /** Realtime ticket changes (RLS-filtered). Returns an unsubscribe function. */
  subscribe(onChange: () => void): () => void {
    if (!supabase) return () => undefined;
    const sb = supabase;
    const channel = sb
      .channel(`kk-support-tickets-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kk_support_tickets' }, onChange)
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  },
};
