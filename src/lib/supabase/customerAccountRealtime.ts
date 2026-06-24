import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './client';
import { useBoothBookingStore } from '../../store/boothBookingStore';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';

let channel: RealtimeChannel | null = null;

function debounce(fn: () => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

const refreshBookings = debounce(() => void useBoothBookingStore.getState().hydrateFromRemote(), 300);

const refreshOrders = debounce(() => {
  const user = useAuthStore.getState().user;
  if (user?.role === 'customer' && user.id) {
    void useOrderStore.getState().hydrateForCustomer(user.id);
  }
}, 300);

/** Live booth booking + order sync for signed-in customers (RLS-scoped). */
export function startCustomerAccountRealtime(): void {
  if (!supabase || channel) return;

  channel = supabase
    .channel('kk_customer_account_live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'kk_booth_bookings' },
      () => refreshBookings(),
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
  void supabase.removeChannel(channel);
  channel = null;
}
