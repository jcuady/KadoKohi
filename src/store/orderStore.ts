import { create } from 'zustand';
import type { Order, OrderStatus, PaymentStatus } from '../types/domain';
import { newId } from '../lib/id';
import { applyLoyaltyStampsForCompletedOrder } from '../lib/loyaltyStamps';
import { defaultFieldsForNewOrder, normalizeOrderFields, ORDER_STATUS_LABELS } from '../lib/orderStatus';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { logAudit } from '../lib/audit';
import {
  notifyCustomerOrderStatus,
  notifyBaristasNewOrder,
  notifyBaristasProofSubmitted,
} from '../lib/notify';
import { broadcastGuestOrderUpdate } from '../lib/supabase/guestOrderTracking';
import {
  assertProductsOrderable,
  ensureOrderReadiness,
  isOrderCatalogError,
} from '../lib/orderReadiness';

function shortCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `KK-${n}`;
}

function normalizeOrder(o: Order): Order {
  const { status, paymentStatus } = normalizeOrderFields(o);
  return { ...o, status, paymentStatus };
}

export interface OrderStore {
  orders: Order[];
  hydrateFromRemote: () => Promise<void>;
  createOrder: (
    order: Omit<Order, 'id' | 'shortCode' | 'createdAt' | 'updatedAt' | 'status' | 'paymentStatus'> &
      Partial<Pick<Order, 'status' | 'paymentStatus'>> & { shortCode?: string; promoCode?: string },
  ) => Promise<Order>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<string | null>;
  updatePaymentStatus: (id: string, paymentStatus: PaymentStatus) => Promise<string | null>;
  updateOrderPaymentProof: (id: string, proofImage: string) => void;
  deleteOrder: (id: string) => Promise<string | null>;
  ordersForBranch: (branchId: string, channels?: Order['channel'][]) => Order[];
  ordersForBarista: (branchId: string) => Order[];
  seed: () => void;
}

/** Orders are sourced from Supabase; no localStorage cache (prevents stale order boards). */
export const useOrderStore = create<OrderStore>()((set, get) => ({
      orders: [],
      hydrateFromRemote: async () => {
        try {
          const orders = await orderingRepo.fetchOrders();
          set({ orders: orders.map((o) => normalizeOrder(o)) });
        } catch {
          // Keep in-memory state when remote fetch fails.
        }
      },

      createOrder: async (input) => {
        const t = new Date().toISOString();
        const defaults = defaultFieldsForNewOrder(input.paymentMethod);
        const o: Order = normalizeOrder({
          id: newId(),
          shortCode: input.shortCode ?? shortCode(),
          channel: input.channel,
          branchId: input.branchId,
          tableId: input.tableId,
          customerId: input.customerId,
          guestName: input.guestName,
          staffId: input.staffId,
          paymentMethod: input.paymentMethod,
          paymentProofImage: input.paymentProofImage,
          paymentProofUploadedAt: input.paymentProofUploadedAt,
          status: input.status ?? defaults.status,
          paymentStatus: input.paymentStatus ?? defaults.paymentStatus,
          items: input.items,
          subtotal: input.subtotal,
          modifiersTotal: input.modifiersTotal,
          tax: input.tax,
          total: input.total,
          loyaltyVoucherId: input.loyaltyVoucherId,
          loyaltyVoucherCode: input.loyaltyVoucherCode,
          loyaltyDiscountTotal: input.loyaltyDiscountTotal,
          createdAt: t,
          updatedAt: t,
        });
        set({ orders: [o, ...get().orders] });
        let persisted = o;
        const place = async () => {
          await ensureOrderReadiness();
          await assertProductsOrderable(o.items.map((line) => line.productId));
          return orderingRepo.placeOrder(o, { promoCode: input.promoCode });
        };
        try {
          persisted = normalizeOrder(await place());
        } catch (err) {
          if (isOrderCatalogError(err)) {
            await ensureOrderReadiness();
            try {
              persisted = normalizeOrder(await place());
            } catch (retryErr) {
              set({ orders: get().orders.filter((row) => row.id !== o.id) });
              throw retryErr;
            }
          } else {
            set({ orders: get().orders.filter((row) => row.id !== o.id) });
            throw err;
          }
        }
        set({
          orders: get().orders.map((row) => (row.id === o.id ? persisted : row)),
        });
        notifyBaristasNewOrder(persisted);
        if (persisted.customerId) notifyCustomerOrderStatus(persisted, persisted.status);
        return persisted;
      },

      updateOrderStatus: async (id, status) => {
        const prev = get().orders.find((o) => o.id === id);
        if (!prev) return null;

        let next: Order = {
          ...prev,
          status,
          updatedAt: new Date().toISOString(),
        };

        const justCompleted = status === 'completed' && prev.status !== 'completed';
        if (justCompleted) {
          next = applyLoyaltyStampsForCompletedOrder(next);
        }

        set({
          orders: get().orders.map((o) => (o.id === id ? next : o)),
        });

        // Persist status (+ awarded stamps when completing) and surface any error.
        try {
          await orderingRepo.patchOrder(id, {
            status: next.status,
            ...(justCompleted ? { loyaltyStampsAwarded: next.loyaltyStampsAwarded } : {}),
          });
        } catch (err) {
          // Roll back optimistic update.
          set({ orders: get().orders.map((o) => (o.id === id ? prev : o)) });
          return err instanceof Error ? err.message : 'Failed to update order status.';
        }

        // Audit the staff action + notify the customer of the new status.
        logAudit({
          action: 'order.status_changed',
          entityType: 'order',
          entityId: id,
          branchId: next.branchId,
          summary: `${next.shortCode}: ${ORDER_STATUS_LABELS[prev.status]} → ${ORDER_STATUS_LABELS[status]}`,
          metadata: { from: prev.status, to: status, channel: next.channel },
        });
        notifyCustomerOrderStatus(next, status);
        if (['dine-in', 'takeout', 'online'].includes(next.channel)) {
          void broadcastGuestOrderUpdate(id, {
            status: next.status,
            paymentStatus: next.paymentStatus,
            updatedAt: next.updatedAt,
            shortCode: next.shortCode,
          });
        }
        return null;
      },

      updatePaymentStatus: async (id, paymentStatus) => {
        const prev = get().orders.find((o) => o.id === id);
        if (!prev) return null;

        let status = prev.status;
        if (paymentStatus === 'paid' && status === 'pending') {
          status = 'accepted';
        }

        const next: Order = { ...prev, paymentStatus, status, updatedAt: new Date().toISOString() };
        set({
          orders: get().orders.map((o) => (o.id === id ? next : o)),
        });
        try {
          await orderingRepo.patchOrder(id, { paymentStatus, status });
        } catch (err) {
          set({ orders: get().orders.map((o) => (o.id === id ? prev : o)) });
          return err instanceof Error ? err.message : 'Failed to update payment status.';
        }
        logAudit({
          action: 'order.payment_status_changed',
          entityType: 'order',
          entityId: id,
          branchId: prev.branchId,
          summary: `${prev.shortCode}: payment → ${paymentStatus}`,
          metadata: { from: prev.paymentStatus, to: paymentStatus },
        });
        if (paymentStatus === 'paid' && prev.status === 'pending') {
          notifyCustomerOrderStatus(next, 'accepted');
        }
        if (['dine-in', 'takeout', 'online'].includes(next.channel)) {
          void broadcastGuestOrderUpdate(id, {
            status: next.status,
            paymentStatus: next.paymentStatus,
            updatedAt: next.updatedAt,
            shortCode: next.shortCode,
          });
        }
        return null;
      },

      deleteOrder: async (id) => {
        const prev = get().orders.find((o) => o.id === id);
        if (!prev) return 'Order not found.';

        const snapshot = get().orders;
        set({ orders: snapshot.filter((o) => o.id !== id) });

        try {
          await orderingRepo.deleteOrder(id);
        } catch (err) {
          set({ orders: snapshot });
          return err instanceof Error ? err.message : 'Failed to delete order.';
        }

        logAudit({
          action: 'order.deleted',
          entityType: 'order',
          entityId: id,
          branchId: prev.branchId,
          summary: `Deleted ${prev.shortCode}`,
          metadata: { channel: prev.channel, status: prev.status, total: prev.total },
        });
        return null;
      },

      updateOrderPaymentProof: (id, proofImage) =>
        set({
          orders: get().orders.map((o) => {
            if (o.id !== id) return o;
            const paymentStatus: PaymentStatus =
              o.paymentMethod === 'gcash-qr' ? 'proof_submitted' : o.paymentStatus;
            const updated = normalizeOrder({
              ...o,
              paymentProofImage: proofImage,
              paymentProofUploadedAt: new Date().toISOString(),
              paymentStatus,
              updatedAt: new Date().toISOString(),
            });
            void orderingRepo.patchOrder(id, {
              paymentProofImage: updated.paymentProofImage,
              paymentProofUploadedAt: updated.paymentProofUploadedAt,
              paymentStatus: updated.paymentStatus,
            });
            // Tell the branch a proof is awaiting verification.
            if (paymentStatus === 'proof_submitted') {
              notifyBaristasProofSubmitted(updated);
            }
            return updated;
          }),
        }),

      ordersForBranch: (branchId, channels) => {
        const list = get().orders.filter((o) => o.branchId === branchId);
        if (!channels?.length) return list;
        return list.filter((o) => channels.includes(o.channel));
      },

      ordersForBarista: (branchId) =>
        get().ordersForBranch(branchId, ['online', 'dine-in', 'takeout', 'pos']),

      seed: () => set({ orders: [] }),
}));
