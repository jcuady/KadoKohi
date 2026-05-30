import { create } from 'zustand';
import { auditRepo, type AuditLogRow } from '../lib/supabase/repositories/audit';

export interface AuditStore {
  logs: AuditLogRow[];
  loading: boolean;
  error: string | null;
  refresh: (limit?: number) => Promise<void>;
}

export const useAuditStore = create<AuditStore>((set) => ({
  logs: [],
  loading: false,
  error: null,
  refresh: async (limit = 300) => {
    set({ loading: true, error: null });
    try {
      const logs = await auditRepo.fetch(limit);
      set({ logs, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Failed to load audit log.' });
    }
  },
}));
