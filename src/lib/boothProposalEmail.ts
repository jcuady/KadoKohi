import type { BoothBookingOccasion } from '../types/domain';

const OCCASION_LABELS: Record<BoothBookingOccasion, string> = {
  birthday: 'Birthday',
  wedding: 'Wedding',
  corporate: 'Corporate',
  private_party: 'Private Party',
  engagement: 'Engagement',
  other: 'Other',
};

export function occasionLabel(id: BoothBookingOccasion): string {
  return OCCASION_LABELS[id] ?? id;
}

export function buildBoothProposalMailto(params: {
  to: string;
  referenceCode: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  eventName: string;
  occasion: BoothBookingOccasion;
  guestCount: number;
  eventDate: string;
  startTime: string;
  endTime: string;
  message?: string;
}): string {
  const subject = `[Kado Kohi] Event proposal — ${params.eventName.trim()} (${params.referenceCode})`;
  const body = [
    'Hi Kado Kohi Events team,',
    '',
    'I would like to submit an event proposal and discuss pricing and details.',
    '',
    `Reference: ${params.referenceCode}`,
    `Event: ${params.eventName.trim()}`,
    `Occasion: ${occasionLabel(params.occasion)}`,
    `Preferred date: ${params.eventDate}`,
    `Time: ${params.startTime} – ${params.endTime}`,
    `Guests: ${params.guestCount}`,
    '',
    '--- Contact ---',
    `Name: ${params.contactName.trim()}`,
    `Email: ${params.contactEmail.trim()}`,
    `Phone: ${params.contactPhone.trim()}`,
    '',
    params.message?.trim() ? `--- Notes ---\n\n${params.message.trim()}\n` : '',
    '---',
    'Submitted via kadokohi.com/book/booth',
  ]
    .filter(Boolean)
    .join('\n');

  const to = params.to.trim();
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
