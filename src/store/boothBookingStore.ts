import { create } from 'zustand';
import type { BoothBooking, BoothBookingStatus, BoothPaymentMethod, BookingEstimate, PaymentStatus } from '../types/domain';
import { SEED_BOOTH_BOOKINGS } from '../data/seed';
import { buildFinalQuote } from '../lib/boothQuote';
import { boothAmountDue } from '../lib/boothPayment';
import { newId } from '../lib/id';
import { orderingRepo } from '../lib/supabase/repositories/ordering';
import { supabase } from '../lib/supabase/client';
import { useEventCalendarStore } from './eventCalendarStore';

function shortCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `BK-${n}`;
}

async function patchBookingRemote(id: string, patch: Partial<BoothBooking>): Promise<void> {
  const result = await orderingRepo.adminPatchBooking(id, patch);
  if (!result || typeof result !== 'object') return;
  const row = result as Record<string, unknown>;
  const store = useBoothBookingStore.getState();
  const current = store.bookings.find((b) => b.id === id);
  if (!current) return;
  const merged: BoothBooking = {
    ...current,
    ...patch,
    status: (row.status as BoothBooking['status']) ?? patch.status ?? current.status,
    paymentStatus:
      (row.payment_status as BoothBooking['paymentStatus']) ?? patch.paymentStatus ?? current.paymentStatus,
    paymentAmount:
      row.payment_amount != null ? Number(row.payment_amount) : patch.paymentAmount ?? current.paymentAmount,
    paymentPaidAt:
      (row.payment_paid_at as string | undefined) ?? patch.paymentPaidAt ?? current.paymentPaidAt,
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
  useBoothBookingStore.setState({
    bookings: store.bookings.map((b) => (b.id === id ? merged : b)),
  });
  const cal = useEventCalendarStore.getState();
  cal.invalidateForDateKey(current.eventDate);
  if (merged.eventDate.slice(0, 10) !== current.eventDate.slice(0, 10)) {
    cal.invalidateForDateKey(merged.eventDate);
  }
}

export interface BoothBookingStore {
  bookings: BoothBooking[];
  hydrateFromRemote: () => Promise<void>;
  createBooking: (
    input: Omit<BoothBooking, 'id' | 'shortCode' | 'createdAt' | 'updatedAt' | 'paymentMethod' | 'paymentStatus'> &
      Partial<Pick<BoothBooking, 'paymentMethod' | 'paymentStatus'>> & { shortCode?: string },
  ) => Promise<BoothBooking>;
  updateBooking: (id: string, patch: Partial<BoothBooking>) => Promise<void>;
  setStatus: (id: string, status: BoothBookingStatus) => Promise<void>;
  assignStaff: (id: string, staffId?: string) => Promise<void>;
  setFinalQuote: (
    id: string,
    officialTotal: number,
    opts?: {
      quoteNotes?: string;
      status?: BoothBookingStatus;
      paymentAmount?: number;
      paymentMethod?: BoothPaymentMethod;
    },
  ) => Promise<void>;
  setPaymentAmount: (id: string, amount: number, method?: BoothPaymentMethod) => Promise<void>;
  setPaymentStatus: (id: string, paymentStatus: PaymentStatus) => Promise<void>;
  submitPaymentProof: (id: string, proofRef: string) => Promise<void>;
  markPaymentPaid: (id: string) => Promise<void>;
  markUnderReview: (id: string) => Promise<void>;
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
      paymentMethod: input.paymentMethod ?? 'gcash-or-bank',
      paymentStatus: input.paymentStatus ?? 'unpaid',
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
    await get().updateBooking(id, { status });
  },

  assignStaff: async (id, staffId) => {
    await get().updateBooking(id, { assignedStaffId: staffId });
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
    const paymentAmount = opts?.paymentAmount ?? officialTotal;
    const patch = {
      finalQuote,
      quoteNotes: opts?.quoteNotes?.trim() || booking.quoteNotes,
      quotedAt,
      status,
      paymentAmount,
      paymentMethod: opts?.paymentMethod ?? booking.paymentMethod,
      paymentStatus: booking.paymentStatus ?? 'unpaid',
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

  setPaymentAmount: async (id, amount, method) => {
    const patch: Partial<BoothBooking> = { paymentAmount: amount };
    if (method) patch.paymentMethod = method;
    await get().updateBooking(id, patch);
  },

  setPaymentStatus: async (id, paymentStatus) => {
    await get().updateBooking(id, { paymentStatus });
  },

  submitPaymentProof: async (id, proofRef) => {
    const prev = get().bookings;
    const snapshot = prev.find((b) => b.id === id);
    if (!snapshot) return;
    const now = new Date().toISOString();
    set({
      bookings: prev.map((b) =>
        b.id === id
          ? { ...b, paymentStatus: 'proof_submitted', paymentProofImage: proofRef, paymentProofUploadedAt: now, updatedAt: now }
          : b,
      ),
    });
    try {
      await orderingRepo.submitBoothPaymentProof(id, proofRef);
    } catch (err) {
      set({ bookings: prev });
      throw err;
    }
  },

  markPaymentPaid: async (id) => {
    const booking = get().bookings.find((b) => b.id === id);
    if (!booking) return;
    const now = new Date().toISOString();
    const amount = boothAmountDue(booking);
    await get().updateBooking(id, {
      paymentStatus: 'paid',
      paymentPaidAt: now,
      status: 'confirmed',
      paymentAmount: amount ?? booking.paymentAmount,
    });
  },

  markUnderReview: async (id) => {
    const booking = get().bookings.find((b) => b.id === id);
    if (!booking || booking.status !== 'submitted') return;
    await get().updateBooking(id, { status: 'under_review' });
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
