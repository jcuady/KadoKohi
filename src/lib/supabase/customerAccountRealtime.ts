import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './client';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { useEventCalendarStore } from '../../store/eventCalendarStore';
import { cancelDeferredRealtimeStop, deferRealtimeStop } from './realtimeLifecycle';

let channel: RealtimeChannel | null = null;

function debounce(fn: () => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

const refreshBookings = debounce(() => void useBoothBookingStore.getState().hydrateFromRemote(), 300);

function invalidateCalendarFromPayload(payload: { new?: Record<string, unknown>; old?: Record<string, unknown> }) {
  const cal = useEventCalendarStore.getState();
  for (const row of [payload.new, payload.old]) {
    const eventDate = row?.event_date;
    if (typeof eventDate === 'string') cal.invalidateForDateKey(eventDate);
  }
}

const refreshOrders = debounce(() => {
  const user = useAuthStore.getState().user;
  if (user?.role === 'customer' && user.id) {
    void useOrderStore.getState().hydrateForCustomer(user.id);
  }
}, 300);

/** Live booth booking + order sync for signed-in customers (RLS-scoped). */
export function startCustomerAccountRealtime(): void {
  if (!supabase || channel) return;
  cancelDeferredRealtimeStop();

  channel = supabase
    .channel('kk_customer_account_live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'kk_booth_bookings' },
      (payload) => {
        refreshBookings();
        invalidateCalendarFromPayload(payload as { new?: Record<string, unknown>; old?: Record<string, unknown> });
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'kk_orders' },
      () => refreshOrders(),
    )
    .subscribe();
}

export function stopCustomerAccountRealtime(): void {
  if (!channel || !supabase) return;
  const ch = channel;
  channel = null;
  deferRealtimeStop(() => {
    if (supabase) void supabase.removeChannel(ch);
  });
}
