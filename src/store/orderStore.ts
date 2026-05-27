import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderStatus, PaymentStatus } from '../types/domain';
import { newId } from '../lib/id';
import { applyLoyaltyStampsForCompletedOrder } from '../lib/loyaltyStamps';
import { defaultFieldsForNewOrder, normalizeOrderFields } from '../lib/orderStatus';

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
  createOrder: (
    order: Omit<Order, 'id' | 'shortCode' | 'createdAt' | 'updatedAt' | 'status' | 'paymentStatus'> &
      Partial<Pick<Order, 'status' | 'paymentStatus'>> & { shortCode?: string },
  ) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updatePaymentStatus: (id: string, paymentStatus: PaymentStatus) => void;
  updateOrderPaymentProof: (id: string, proofImage: string) => void;
  ordersForBranch: (branchId: string, channels?: Order['channel'][]) => Order[];
  ordersForBarista: (branchId: string) => Order[];
  seed: () => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],

      createOrder: (input) => {
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
        return o;
      },

      updateOrderStatus: (id, status) => {
        const prev = get().orders.find((o) => o.id === id);
        if (!prev) return;

        let next: Order = {
          ...prev,
          status,
          updatedAt: new Date().toISOString(),
        };

        if (status === 'completed' && prev.status !== 'completed') {
          next = applyLoyaltyStampsForCompletedOrder(next);
        }

        set({
          orders: get().orders.map((o) => (o.id === id ? next : o)),
        });
      },

      updatePaymentStatus: (id, paymentStatus) => {
        const prev = get().orders.find((o) => o.id === id);
        if (!prev) return;

        let status = prev.status;
        if (paymentStatus === 'paid' && status === 'pending') {
          status = 'accepted';
        }

        set({
          orders: get().orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  paymentStatus,
                  status,
                  updatedAt: new Date().toISOString(),
                }
              : o,
          ),
        });
      },

      updateOrderPaymentProof: (id, proofImage) =>
        set({
          orders: get().orders.map((o) => {
            if (o.id !== id) return o;
            const paymentStatus: PaymentStatus =
              o.paymentMethod === 'gcash-qr' ? 'proof_submitted' : o.paymentStatus;
            return normalizeOrder({
              ...o,
              paymentProofImage: proofImage,
              paymentProofUploadedAt: new Date().toISOString(),
              paymentStatus,
              updatedAt: new Date().toISOString(),
            });
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
    }),
    {
      name: 'kado-orders-v3',
      merge: (persisted, current) => {
        const p = persisted as { orders?: Order[] } | undefined;
        const orders = (p?.orders ?? current.orders).map((o) => normalizeOrder(o));
        return { ...current, orders };
      },
    },
  ),
);
