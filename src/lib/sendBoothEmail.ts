import type { BookingPageKind } from './bookingPageKinds';
import { buildBoothProposalTeamHtml, buildBoothQuoteEmailHtml, type BoothProposalSubmittedInput, type BoothQuoteEmailInput } from './boothQuoteEmail';
import { supabase } from './supabase/client';

export async function sendBoothProposalSubmittedEmail(input: BoothProposalSubmittedInput): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.functions.invoke('kk-send-contact', {
      body: {
        kind: 'booth_proposal',
        email: input.contactEmail.trim().toLowerCase(),
        name: input.contactName.trim(),
        phone: input.contactPhone.trim(),
        referenceCode: input.referenceCode,
        bookingKind: input.bookingKind,
        eventName: input.eventName,
        guestCount: input.guestCount,
        eventDate: input.eventDate,
        startTime: input.startTime,
        endTime: input.endTime,
        message: input.message?.trim() || undefined,
        html: buildBoothProposalTeamHtml(input),
      },
    });
    if (error) return false;
    return !!(data && typeof data === 'object' && (data as { ok?: boolean }).ok);
  } catch {
    return false;
  }
}

export async function sendBoothQuoteToClient(input: BoothQuoteEmailInput): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Email is not configured.' };
  const html = buildBoothQuoteEmailHtml(input);
  try {
    const { data, error } = await supabase.functions.invoke('kk-send-contact', {
      body: {
        kind: 'booth_quote',
        email: input.booking.contactEmail.trim().toLowerCase(),
        name: input.booking.contactName.trim(),
        referenceCode: input.booking.shortCode,
        quotedTotal: input.quotedTotal,
        customMessage: input.customMessage?.trim() || undefined,
        html,
      },
    });
    const payload = (data ?? {}) as { ok?: boolean; error?: string; emailConfigured?: boolean };
    if (error) {
      return { ok: false, error: error.message };
    }
    if (!payload.ok) {
      return { ok: false, error: payload.error || 'Could not send email.' };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not send email.' };
  }
}
