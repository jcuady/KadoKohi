import { supabase } from '../client';

export interface AuditLogInput {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  branchId?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRow {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  branchId: string | null;
  summary: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

function mapRow(r: Record<string, unknown>): AuditLogRow {
  return {
    id: r.id as string,
    actorId: (r.actor_id as string) ?? null,
    actorEmail: (r.actor_email as string) ?? null,
    actorRole: (r.actor_role as string) ?? null,
    action: r.action as string,
    entityType: r.entity_type as string,
    entityId: (r.entity_id as string) ?? null,
    branchId: (r.branch_id as string) ?? null,
    summary: (r.summary as string) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: r.created_at as string,
  };
}

export const auditRepo = {
  /** Insert an audit entry. Best-effort: never throws into the calling flow. */
  async log(input: AuditLogInput): Promise<void> {
    if (!supabase) return;
    if (!input.actorId) return; // RLS requires actor_id = auth.uid()
    try {
      await supabase.from('kk_audit_logs').insert({
        actor_id: input.actorId,
        actor_email: input.actorEmail ?? null,
        actor_role: input.actorRole ?? null,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        branch_id: input.branchId ?? null,
        summary: input.summary ?? null,
        metadata: input.metadata ?? {},
      });
    } catch {
      // Audit logging must never break the primary action.
    }
  },

  async fetch(limit = 200): Promise<AuditLogRow[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('kk_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },
};
