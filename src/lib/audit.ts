import { auditRepo } from './supabase/repositories/audit';
import { useAuthStore } from '../store/authStore';

/**
 * Record a staff/admin/customer action to the audit trail, attributed to the
 * current authenticated session. Safe to call from any store action — failures
 * are swallowed so the primary operation is never blocked.
 */
export function logAudit(input: {
  action: string;
  entityType: string;
  entityId?: string | null;
  branchId?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown>;
}): void {
  const actor = useAuthStore.getState().user;
  if (!actor) return;
  void auditRepo.log({
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    branchId: input.branchId ?? actor.branchId ?? null,
    summary: input.summary ?? null,
    metadata: input.metadata,
  });
}
