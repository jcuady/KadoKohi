import { useBlogStore } from '../store/blogStore';
import { useBoothBookingStore } from '../store/boothBookingStore';
import { useBoothCatalogStore } from '../store/boothCatalogStore';
import { useBoothShowcaseStore } from '../store/boothShowcaseStore';
import { useBranchStore } from '../store/branchStore';
import { useCareersStore } from '../store/careersStore';
import { usePastriesContentStore } from '../store/pastriesContentStore';
import { useEventFormStore } from '../store/eventFormStore';
import { useEventStore } from '../store/eventStore';
import { useLandingContentStore } from '../store/landingContentStore';
import { useLoyaltyStore } from '../store/loyaltyStore';
import { useMatchaShowcaseStore } from '../store/matchaShowcaseStore';
import { useMenuStore } from '../store/menuStore';
import { useMerchStore } from '../store/merchStore';
import { useOrderStore } from '../store/orderStore';
import { useSettingsStore } from '../store/settingsStore';
import { useVoucherStore } from '../store/voucherStore';
import { isProfileUuid } from './id';
import {
  refreshOperationsData,
  startOperationsRealtime,
} from './supabase/operationsRealtime';
import {
  startCustomerAccountRealtime,
  stopCustomerAccountRealtime,
} from './supabase/customerAccountRealtime';

/** ponytail: keep completed promises — StrictMode remounts must not re-fetch. */
const once = new Map<string, Promise<void>>();

function runOnce(key: string, fn: () => Promise<void>): Promise<void> {
  const existing = once.get(key);
  if (existing) return existing;
  const promise = fn();
  once.set(key, promise);
  return promise;
}

export function hydrateGlobalMinimal(): Promise<void> {
  return runOnce('global-minimal', async () => {
    await useSettingsStore.getState().hydrateFromRemote();
  });
}

export function hydratePublicShell(): Promise<void> {
  return runOnce('public-shell', async () => {
    // Critical for above-the-fold copy (hero/CMS). Catalog waits until after first paint.
    // Settings + landing share one kk_app_settings select(*) via orderingRepo cache.
    await Promise.all([
      useSettingsStore.getState().hydrateFromRemote(),
      useLandingContentStore.getState().hydrateFromRemote(),
    ]);
    void runOnce('public-shell-deferred', async () => {
      await Promise.all([
        useBranchStore.getState().hydrateFromRemote(),
        useMenuStore.getState().hydrateFromRemote(),
        useEventStore.getState().hydrateFromRemote(),
      ]);
    });
  });
}

export function hydrateMerch(): Promise<void> {
  return runOnce('merch', async () => {
    await useMerchStore.getState().hydrateFromRemote();
  });
}

export function hydrateBlog(): Promise<void> {
  return runOnce('blog', async () => {
    await useBlogStore.getState().hydrateFromRemote();
  });
}

export function hydrateCareers(): Promise<void> {
  return runOnce('careers', async () => {
    await useCareersStore.getState().hydrateFromRemote();
  });
}

export function hydratePastries(): Promise<void> {
  return runOnce('pastries', async () => {
    await usePastriesContentStore.getState().hydrateFromRemote();
  });
}

export function hydrateEvents(): Promise<void> {
  return runOnce('events', async () => {
    await Promise.all([
      useEventStore.getState().hydrateFromRemote(),
      useEventFormStore.getState().hydrateFromRemote(),
    ]);
  });
}

export function hydrateBookingCoffee(): Promise<void> {
  return runOnce('booking-coffee', async () => {
    await Promise.all([
      useBoothShowcaseStore.getState().hydrateFromRemote(),
      useBoothCatalogStore.getState().hydrateFromRemote(),
    ]);
  });
}

export function hydrateBookingMatcha(): Promise<void> {
  return runOnce('booking-matcha', async () => {
    await Promise.all([
      useMatchaShowcaseStore.getState().hydrateFromRemote(),
      useBoothCatalogStore.getState().hydrateFromRemote(),
    ]);
  });
}

export function hydrateCustomerAccount(customerId: string): Promise<void> {
  if (!isProfileUuid(customerId)) {
    return Promise.resolve();
  }
  return runOnce(`customer-${customerId}`, async () => {
    startCustomerAccountRealtime();
    await Promise.all([
      useOrderStore.getState().hydrateForCustomer(customerId),
      useLoyaltyStore.getState().hydrateFromRemote(),
      useVoucherStore.getState().hydrateForCustomer(customerId),
      useBoothBookingStore.getState().hydrateFromRemote(),
    ]);
  });
}

/** Admin / barista / staff — full ops data + realtime channel. */
export function hydrateOpsPortal(): Promise<void> {
  return runOnce('ops-portal', async () => {
    startOperationsRealtime();
    await refreshOperationsData();
  });
}

/** Route-aware public bundles (call from PublicLayout on pathname change). */
export function hydrateForPublicPath(pathname: string): void {
  if (pathname.startsWith('/merch')) void hydrateMerch();
  if (pathname.startsWith('/features') || pathname.startsWith('/blog')) void hydrateBlog();
  if (pathname === '/careers') void hydrateCareers();
  if (pathname.startsWith('/pastries')) void hydratePastries();
  if (pathname.startsWith('/events')) void hydrateEvents();
  if (pathname.startsWith('/book/coffee-cart') || pathname === '/book/booth') void hydrateBookingCoffee();
  if (pathname.startsWith('/book/matcha-bar')) void hydrateBookingMatcha();
}
