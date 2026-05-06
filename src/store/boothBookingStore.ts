import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoothBooking, BoothBookingStatus } from '../types/domain';
import { SEED_BOOTH_BOOKINGS } from '../data/seed';
import { newId } from '../lib/id';

function shortCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `BK-${n}`;
}

const STATUS_TRANSITIONS: Record<BoothBookingStatus, BoothBookingStatus[]> = {
  submitted: ['under_review', 'declined', 'cancelled'],
  under_review: ['quoted', 'declined', 'cancelled'],
  quoted: ['awaiting_confirmation', 'declined', 'cancelled'],
  awaiting_confirmation: ['confirmed', 'declined', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  declined: [],
  cancelled: [],
  completed: [],
};

export interface BoothBookingStore {
  bookings: BoothBooking[];
  createBooking: (
    input: Omit<BoothBooking, 'id' | 'shortCode' | 'createdAt' | 'updatedAt'> & { shortCode?: string },
  ) => BoothBooking;
  updateBooking: (id: string, patch: Partial<BoothBooking>) => void;
  updateStatus: (id: string, status: BoothBookingStatus) => void;
  assignStaff: (id: string, staffId?: string) => void;
  bookingsForBranch: (branchId: string) => BoothBooking[];
  bookingsForStaff: (staffId: string, branchId?: string) => BoothBooking[];
  seed: () => void;
}

export const useBoothBookingStore = create<BoothBookingStore>()(
  persist(
    (set, get) => ({
      bookings: SEED_BOOTH_BOOKINGS,

      createBooking: (input) => {
        const now = new Date().toISOString();
        const booking: BoothBooking = {
          id: newId(),
          shortCode: input.shortCode ?? shortCode(),
          ...input,
          createdAt: now,
          updatedAt: now,
        };
        set({ bookings: [booking, ...get().bookings] });
        return booking;
      },

      updateBooking: (id, patch) =>
        set({
          bookings: get().bookings.map((booking) =>
            booking.id === id ? { ...booking, ...patch, updatedAt: new Date().toISOString() } : booking,
          ),
        }),

      updateStatus: (id, status) =>
        set({
          bookings: get().bookings.map((booking) => {
            if (booking.id !== id) return booking;
            if (!STATUS_TRANSITIONS[booking.status].includes(status) && booking.status !== status) return booking;
            return { ...booking, status, updatedAt: new Date().toISOString() };
          }),
        }),

      assignStaff: (id, staffId) =>
        set({
          bookings: get().bookings.map((booking) =>
            booking.id === id ? { ...booking, assignedStaffId: staffId, updatedAt: new Date().toISOString() } : booking,
          ),
        }),

      bookingsForBranch: (branchId) =>
        get()
          .bookings.filter((booking) => booking.branchId === branchId)
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),

      bookingsForStaff: (staffId, branchId) =>
        get()
          .bookings.filter(
            (booking) =>
              (booking.assignedStaffId === staffId || !booking.assignedStaffId) &&
              (!branchId || booking.branchId === branchId),
          )
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),

      seed: () => set({ bookings: SEED_BOOTH_BOOKINGS }),
    }),
    { name: 'kado-booth-bookings-v1' },
  ),
);
