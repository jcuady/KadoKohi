export type ContactPurpose = 'collaboration' | 'book_us' | 'business' | 'partnership';

export interface ContactPurposeOption {
  id: ContactPurpose;
  label: string;
  description: string;
}

export const CONTACT_PURPOSES: ContactPurposeOption[] = [
  {
    id: 'collaboration',
    label: 'Collaboration',
    description: 'Content, creative projects, or co-marketing with Kado Kohi.',
  },
  {
    id: 'book_us',
    label: 'Book Us',
    description: 'Private events, booth reservations, and celebrations.',
  },
  {
    id: 'business',
    label: 'Business Inquiries',
    description: 'Wholesale, corporate orders, or general business questions.',
  },
  {
    id: 'partnership',
    label: 'Partnership',
    description: 'Brand partnerships and long-term collaborator opportunities.',
  },
];

export function purposeLabel(id: ContactPurpose): string {
  return CONTACT_PURPOSES.find((p) => p.id === id)?.label ?? id;
}

export function buildContactMailto(params: {
  to: string;
  purpose: ContactPurpose;
  name: string;
  fromEmail: string;
  message: string;
}): string {
  const label = purposeLabel(params.purpose);
  const subject = `[Kado Kohi] ${label} — ${params.name.trim()}`;
  const body = [
    `Purpose: ${label}`,
    `Name: ${params.name.trim()}`,
    `Reply-to email: ${params.fromEmail.trim()}`,
    '',
    '--- Message ---',
    '',
    params.message.trim(),
    '',
    '---',
    'Sent via kado-kohi.com/contact',
  ].join('\n');

  const to = params.to.trim();
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
