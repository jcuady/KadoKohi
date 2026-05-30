import type { RealtimeChannel } from '@supabase/supabase-js';
import type { OrderStatus, PaymentStatus } from '../../types/domain';
import { supabase } from './client';
import { orderingRepo, type TrackedOrderStatus } from './repositories/ordering';

export type GuestOrderTrackingPayload = {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  updatedAt: string;
  shortCode?: string;
};

const POLL_MS = 4000;
const TERMINAL: OrderStatus[] = ['completed', 'cancelled'];

function guestChannelName(orderId: string) {
  return `guest-order:${orderId}`;
}

function mapRowToTracked(row: Record<string, unknown>): TrackedOrderStatus | null {
  const id = row.id;
  if (typeof id !== 'string') return null;
  return {
    id,
    shortCode: String(row.short_code ?? ''),
    channel: row.channel as TrackedOrderStatus['channel'],
    status: row.status as OrderStatus,
    paymentStatus: row.payment_status as PaymentStatus,
    guestName: row.guest_name ? String(row.guest_name) : undefined,
    total: Number(row.total ?? 0),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

/** Notify guest tracking pages immediately after a staff-side status change. */
export function broadcastGuestOrderUpdate(
  orderId: string,
  payload: GuestOrderTrackingPayload,
): void {
  if (!supabase) return;
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
  /** True once postgres_changes or broadcast subscription is active. */
  isLive: () => boolean;
  stop: () => void;
};

/**
 * Live order status for guest QR / takeout pages.
 * Layers: Supabase Realtime postgres_changes → broadcast → RPC poll fallback.
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
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let channel: RealtimeChannel | null = null;

  const apply = (tracked: TrackedOrderStatus) => {
    if (stopped) return;
    onUpdate(tracked);
    if (TERMINAL.includes(tracked.status) && pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const refresh = async () => {
    if (stopped) return;
    try {
      const next = await orderingRepo.trackOrder(orderId);
      if (next) {
        apply(next);
      }
    } catch {
      onError?.();
    }
  };

  void refresh();

  channel = supabase
    .channel(guestChannelName(orderId), { config: { broadcast: { self: false } } })
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'kk_orders',
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        const mapped = mapRowToTracked(payload.new as Record<string, unknown>);
        if (mapped) apply(mapped);
        else void refresh();
      },
    )
    .on('broadcast', { event: 'status' }, (msg) => {
      const p = msg.payload as GuestOrderTrackingPayload | undefined;
      if (!p?.status) {
        void refresh();
        return;
      }
      void refresh();
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') live = true;
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        live = false;
        void refresh();
      }
    });

  pollTimer = setInterval(() => void refresh(), POLL_MS);

  return {
    isLive: () => live,
    stop: () => {
      stopped = true;
      if (pollTimer) clearInterval(pollTimer);
      if (channel && supabase) void supabase.removeChannel(channel);
      channel = null;
      live = false;
    },
  };
}
