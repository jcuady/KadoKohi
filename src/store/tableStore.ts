import { create } from 'zustand';
import type { Table } from '../types/domain';
import { newId } from '../lib/id';
import { buildTableCode, tableQrUrl } from '../lib/qr';
import { PRODUCTION_SITE_URL } from '../lib/siteUrl';

function normalizeTableQrPayload(t: Table): Table {
  if (t.qrPayload.startsWith('http://') || t.qrPayload.startsWith('https://')) return t;
  if (t.qrPayload.startsWith('/order/')) {
    return { ...t, qrPayload: `${PRODUCTION_SITE_URL}${t.qrPayload}` };
  }
  return { ...t, qrPayload: tableQrUrl(t.code) };
}
import { orderingRepo } from '../lib/supabase/repositories/ordering';

const SEED_TABLES: Table[] = [
  { id: 'tbl_mrk_01', branchId: 'branch_marikina', code: 'mrk-t01', label: 'Table 1', qrPayload: 'https://www.kadokohi.com/order/qr/mrk-t01', active: true },
  { id: 'tbl_mrk_02', branchId: 'branch_marikina', code: 'mrk-t02', label: 'Table 2', qrPayload: 'https://www.kadokohi.com/order/qr/mrk-t02', active: true },
  { id: 'tbl_mrk_03', branchId: 'branch_marikina', code: 'mrk-t03', label: 'Table 3', qrPayload: 'https://www.kadokohi.com/order/qr/mrk-t03', active: true },
  { id: 'tbl_mrk_04', branchId: 'branch_marikina', code: 'mrk-t04', label: 'Table 4', qrPayload: 'https://www.kadokohi.com/order/qr/mrk-t04', active: true },
];

export interface TableStore {
  tables: Table[];
  /** True once the first remote fetch has completed (or failed). */
  hydrated: boolean;
  hydrateFromRemote: () => Promise<void>;
  addTable: (branchId: string, label: string, branchSlug?: string) => Table;
  updateTable: (id: string, patch: Partial<Pick<Table, 'label' | 'active'>>) => void;
  removeTable: (id: string) => void;
  toggleActive: (id: string) => void;
  tablesForBranch: (branchId: string) => Table[];
  getByCode: (code: string) => Table | undefined;
  seed: () => void;
}

export const useTableStore = create<TableStore>()((set, get) => ({
      tables: SEED_TABLES,
      hydrated: false,
      hydrateFromRemote: async () => {
        try {
          const tables = (await orderingRepo.fetchTables()).map((t) => {
            const normalized = normalizeTableQrPayload(t);
            if (normalized.qrPayload !== t.qrPayload) {
              void orderingRepo.upsertTable(normalized);
            }
            return normalized;
          });
          set({ tables, hydrated: true });
        } catch {
          // Keep seed fallback when remote fetch fails but still mark as resolved.
          set({ hydrated: true });
        }
      },

      addTable: (branchId, label, branchSlug) => {
        const slug = branchSlug ?? branchId.replace('branch_', '');
        const tableNum = get().tables.filter((x) => x.branchId === branchId).length + 1;
        const code = buildTableCode(slug, tableNum);
        const t: Table = {
          id: newId(),
          branchId,
          code,
          label: label.trim() || `Table ${tableNum}`,
          qrPayload: tableQrUrl(code),
          active: true,
        };
        set({ tables: [...get().tables, t] });
        void orderingRepo.upsertTable(t);
        return t;
      },

      updateTable: (id, patch) =>
        set({
          tables: get().tables.map((t) => {
            if (t.id !== id) return t;
            const updated = { ...t, ...patch };
            void orderingRepo.upsertTable(updated);
            return updated;
          }),
        }),

      removeTable: (id) => {
        set({ tables: get().tables.filter((t) => t.id !== id) });
        void orderingRepo.deleteTable(id);
      },

      toggleActive: (id) =>
        set({
          tables: get().tables.map((t) => {
            if (t.id !== id) return t;
            const updated = { ...t, active: !t.active };
            void orderingRepo.upsertTable(updated);
            return updated;
          }),
        }),

      tablesForBranch: (branchId) => get().tables.filter((t) => t.branchId === branchId),

      getByCode: (code) => get().tables.find((t) => t.code === code),

      seed: () => set({ tables: SEED_TABLES }),
}));
