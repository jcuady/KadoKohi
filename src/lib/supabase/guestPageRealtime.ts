import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './client';
import { useMenuStore } from '../../store/menuStore';
import { useTableStore } from '../../store/tableStore';
import { useBranchStore } from '../../store/branchStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useBlogStore } from '../../store/blogStore';
import { useEventStore } from '../../store/eventStore';
import { useLandingContentStore } from '../../store/landingContentStore';
import { useBoothShowcaseStore } from '../../store/boothShowcaseStore';
import { useMatchaShowcaseStore } from '../../store/matchaShowcaseStore';
import { useBoothCatalogStore } from '../../store/boothCatalogStore';
import { useCareersStore } from '../../store/careersStore';
import { usePastriesContentStore } from '../../store/pastriesContentStore';
import { cancelDeferredRealtimeStop, deferRealtimeStop } from './realtimeLifecycle';
import {
  isBrowserOnline,
  isSupabaseCircuitOpen,
  recordSupabaseFailure,
  recordSupabaseSuccess,
} from './networkGuard';

const GUEST_TABLES = [
  'kk_menu_categories',
  'kk_products',
  'kk_tables',
  'kk_branches',
  'kk_app_settings',
  'kk_blog_posts',
  'kk_events',
] as const;

type GuestTable = (typeof GUEST_TABLES)[number];

/** Paths where live menu/branch/table sync is worth a Realtime channel. */
const GUEST_REALTIME_PATH_RE =
  /^\/(menu|merch|order|events|book\/|blog|pastries)(\/|$)/;

export function pathUsesGuestRealtime(pathname: string): boolean {
  return GUEST_REALTIME_PATH_RE.test(pathname);
}

let channel: RealtimeChannel | null = null;
let refCount = 0;
let connecting = false;

function disposeGuestChannel(): void {
  if (!supabase) return;
  if (channel) {
    const ch = channel;
    channel = null;
    void supabase.removeChannel(ch);
  }
  // StrictMode: stop clears our ref before deferred removeChannel — sweep stale topic.
  for (const ch of supabase.getChannels()) {
    if (ch.topic === 'realtime:kk_guest_pages_live') {
      void supabase.removeChannel(ch);
    }
  }
}

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
  settings: debounce(() => {
    void useSettingsStore.getState().hydrateFromRemote();
    void useLandingContentStore.getState().hydrateFromRemote();
    void useBoothShowcaseStore.getState().hydrateFromRemote();
    void useMatchaShowcaseStore.getState().hydrateFromRemote();
    void useBoothCatalogStore.getState().hydrateFromRemote();
    void useCareersStore.getState().hydrateFromRemote();
    void usePastriesContentStore.getState().hydrateFromRemote();
  }, 300),
  blog: debounce(() => void useBlogStore.getState().hydrateFromRemote(), 300),
  events: debounce(() => void useEventStore.getState().hydrateFromRemote(), 300),
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
      refresh.events();
      break;
    case 'kk_app_settings':
      refresh.settings();
      break;
    case 'kk_blog_posts':
      refresh.blog();
      break;
    case 'kk_events':
      refresh.events();
      break;
    default:
      break;
  }
}

/** Live menu / branch / table sync for guest ordering surfaces. */
function connectGuestPageRealtime(): void {
  if (!supabase || channel || connecting) return;
  if (!isBrowserOnline() || isSupabaseCircuitOpen()) return;

  connecting = true;
  try {
    disposeGuestChannel();

    const ch = supabase.channel('kk_guest_pages_live');
    channel = ch;
    for (const table of GUEST_TABLES) {
      ch.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => onTableChange(table),
      );
    }
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') recordSupabaseSuccess();
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        recordSupabaseFailure();
        disposeGuestChannel();
      }
    });
  } catch (err) {
    console.error('connectGuestPageRealtime failed', err);
    disposeGuestChannel();
  } finally {
    connecting = false;
  }
}

export function startGuestPageRealtime(): void {
  if (!supabase) return;
  cancelDeferredRealtimeStop();
  refCount += 1;
  connectGuestPageRealtime();
}

export function restartGuestPageRealtimeIfWanted(): void {
  if (refCount > 0) connectGuestPageRealtime();
}

export function stopGuestPageRealtime(opts?: { keepWanted?: boolean }): void {
  if (!opts?.keepWanted) refCount = Math.max(0, refCount - 1);
  if (opts?.keepWanted || refCount === 0) {
    connecting = false;
    const ch = channel;
    channel = null;
    if (!ch || !supabase) return;
    deferRealtimeStop(() => {
      void supabase.removeChannel(ch);
    });
  }
}
