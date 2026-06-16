import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './client';
import { useOrderStore } from '../../store/orderStore';
import { useMenuStore } from '../../store/menuStore';
import { useUserStore } from '../../store/userStore';
import { useTableStore } from '../../store/tableStore';
import { useBranchStore } from '../../store/branchStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuditStore } from '../../store/auditStore';
import { usePromoStore } from '../../store/promoStore';
import { useMerchStore } from '../../store/merchStore';
import { useEventStore } from '../../store/eventStore';
import { useEventFormStore } from '../../store/eventFormStore';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { useBoothShowcaseStore } from '../../store/boothShowcaseStore';
import { useLandingContentStore } from '../../store/landingContentStore';
import { useLoyaltyStore } from '../../store/loyaltyStore';
import { useBlogStore } from '../../store/blogStore';
import { useSectionStore } from '../../store/sectionStore';
import { useBoothCatalogStore } from '../../store/boothCatalogStore';

/** Operational tables mirrored live on admin / barista / staff surfaces. */
const OPS_TABLES = [
  'kk_orders',
  'kk_profiles',
  'kk_menu_categories',
  'kk_products',
  'kk_tables',
  'kk_branches',
  'kk_app_settings',
  'kk_audit_logs',
  'kk_promo_codes',
  'kk_merch_categories',
  'kk_merch_products',
  'kk_events',
  'kk_event_forms',
  'kk_booth_bookings',
  'kk_loyalty_rewards',
  'kk_blog_posts',
] as const;

type OpsTable = (typeof OPS_TABLES)[number];

let channel: RealtimeChannel | null = null;
let started = false;

function debounce(fn: () => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

const refresh = {
  orders: debounce(() => void useOrderStore.getState().hydrateFromRemote(), 300),
  menu: debounce(() => void useMenuStore.getState().hydrateFromRemote(), 300),
  users: debounce(() => void useUserStore.getState().hydrateFromRemote(), 300),
  tables: debounce(() => void useTableStore.getState().hydrateFromRemote(), 300),
  branches: debounce(() => void useBranchStore.getState().hydrateFromRemote(), 300),
  settings: debounce(() => {
    void useSettingsStore.getState().hydrateFromRemote();
    void useLandingContentStore.getState().hydrateFromRemote();
    void useBoothShowcaseStore.getState().hydrateFromRemote();
    void useSectionStore.getState().hydrateFromRemote();
    void useBoothCatalogStore.getState().hydrateFromRemote();
  }, 300),
  audit: debounce(() => void useAuditStore.getState().refresh(), 300),
  promos: debounce(() => void usePromoStore.getState().fetchAll(), 300),
  merch: debounce(() => void useMerchStore.getState().hydrateFromRemote(), 300),
  events: debounce(() => void useEventStore.getState().hydrateFromRemote(), 300),
  eventForms: debounce(() => void useEventFormStore.getState().hydrateFromRemote(), 300),
  bookings: debounce(() => void useBoothBookingStore.getState().hydrateFromRemote(), 300),
  landing: debounce(() => void useLandingContentStore.getState().hydrateFromRemote(), 300),
  loyalty: debounce(() => void useLoyaltyStore.getState().hydrateFromRemote(), 300),
  blog: debounce(() => void useBlogStore.getState().hydrateFromRemote(), 300),
};

function onTableChange(table: OpsTable) {
  switch (table) {
    case 'kk_orders':
      refresh.orders();
      break;
    case 'kk_menu_categories':
    case 'kk_products':
      refresh.menu();
      break;
    case 'kk_profiles':
      refresh.users();
      break;
    case 'kk_tables':
      refresh.tables();
      break;
    case 'kk_branches':
      refresh.branches();
      break;
    case 'kk_app_settings':
      refresh.settings();
      refresh.landing();
      break;
    case 'kk_audit_logs':
      refresh.audit();
      break;
    case 'kk_promo_codes':
      refresh.promos();
      break;
    case 'kk_merch_categories':
    case 'kk_merch_products':
      refresh.merch();
      break;
    case 'kk_events':
      refresh.events();
      break;
    case 'kk_event_forms':
      refresh.eventForms();
      break;
    case 'kk_booth_bookings':
      refresh.bookings();
      break;
    case 'kk_loyalty_rewards':
      refresh.loyalty();
      break;
    case 'kk_blog_posts':
      refresh.blog();
      break;
    default:
      break;
  }
}

/** Pull the latest operational data (call after auth is ready). */
export async function refreshOperationsData(): Promise<void> {
  await Promise.all([
    useOrderStore.getState().hydrateFromRemote(),
    useMenuStore.getState().hydrateFromRemote(),
    useUserStore.getState().hydrateFromRemote(),
    useTableStore.getState().hydrateFromRemote(),
    useBranchStore.getState().hydrateFromRemote(),
    useSettingsStore.getState().hydrateFromRemote(),
    useAuditStore.getState().refresh(),
    usePromoStore.getState().fetchAll(),
    useMerchStore.getState().hydrateFromRemote(),
    useEventStore.getState().hydrateFromRemote(),
    useEventFormStore.getState().hydrateFromRemote(),
    useBoothBookingStore.getState().hydrateFromRemote(),
    useLandingContentStore.getState().hydrateFromRemote(),
    useBoothShowcaseStore.getState().hydrateFromRemote(),
    useSectionStore.getState().hydrateFromRemote(),
    useBoothCatalogStore.getState().hydrateFromRemote(),
    useBlogStore.getState().hydrateFromRemote(),
  ]);
}

/**
 * Subscribe to Postgres changes for admin / barista / staff dashboards.
 * Idempotent — safe to call from layout mount and after sign-in.
 */
export function startOperationsRealtime(): void {
  if (!supabase || started) return;
  started = true;

  channel = supabase.channel('kk_ops_live');
  for (const table of OPS_TABLES) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => onTableChange(table),
    );
  }
  channel.subscribe();
}

export function stopOperationsRealtime(): void {
  if (channel && supabase) {
    void supabase.removeChannel(channel);
  }
  channel = null;
  started = false;
}

export function isOperationsRealtimeActive(): boolean {
  return started;
}
