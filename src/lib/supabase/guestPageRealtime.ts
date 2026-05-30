import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './client';
import { useMenuStore } from '../../store/menuStore';
import { useTableStore } from '../../store/tableStore';
import { useBranchStore } from '../../store/branchStore';
import { useSettingsStore } from '../../store/settingsStore';

const GUEST_TABLES = [
  'kk_menu_categories',
  'kk_products',
  'kk_tables',
  'kk_branches',
  'kk_app_settings',
] as const;

type GuestTable = (typeof GUEST_TABLES)[number];

let channel: RealtimeChannel | null = null;
let refCount = 0;

function debounce(fn: () => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

const refresh = {
  menu: debounce(() => void useMenuStore.getState().hydrateFromRemote(), 300),
  tables: debounce(() => void useTableStore.getState().hydrateFromRemote(), 300),
  branches: debounce(() => void useBranchStore.getState().hydrateFromRemote(), 300),
  settings: debounce(() => void useSettingsStore.getState().hydrateFromRemote(), 300),
};

function onTableChange(table: GuestTable) {
  switch (table) {
    case 'kk_menu_categories':
    case 'kk_products':
      refresh.menu();
      break;
    case 'kk_tables':
      refresh.tables();
      break;
    case 'kk_branches':
      refresh.branches();
      break;
    case 'kk_app_settings':
      refresh.settings();
      break;
    default:
      break;
  }
}

/** Live menu / branch / table sync for guest QR and takeout pages. */
export function startGuestPageRealtime(): void {
  if (!supabase) return;
  refCount += 1;
  if (channel) return;

  channel = supabase.channel('kk_guest_pages_live');
  for (const table of GUEST_TABLES) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => onTableChange(table),
    );
  }
  channel.subscribe();
}

export function stopGuestPageRealtime(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0 || !channel || !supabase) return;
  void supabase.removeChannel(channel);
  channel = null;
}
