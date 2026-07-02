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
import { useEventCalendarStore } from '../../store/eventCalendarStore';
import { useBoothShowcaseStore } from '../../store/boothShowcaseStore';
import { useMatchaShowcaseStore } from '../../store/matchaShowcaseStore';
import { useLandingContentStore } from '../../store/landingContentStore';
import { useLoyaltyStore } from '../../store/loyaltyStore';
import { useBlogStore } from '../../store/blogStore';
import { useBoothCatalogStore } from '../../store/boothCatalogStore';
import { useCareersStore } from '../../store/careersStore';
import { usePastriesContentStore } from '../../store/pastriesContentStore';
import { useAuthStore } from '../../store/authStore';
import { orderScopeForUser } from '../orderFetchScope';
import { cancelDeferredRealtimeStop, deferRealtimeStop } from './realtimeLifecycle';

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
  orders: debounce(() => {
    const user = useAuthStore.getState().user;
    const adminScope = useOrderStore.getState().adminFetchScope ?? undefined;
    const scope = orderScopeForUser(user, adminScope);
    if (!scope) return;
    void useOrderStore.getState().refreshScopedForSession(scope);
  }, 300),
  menu: debounce(() => void useMenuStore.getState().hydrateFromRemote(), 300),
  users: debounce(() => void useUserStore.getState().hydrateFromRemote(), 300),
  tables: debounce(() => void useTableStore.getState().hydrateFromRemote(), 300),
  branches: debounce(() => void useBranchStore.getState().hydrateFromRemote(), 300),
  settings: debounce(() => {
    void useSettingsStore.getState().hydrateFromRemote();
  }, 300),
  settingsCms: debounce(() => {
    void useLandingContentStore.getState().hydrateFromRemote();
    void useBoothShowcaseStore.getState().hydrateFromRemote();
    void useMatchaShowcaseStore.getState().hydrateFromRemote();
    void useBoothCatalogStore.getState().hydrateFromRemote();
    void useCareersStore.getState().hydrateFromRemote();
    void usePastriesContentStore.getState().hydrateFromRemote();
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

function onTableChange(
  table: OpsTable,
  payload?: { new?: Record<string, unknown>; old?: Record<string, unknown> },
) {
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
      refresh.settingsCms();
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
      if (payload) {
        const cal = useEventCalendarStore.getState();
        for (const row of [payload.new, payload.old]) {
          const eventDate = row?.event_date;
          if (typeof eventDate === 'string') cal.invalidateForDateKey(eventDate);
        }
      }
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
  const user = useAuthStore.getState().user;
  const adminScope = useOrderStore.getState().adminFetchScope ?? undefined;
  const orderScope = orderScopeForUser(user, adminScope);
  const orderHydrate = orderScope
    ? useOrderStore.getState().hydrateFromRemote(orderScope)
    : useOrderStore.getState().hydrateFromRemote({ limit: 0 });

  const tasks: Promise<unknown>[] = [
    orderHydrate,
    useMenuStore.getState().hydrateFromRemote(),
    useUserStore.getState().hydrateFromRemote(),
    useTableStore.getState().hydrateFromRemote(),
    useBranchStore.getState().hydrateFromRemote(),
    useSettingsStore.getState().hydrateFromRemote(),
    useMerchStore.getState().hydrateFromRemote(),
    useEventStore.getState().hydrateFromRemote(),
    useEventFormStore.getState().hydrateFromRemote(),
    useBoothBookingStore.getState().hydrateFromRemote(),
    useLandingContentStore.getState().hydrateFromRemote(),
    useBoothShowcaseStore.getState().hydrateFromRemote(),
    useMatchaShowcaseStore.getState().hydrateFromRemote(),
    useCareersStore.getState().hydrateFromRemote(),
    usePastriesContentStore.getState().hydrateFromRemote(),
    useBoothCatalogStore.getState().hydrateFromRemote(),
    useBlogStore.getState().hydrateFromRemote(),
    useLoyaltyStore.getState().hydrateFromRemote(),
  ];

  if (user?.role === 'admin') {
    tasks.push(useAuditStore.getState().refresh(), usePromoStore.getState().fetchAll());
  }

  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('refreshOperationsData partial failure', result.reason);
    }
  }
}

/**
 * Subscribe to Postgres changes for admin / barista / staff dashboards.
 * Idempotent — safe to call from layout mount and after sign-in.
 */
export function startOperationsRealtime(): void {
  if (!supabase || started) return;
  cancelDeferredRealtimeStop();
  started = true;

  const user = useAuthStore.getState().user;
  const ordersFilter =
    user?.role === 'barista' && user.branchId
      ? `branch_id=eq.${user.branchId}`
      : undefined;

  channel = supabase.channel('kk_ops_live');
  for (const table of OPS_TABLES) {
    const filter = table === 'kk_orders' ? ordersFilter : undefined;
    channel.on(
      'postgres_changes',
      filter
        ? { event: '*', schema: 'public', table, filter }
        : { event: '*', schema: 'public', table },
      (payload) =>
        onTableChange(table, payload as { new?: Record<string, unknown>; old?: Record<string, unknown> }),
    );
  }
  channel.subscribe();
}

export function stopOperationsRealtime(): void {
  if (!started) return;
  started = false;
  deferRealtimeStop(() => {
    if (channel && supabase) {
      const ch = channel;
      channel = null;
      void supabase.removeChannel(ch);
    }
  });
}

export function isOperationsRealtimeActive(): boolean {
  return started;
}
