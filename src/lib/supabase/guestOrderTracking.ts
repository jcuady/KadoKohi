import type { RealtimeChannel } from '@supabase/supabase-js';
import type { OrderStatus, PaymentStatus } from '../../types/domain';
import { supabase } from './client';
import { orderingRepo, type TrackedOrderStatus } from './repositories/ordering';
import {
  isBrowserOnline,
  isSupabaseCircuitOpen,
  onNetworkStatusChange,
  recordSupabaseFailure,
  recordSupabaseSuccess,
} from './networkGuard';

export type GuestOrderTrackingPayload = {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  updatedAt: string;
  shortCode?: string;
};

const BASE_POLL_MS = 5000;
const MAX_POLL_MS = 30_000;
const TERMINAL: OrderStatus[] = ['completed', 'cancelled'];

function guestChannelName(orderId: string) {
  return `guest-order:${orderId}`;
}

/** Notify guest tracking pages immediately after a staff-side status change. */
export function broadcastGuestOrderUpdate(
  orderId: string,
  payload: GuestOrderTrackingPayload,
): void {
  if (!supabase || !isBrowserOnline()) return;
  const channel = supabase.channel(guestChannelName(orderId));
  channel.subscribe(async (status) => {
    if (status !== 'SUBSCRIBED') return;
    await channel.send({
      type: 'broadcast',
      event: 'status',
      payload,
    });
    void supabase!.removeChannel(channel);
  });
}

export type GuestOrderTrackingHandle = {
  /** True when the broadcast channel is subscribed. */
  isLive: () => boolean;
  stop: () => void;
};

/**
 * Live order status for guest QR / takeout pages.
 * Uses staff broadcast + kk_track_order RPC polling (no broad RLS SELECT on kk_orders).
 */
export function subscribeGuestOrderTracking(
  orderId: string,
  onUpdate: (tracked: TrackedOrderStatus) => void,
  onError?: () => void,
): GuestOrderTrackingHandle {
  if (!supabase) {
    return { isLive: () => false, stop: () => undefined };
  }

  let stopped = false;
  let live = false;
  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  let channel: RealtimeChannel | null = null;
  let pollMs = BASE_POLL_MS;
  let networkOff = !isBrowserOnline();

  const clearPoll = () => {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
  };

  const schedulePoll = () => {
    clearPoll();
    if (stopped) return;
    pollTimer = setTimeout(() => void refresh(), pollMs);
  };

  const apply = (tracked: TrackedOrderStatus) => {
    if (stopped) return;
    onUpdate(tracked);
    if (TERMINAL.includes(tracked.status)) {
      clearPoll();
    } else {
      schedulePoll();
    }
  };

  const refresh = async () => {
    if (stopped || networkOff || isSupabaseCircuitOpen()) {
      schedulePoll();
      return;
    }
    try {
      const next = await orderingRepo.trackOrder(orderId);
      if (next) {
        pollMs = BASE_POLL_MS;
        apply(next);
        return;
      }
      schedulePoll();
    } catch {
      recordSupabaseFailure();
      pollMs = Math.min(pollMs * 2, MAX_POLL_MS);
      onError?.();
      schedulePoll();
    }
  };

  const subscribeBroadcast = () => {
    if (!supabase || stopped || networkOff || channel) return;
    channel = supabase
      .channel(guestChannelName(orderId), { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'status' }, () => {
        void refresh();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          live = true;
          recordSupabaseSuccess();
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          live = false;
          recordSupabaseFailure();
          if (channel && supabase) void supabase.removeChannel(channel);
          channel = null;
        }
      });
  };

  const teardownBroadcast = () => {
    live = false;
    if (channel && supabase) void supabase.removeChannel(channel);
    channel = null;
  };

  const networkUnsub = onNetworkStatusChange((online) => {
    networkOff = !online;
    if (stopped) return;
    if (online) {
      pollMs = BASE_POLL_MS;
      subscribeBroadcast();
      void refresh();
      return;
    }
    teardownBroadcast();
    clearPoll();
  });

  void refresh();
  subscribeBroadcast();

  return {
    isLive: () => live,
    stop: () => {
      stopped = true;
      networkUnsub();
      clearPoll();
      teardownBroadcast();
    },
  };
}
