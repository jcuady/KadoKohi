import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoothBooking, BoothBookingStatus, BookingEstimate } from '../types/domain';
import { SEED_BOOTH_BOOKINGS } from '../data/seed';
import { buildFinalQuote } from '../lib/boothQuote';
import { newId } from '../lib/id';

function shortCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `BK-${n}`;
}

export interface BoothBookingStore {
  bookings: BoothBooking[];
  createBooking: (
    input: Omit<BoothBooking, 'id' | 'shortCode' | 'createdAt' | 'updatedAt'> & { shortCode?: string },
  ) => BoothBooking;
  updateBooking: (id: string, patch: Partial<BoothBooking>) => void;
  /** Admin override — any status allowed. */
  setStatus: (id: string, status: BoothBookingStatus) => void;
  assignStaff: (id: string, staffId?: string) => void;
  /** Set official quote total (and optional notes); marks quoted unless status overridden. */
  setFinalQuote: (
    id: string,
    officialTotal: number,
    opts?: { quoteNotes?: string; status?: BoothBookingStatus },
  ) => void;
  bookingsForBranch: (branchId: string) => BoothBooking[];
  bookingsForStaff: (staffId: string) => BoothBooking[];
  bookingsForCustomer: (customerId: string) => BoothBooking[];
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

      setStatus: (id, status) =>
        set({
          bookings: get().bookings.map((booking) =>
            booking.id === id ? { ...booking, status, updatedAt: new Date().toISOString() } : booking,
          ),
        }),

      assignStaff: (id, staffId) =>
        set({
          bookings: get().bookings.map((booking) =>
            booking.id === id ? { ...booking, assignedStaffId: staffId, updatedAt: new Date().toISOString() } : booking,
          ),
        }),

      setFinalQuote: (id, officialTotal, opts) => {
        const booking = get().bookings.find((b) => b.id === id);
        if (!booking) return;
        const finalQuote: BookingEstimate = buildFinalQuote(
          booking.finalQuote ?? booking.estimateSnapshot,
          officialTotal,
          opts?.quoteNotes,
        );
        const status = opts?.status ?? (booking.status === 'submitted' || booking.status === 'under_review' ? 'quoted' : booking.status);
        set({
          bookings: get().bookings.map((b) =>
            b.id === id
              ? {
                  ...b,
                  finalQuote,
                  quoteNotes: opts?.quoteNotes?.trim() || b.quoteNotes,
                  quotedAt: new Date().toISOString(),
                  status,
                  updatedAt: new Date().toISOString(),
                }
              : b,
          ),
        });
      },

      bookingsForBranch: (branchId) =>
        get()
          .bookings.filter((booking) => booking.branchId === branchId)
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),

      bookingsForStaff: (staffId) =>
        get()
          .bookings.filter((booking) => booking.assignedStaffId === staffId || !booking.assignedStaffId)
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),

      bookingsForCustomer: (customerId) =>
        get()
          .bookings.filter((b) => b.customerId === customerId)
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),

      seed: () => set({ bookings: SEED_BOOTH_BOOKINGS }),
    }),
    { name: 'kado-booth-bookings-v1' },
  ),
);
