import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderItem, OrderStatus } from '../types/domain';
import { newId } from '../lib/id';

function shortCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `KK-${n}`;
}

export interface OrderStore {
  orders: Order[];
  createOrder: (order: Omit<Order, 'id' | 'shortCode' | 'createdAt' | 'updatedAt'> & { shortCode?: string }) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
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
        const o: Order = {
          id: newId(),
          shortCode: input.shortCode ?? shortCode(),
          channel: input.channel,
          branchId: input.branchId,
          tableId: input.tableId,
          customerId: input.customerId,
          guestName: input.guestName,
          staffId: input.staffId,
          paymentMethod: input.paymentMethod,
          status: input.status,
          items: input.items,
          subtotal: input.subtotal,
          modifiersTotal: input.modifiersTotal,
          tax: input.tax,
          total: input.total,
          createdAt: t,
          updatedAt: t,
        };
        set({ orders: [o, ...get().orders] });
        return o;
      },

      updateOrderStatus: (id, status) =>
        set({
          orders: get().orders.map((o) =>
            o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
          ),
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
    { name: 'kado-orders-v1' },
  ),
);
