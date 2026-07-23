import { create } from 'zustand';
import type { Order, OrderStatus, PaymentStatus } from '../types/domain';
import { newId } from '../lib/id';
import { applyLoyaltyStampsForCompletedOrder, persistLoyaltyStampsForCompletedOrder } from '../lib/loyaltyStamps';
import { defaultFieldsForNewOrder, normalizeOrderFields, ORDER_STATUS_LABELS, awaitsGatewayPayment } from '../lib/orderStatus';
import { orderingRepo, formatBaristaOrderError } from '../lib/supabase/repositories/ordering';
import { logAudit } from '../lib/audit';
import {
  notifyCustomerOrderStatus,
  notifyBaristasNewOrder,
  notifyBaristasProofSubmitted,
  notifyCustomerPendingPayment,
  notifyCustomerProofSubmitted,
} from '../lib/notify';
import { rememberPendingPayment, clearPendingPayment } from '../lib/pendingPayments';
import { broadcastGuestOrderUpdate } from '../lib/supabase/guestOrderTracking';
import {
  assertProductsOrderable,
  ensureOrderReadiness,
  isOrderCatalogError,
} from '../lib/orderReadiness';
import type { FetchOrdersScope } from '../lib/orderFetchScope';
import {
  BARISTA_ORDER_CHANNELS,
  defaultAdminOrderScope,
} from '../lib/orderFetchScope';

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
  hydrateError: string | null;
  adminFetchScope: FetchOrdersScope | null;
  hydrateFromRemote: (scope?: FetchOrdersScope) => Promise<void>;
  hydrateForBarista: (branchId: string) => Promise<void>;
  hydrateForAdmin: (scope?: FetchOrdersScope) => Promise<void>;
  hydrateForCustomer: (customerId: string) => Promise<void>;
  setAdminFetchScope: (scope: FetchOrdersScope) => void;
  refreshScopedForSession: (scope: FetchOrdersScope) => Promise<void>;
  createOrder: (
    order: Omit<Order, 'id' | 'shortCode' | 'createdAt' | 'updatedAt' | 'status' | 'paymentStatus'> &
      Partial<Pick<Order, 'status' | 'paymentStatus'>> & {
        shortCode?: string;
        promoCode?: string;
        /** Use anon Supabase session (staff testing QR while logged into portal). */
        guestSession?: boolean;
      },
  ) => Promise<Order>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<string | null>;
  updatePaymentStatus: (id: string, paymentStatus: PaymentStatus) => Promise<string | null>;
  updateOrderFields: (
    id: string,
    patch: { status?: OrderStatus; paymentStatus?: PaymentStatus },
  ) => Promise<string | null>;
  updateOrderPaymentProof: (id: string, proofImage: string) => Promise<string | null>;
  deleteOrder: (id: string) => Promise<string | null>;
  ordersForBranch: (branchId: string, channels?: Order['channel'][]) => Order[];
  ordersForBarista: (branchId: string) => Order[];
  seed: () => void;
}

/** Orders are sourced from Supabase; no localStorage cache (prevents stale order boards). */
export const useOrderStore = create<OrderStore>()((set, get) => ({
      orders: [],
      hydrateError: null,
      adminFetchScope: null,

      hydrateFromRemote: async (scope) => {
        const resolved = scope ?? defaultAdminOrderScope();
        try {
          const orders = await orderingRepo.fetchOrders(resolved);
          set({ orders: orders.map((o) => normalizeOrder(o)), hydrateError: null });
        } catch (err) {
          const message = formatBaristaOrderError(err, 'load');
          set({ hydrateError: message });
          console.error('orderStore.hydrateFromRemote failed', err);
        }
      },

      hydrateForBarista: async (branchId) => {
        await get().hydrateFromRemote({
          branchId,
          channels: BARISTA_ORDER_CHANNELS,
          activeOnly: true,
          limit: 300,
        });
      },

      hydrateForAdmin: async (scope) => {
        const resolved = scope ?? get().adminFetchScope ?? defaultAdminOrderScope();
        if (scope) set({ adminFetchScope: scope });
        await get().hydrateFromRemote(resolved);
      },

      hydrateForCustomer: async (customerId) => {
        await get().hydrateFromRemote({ customerId, limit: 100 });
      },

      refreshScopedForSession: async (scope) => {
        await get().hydrateFromRemote(scope);
      },

      setAdminFetchScope: (scope) => set({ adminFetchScope: scope }),

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
          await assertProductsOrderable(
            o.items.map((line) => line.productId),
            o.items.flatMap((line) =>
              line.mixMatchCookieId ? [line.mixMatchCookieId] : [],
            ),
          );
          return orderingRepo.placeOrder(o, {
            promoCode: input.promoCode,
            guestSession: input.guestSession,
          });
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
        const needsPayment =
          awaitsGatewayPayment(persisted) && persisted.paymentStatus === 'unpaid';
        if (needsPayment) {
          rememberPendingPayment({
            orderId: persisted.id,
            shortCode: persisted.shortCode,
            paymentMethod: persisted.paymentMethod,
            total: persisted.total,
            channel: persisted.channel,
            placedAt: persisted.createdAt,
          });
          if (persisted.customerId) notifyCustomerPendingPayment(persisted);
        } else if (persisted.customerId) {
          notifyCustomerOrderStatus(persisted, persisted.status);
        }
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

        // Persist status; stamps are awarded server-side via kk_award_loyalty_stamps.
        try {
          await orderingRepo.patchOrder(id, {
            status: next.status,
          });
        } catch (err) {
          // Roll back optimistic update.
          set({ orders: get().orders.map((o) => (o.id === id ? prev : o)) });
          return err instanceof Error ? err.message : 'Failed to update order status.';
        }

        if (justCompleted) {
          void persistLoyaltyStampsForCompletedOrder(next);
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
        if (paymentStatus === 'paid') {
          clearPendingPayment(id);
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

      updateOrderFields: async (id, patch) => {
        const prev = get().orders.find((o) => o.id === id);
        if (!prev) return 'Order not found.';

        let status = patch.status ?? prev.status;
        let paymentStatus = patch.paymentStatus ?? prev.paymentStatus;
        if (patch.paymentStatus === 'paid' && status === 'pending') {
          status = 'accepted';
        }

        let next: Order = { ...prev, status, paymentStatus, updatedAt: new Date().toISOString() };
        const justCompleted = patch.status === 'completed' && prev.status !== 'completed';
        if (justCompleted) {
          next = applyLoyaltyStampsForCompletedOrder(next);
        }

        set({ orders: get().orders.map((o) => (o.id === id ? next : o)) });

        try {
          await orderingRepo.patchOrder(id, {
            status: next.status,
            paymentStatus: next.paymentStatus,
          });
        } catch (err) {
          set({ orders: get().orders.map((o) => (o.id === id ? prev : o)) });
          return formatBaristaOrderError(err, 'update');
        }

        if (justCompleted) {
          void persistLoyaltyStampsForCompletedOrder(next);
        }

        if (patch.status && patch.status !== prev.status) {
          logAudit({
            action: 'order.status_changed',
            entityType: 'order',
            entityId: id,
            branchId: next.branchId,
            summary: `${next.shortCode}: ${ORDER_STATUS_LABELS[prev.status]} → ${ORDER_STATUS_LABELS[patch.status]}`,
            metadata: { from: prev.status, to: patch.status, channel: next.channel },
          });
          notifyCustomerOrderStatus(next, patch.status);
        }
        if (patch.paymentStatus && patch.paymentStatus !== prev.paymentStatus) {
          logAudit({
            action: 'order.payment_status_changed',
            entityType: 'order',
            entityId: id,
            branchId: prev.branchId,
            summary: `${prev.shortCode}: payment → ${patch.paymentStatus}`,
            metadata: { from: prev.paymentStatus, to: patch.paymentStatus },
          });
          if (patch.paymentStatus === 'paid' && prev.status === 'pending') {
            notifyCustomerOrderStatus(next, 'accepted');
          }
          if (patch.paymentStatus === 'paid') {
            clearPendingPayment(id);
          }
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

        return null;
      },

      updateOrderPaymentProof: async (id, proofImage) => {
        const prev = get().orders.find((o) => o.id === id);
        if (!prev) return 'Order not found.';

        const paymentStatus: PaymentStatus =
          prev.paymentMethod === 'gcash-qr' ? 'proof_submitted' : prev.paymentStatus;
        const updated = normalizeOrder({
          ...prev,
          paymentProofImage: proofImage,
          paymentProofUploadedAt: new Date().toISOString(),
          paymentStatus,
          updatedAt: new Date().toISOString(),
        });

        set({
          orders: get().orders.map((o) => (o.id === id ? updated : o)),
        });

        try {
          await orderingRepo.submitGuestPaymentProof(id, proofImage);
          if (paymentStatus === 'proof_submitted') {
            notifyBaristasProofSubmitted(updated);
            notifyCustomerProofSubmitted(updated);
          }
          return null;
        } catch (err) {
          set({
            orders: get().orders.map((o) => (o.id === id ? prev : o)),
          });
          return err instanceof Error ? err.message : 'Failed to upload payment proof.';
        }
      },

      ordersForBranch: (branchId, channels) => {
        const list = get().orders.filter((o) => o.branchId === branchId);
        if (!channels?.length) return list;
        return list.filter((o) => channels.includes(o.channel));
      },

      ordersForBarista: (branchId) =>
        get().ordersForBranch(branchId, ['online', 'dine-in', 'takeout', 'pos', 'merch']),

      seed: () => set({ orders: [] }),
}));
