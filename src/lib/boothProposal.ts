import type { BookingEstimate } from '../types/domain';
import { newId } from './id';
import { EVENT_PROPOSAL_PACKAGE_NAME } from './eventCalendar';

export function buildProposalEstimate(shortCode: string): BookingEstimate {
  const now = new Date().toISOString();
  return {
    id: newId(),
    shortCode,
    lineItems: [],
    subtotal: 0,
    total: 0,
    assumptions: ['Pricing to be discussed with our events team'],
    notes: 'Proposal only — final quote sent after review.',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}

export function isProposalBooking(packageId: string | undefined): boolean {
  return !packageId || packageId === 'event_proposal';
}

export function proposalPackageLabel(packageId: string, packageName: string): string {
  return isProposalBooking(packageId) ? EVENT_PROPOSAL_PACKAGE_NAME : packageName;
}
