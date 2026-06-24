import { create } from 'zustand';
import type { BoothBooking, BoothBookingStatus, BookingEstimate } from '../types/domain';
import { SEED_BOOTH_BOOKINGS } from '../data/seed';
import { buildFinalQuote } from '../lib/boothQuote';
import { newId } from '../lib/id';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { supabase } from '../lib/supabase/client';

function shortCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `BK-${n}`;
}

async function patchBookingRemote(id: string, patch: Partial<BoothBooking>): Promise<void> {
  await orderingRepo.patchBooking(id, patch);
}

export interface BoothBookingStore {
  bookings: BoothBooking[];
  hydrateFromRemote: () => Promise<void>;
  createBooking: (
    input: Omit<BoothBooking, 'id' | 'shortCode' | 'createdAt' | 'updatedAt'> & { shortCode?: string },
  ) => Promise<BoothBooking>;
  updateBooking: (id: string, patch: Partial<BoothBooking>) => Promise<void>;
  setStatus: (id: string, status: BoothBookingStatus) => Promise<void>;
  assignStaff: (id: string, staffId?: string) => Promise<void>;
  setFinalQuote: (
    id: string,
    officialTotal: number,
    opts?: { quoteNotes?: string; status?: BoothBookingStatus },
  ) => Promise<void>;
  bookingsForBranch: (branchId: string) => BoothBooking[];
  bookingsForStaff: (staffId: string) => BoothBooking[];
  bookingsForCustomer: (customerId: string) => BoothBooking[];
  seed: () => void;
}

export const useBoothBookingStore = create<BoothBookingStore>()((set, get) => ({
  bookings: [],

  hydrateFromRemote: async () => {
    if (!supabase) {
      set({ bookings: [] });
      return;
    }
    try {
      const bookings = await orderingRepo.fetchBookings();
      set({ bookings });
    } catch {
      set({ bookings: [] });
    }
  },

  createBooking: async (input) => {
    const now = new Date().toISOString();
    const booking: BoothBooking = {
      id: newId(),
      shortCode: input.shortCode ?? shortCode(),
      ...input,
      bookingKind: input.bookingKind ?? 'coffee-cart',
      createdAt: now,
      updatedAt: now,
    };
    set({ bookings: [booking, ...get().bookings] });
    let persisted = booking;
    try {
      persisted = await orderingRepo.placeBooking(booking);
    } catch (err) {
      set({ bookings: get().bookings.filter((b) => b.id !== booking.id) });
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Unable to save your proposal. Please try again.';
      throw new Error(message);
    }
    set({ bookings: get().bookings.map((b) => (b.id === booking.id ? persisted : b)) });
    return persisted;
  },

  updateBooking: async (id, patch) => {
    const prev = get().bookings;
    const snapshot = prev.find((b) => b.id === id);
    if (!snapshot) return;
    const next = { ...snapshot, ...patch, updatedAt: new Date().toISOString() };
    set({ bookings: prev.map((b) => (b.id === id ? next : b)) });
    try {
      await patchBookingRemote(id, patch);
    } catch (err) {
      set({ bookings: prev });
      throw err;
    }
  },

  setStatus: async (id, status) => {
    const prev = get().bookings;
    const snapshot = prev.find((b) => b.id === id);
    if (!snapshot) return;
    set({
      bookings: prev.map((b) =>
        b.id === id ? { ...b, status, updatedAt: new Date().toISOString() } : b,
      ),
    });
    try {
      await patchBookingRemote(id, { status });
    } catch (err) {
      set({ bookings: prev });
      throw err;
    }
  },

  assignStaff: async (id, staffId) => {
    const prev = get().bookings;
    const snapshot = prev.find((b) => b.id === id);
    if (!snapshot) return;
    set({
      bookings: prev.map((b) =>
        b.id === id ? { ...b, assignedStaffId: staffId, updatedAt: new Date().toISOString() } : b,
      ),
    });
    try {
      await patchBookingRemote(id, { assignedStaffId: staffId });
    } catch (err) {
      set({ bookings: prev });
      throw err;
    }
  },

  setFinalQuote: async (id, officialTotal, opts) => {
    const prev = get().bookings;
    const booking = prev.find((b) => b.id === id);
    if (!booking) return;
    const finalQuote: BookingEstimate = buildFinalQuote(
      booking.finalQuote ?? booking.estimateSnapshot,
      officialTotal,
      opts?.quoteNotes,
    );
    const status =
      opts?.status ??
      (booking.status === 'submitted' || booking.status === 'under_review' ? 'quoted' : booking.status);
    const quotedAt = new Date().toISOString();
    const patch = {
      finalQuote,
      quoteNotes: opts?.quoteNotes?.trim() || booking.quoteNotes,
      quotedAt,
      status,
    };
    set({
      bookings: prev.map((b) =>
        b.id === id ? { ...b, ...patch, updatedAt: quotedAt } : b,
      ),
    });
    try {
      await patchBookingRemote(id, patch);
    } catch (err) {
      set({ bookings: prev });
      throw err;
    }
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
}));
