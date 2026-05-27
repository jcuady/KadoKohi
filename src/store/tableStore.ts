import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Table } from '../types/domain';
import { newId } from '../lib/id';
import { buildTableCode, tableQrPath } from '../lib/qr';

const SEED_TABLES: Table[] = [
  { id: 'tbl_mrk_01', branchId: 'branch_marikina', code: 'mrk-t01', label: 'Table 1', qrPayload: '/order/qr/mrk-t01', active: true },
  { id: 'tbl_mrk_02', branchId: 'branch_marikina', code: 'mrk-t02', label: 'Table 2', qrPayload: '/order/qr/mrk-t02', active: true },
  { id: 'tbl_mrk_03', branchId: 'branch_marikina', code: 'mrk-t03', label: 'Table 3', qrPayload: '/order/qr/mrk-t03', active: true },
  { id: 'tbl_mrk_04', branchId: 'branch_marikina', code: 'mrk-t04', label: 'Table 4', qrPayload: '/order/qr/mrk-t04', active: true },
];

export interface TableStore {
  tables: Table[];
  addTable: (branchId: string, label: string, branchSlug?: string) => Table;
  updateTable: (id: string, patch: Partial<Pick<Table, 'label' | 'active'>>) => void;
  removeTable: (id: string) => void;
  toggleActive: (id: string) => void;
  tablesForBranch: (branchId: string) => Table[];
  getByCode: (code: string) => Table | undefined;
  seed: () => void;
}

export const useTableStore = create<TableStore>()(
  persist(
    (set, get) => ({
      tables: SEED_TABLES,

      addTable: (branchId, label, branchSlug) => {
        const slug = branchSlug ?? branchId.replace('branch_', '');
        const tableNum = get().tables.filter((x) => x.branchId === branchId).length + 1;
        const code = buildTableCode(slug, tableNum);
        const t: Table = {
          id: newId(),
          branchId,
          code,
          label: label.trim() || `Table ${tableNum}`,
          qrPayload: tableQrPath(code),
          active: true,
        };
        set({ tables: [...get().tables, t] });
        return t;
      },

      updateTable: (id, patch) =>
        set({ tables: get().tables.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),

      removeTable: (id) => set({ tables: get().tables.filter((t) => t.id !== id) }),

      toggleActive: (id) =>
        set({ tables: get().tables.map((t) => (t.id === id ? { ...t, active: !t.active } : t)) }),

      tablesForBranch: (branchId) => get().tables.filter((t) => t.branchId === branchId),

      getByCode: (code) => get().tables.find((t) => t.code === code),

      seed: () => set({ tables: SEED_TABLES }),
    }),
    { name: 'kado-tables-v1' },
  ),
);
