import { create } from 'zustand';
import type { Table } from '../types/domain';
import { newId } from '../lib/id';
import { pickUniqueTableCode, tableQrUrl } from '../lib/qr';
import { PRODUCTION_SITE_URL } from '../lib/siteUrl';
import { orderingRepo } from '../lib/supabase/repositories/ordering';

function normalizeTableQrPayload(t: Table): Table {
  if (t.qrPayload.startsWith('http://') || t.qrPayload.startsWith('https://')) return t;
  if (t.qrPayload.startsWith('/order/')) {
    return { ...t, qrPayload: `${PRODUCTION_SITE_URL}${t.qrPayload}` };
  }
  return { ...t, qrPayload: tableQrUrl(t.code) };
}

function nextTableNumberForBranch(tables: Table[], branchId: string, branchSlug: string): number {
  const prefix = branchSlug.slice(0, 3).toLowerCase();
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escaped}-t(\\d+)$`, 'i');
  let max = 0;
  for (const t of tables) {
    if (t.branchId !== branchId) continue;
    const match = t.code.match(pattern);
    if (match) max = Math.max(max, Number.parseInt(match[1], 10));
  }
  return max + 1;
}

/** Skip realtime hydrate briefly after a local delete to avoid stale refetch races. */
let tablesHydratePausedUntil = 0;

function pauseTablesHydrate(ms = 3000): void {
  tablesHydratePausedUntil = Date.now() + ms;
}

export interface TableStore {
  tables: Table[];
  /** True once the first remote fetch has completed (or failed). */
  hydrated: boolean;
  hydrateFromRemote: () => Promise<void>;
  addTable: (branchId: string, label: string, branchSlug?: string) => Promise<Table>;
  updateTable: (id: string, patch: Partial<Pick<Table, 'label' | 'active'>>) => Promise<void>;
  removeTable: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  tablesForBranch: (branchId: string) => Table[];
  getByCode: (code: string) => Table | undefined;
  seed: () => void;
}

export const useTableStore = create<TableStore>()((set, get) => ({
  tables: [],
  hydrated: false,
  hydrateFromRemote: async () => {
    if (Date.now() < tablesHydratePausedUntil) return;

    try {
      const tables = (await orderingRepo.fetchTables()).map((t) => {
        const normalized = normalizeTableQrPayload(t);
        if (normalized.qrPayload !== t.qrPayload) {
          void orderingRepo.upsertTable(normalized).catch(() => undefined);
        }
        return normalized;
      });
      set({ tables, hydrated: true });
    } catch {
      set({ tables: [], hydrated: true });
    }
  },

  addTable: async (branchId, label, branchSlug) => {
    const slug = branchSlug ?? branchId.replace('branch_', '');
    const tableNum = nextTableNumberForBranch(get().tables, branchId, slug);
    const code = pickUniqueTableCode(
      slug,
      tableNum,
      get().tables.map((t) => t.code),
    );
    const t: Table = {
      id: newId(),
      branchId,
      code,
      label: label.trim() || `Table ${tableNum}`,
      qrPayload: tableQrUrl(code),
      active: true,
    };
    await orderingRepo.upsertTable(t);
    pauseTablesHydrate(1500);
    set({ tables: [...get().tables, t] });
    return t;
  },

  updateTable: async (id, patch) => {
    const current = get().tables.find((t) => t.id === id);
    if (!current) return;
    const updated = { ...current, ...patch };
    await orderingRepo.upsertTable(updated);
    set({
      tables: get().tables.map((t) => (t.id === id ? updated : t)),
    });
  },

  removeTable: async (id) => {
    await orderingRepo.deleteTable(id);
    pauseTablesHydrate(4000);
    set({ tables: get().tables.filter((t) => t.id !== id) });
  },

  toggleActive: async (id) => {
    const current = get().tables.find((t) => t.id === id);
    if (!current) return;
    const updated = { ...current, active: !current.active };
    await orderingRepo.upsertTable(updated);
    set({
      tables: get().tables.map((t) => (t.id === id ? updated : t)),
    });
  },

  tablesForBranch: (branchId) => get().tables.filter((t) => t.branchId === branchId),

  getByCode: (code) => {
    const needle = code.trim().toLowerCase();
    if (!needle) return undefined;
    return get().tables.find((t) => t.code.trim().toLowerCase() === needle);
  },

  seed: () => set({ tables: [], hydrated: true }),
}));
