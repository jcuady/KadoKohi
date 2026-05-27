import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BoothAddonPricingType,
  BookingEstimate,
  BookingEstimateLineItem,
} from '../types/domain';
import { SEED_BOOKING_ESTIMATE_EXAMPLES } from '../data/seed';
import { newId } from '../lib/id';
import { useBoothCatalogStore } from './boothCatalogStore';

export interface BookingEstimateDraftInput {
  branchId?: string;
  packageId: string;
  guestCount: number;
  durationHours?: number;
  addonSelections: { addonId: string; qty?: number }[];
  taxRatePercent?: number;
  assumptions?: string[];
  notes?: string;
}

export interface BookingEstimateStore {
  estimates: BookingEstimate[];
  draft: BookingEstimate | null;
  calculateEstimate: (input: BookingEstimateDraftInput) => BookingEstimate;
  saveEstimate: (estimate: BookingEstimate) => void;
  removeEstimate: (id: string) => void;
  updateEstimateStatus: (id: string, status: BookingEstimate['status']) => void;
  setDraft: (estimate: BookingEstimate | null) => void;
  clearDraft: () => void;
  seed: () => void;
}

function computeAddonLine(
  pricingType: BoothAddonPricingType,
  baseQty: number,
  guestCount: number,
  durationHours: number,
): number {
  if (pricingType === 'per_head') return Math.max(1, guestCount);
  if (pricingType === 'per_hour') return Math.max(1, durationHours);
  return Math.max(1, baseQty);
}

function shortCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `EST-${n}`;
}

export const useBookingEstimateStore = create<BookingEstimateStore>()(
  persist(
    (set, get) => ({
      estimates: SEED_BOOKING_ESTIMATE_EXAMPLES,
      draft: null,

      calculateEstimate: (input) => {
        const catalog = useBoothCatalogStore.getState();
        const selectedPkg = catalog.packages.find((pkg) => pkg.id === input.packageId);
        const durationHours = input.durationHours ?? selectedPkg?.durationHours ?? 1;
        const lineItems: BookingEstimateLineItem[] = [];

        if (selectedPkg) {
          lineItems.push({
            id: newId(),
            sourceType: 'package',
            sourceId: selectedPkg.id,
            labelSnapshot: selectedPkg.name,
            descriptionSnapshot: selectedPkg.description,
            qty: 1,
            unitPrice: selectedPkg.basePrice,
            lineTotal: selectedPkg.basePrice,
          });
        }

        for (const selection of input.addonSelections) {
          const addon = catalog.addons.find((a) => a.id === selection.addonId);
          if (!addon) continue;
          const qty = computeAddonLine(
            addon.pricingType,
            selection.qty ?? 1,
            input.guestCount,
            durationHours,
          );
          lineItems.push({
            id: newId(),
            sourceType: 'addon',
            sourceId: addon.id,
            labelSnapshot: addon.name,
            descriptionSnapshot: addon.description,
            qty,
            unitPrice: addon.price,
            lineTotal: qty * addon.price,
          });
        }

        const subtotal = lineItems.reduce((sum, line) => sum + line.lineTotal, 0);
        const taxRate = input.taxRatePercent ?? 0;
        const tax = taxRate > 0 ? Math.round((subtotal * taxRate) / 100) : 0;
        const total = subtotal + tax;
        const now = new Date().toISOString();

        const estimate: BookingEstimate = {
          id: newId(),
          shortCode: shortCode(),
          branchId: input.branchId,
          lineItems,
          subtotal,
          tax,
          total,
          assumptions: input.assumptions,
          notes: input.notes,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        };

        set({ draft: estimate });
        return estimate;
      },

      saveEstimate: (estimate) =>
        set({
          estimates: [estimate, ...get().estimates.filter((e) => e.id !== estimate.id)],
        }),

      removeEstimate: (id) =>
        set({
          estimates: get().estimates.filter((estimate) => estimate.id !== id),
          draft: get().draft?.id === id ? null : get().draft,
        }),

      updateEstimateStatus: (id, status) =>
        set({
          estimates: get().estimates.map((estimate) =>
            estimate.id === id ? { ...estimate, status, updatedAt: new Date().toISOString() } : estimate,
          ),
          draft:
            get().draft && get().draft.id === id
              ? { ...get().draft, status, updatedAt: new Date().toISOString() }
              : get().draft,
        }),

      setDraft: (estimate) => set({ draft: estimate }),
      clearDraft: () => set({ draft: null }),
      seed: () => set({ estimates: SEED_BOOKING_ESTIMATE_EXAMPLES, draft: null }),
    }),
    { name: 'kado-booking-estimates-v1' },
  ),
);
