import { supabase } from './supabase/client';
import {
  KADO_INBOUND_EMAIL,
  buildContactMailto,
  buildKadoCircleMailto,
  purposeLabel,
  type ContactPurpose,
} from './contactEmail';

export type KadoCircleEmailInput = {
  kind: 'kado_circle';
  email: string;
};

export type ContactFormEmailInput = {
  kind: 'contact';
  email: string;
  name: string;
  message: string;
  purpose: ContactPurpose;
};

export type InboundEmailInput = KadoCircleEmailInput | ContactFormEmailInput;

export type SendInboundEmailResult =
  | { ok: true; via: 'resend' }
  | { ok: true; via: 'mailto'; mailto: string }
  | { ok: false; message: string };

function mailtoFallback(input: InboundEmailInput): string {
  if (input.kind === 'kado_circle') {
    return buildKadoCircleMailto({ email: input.email });
  }
  return buildContactMailto({
    to: KADO_INBOUND_EMAIL,
    purpose: input.purpose,
    name: input.name,
    fromEmail: input.email,
    message: input.message,
  });
}

/** Sends to kadocoffeeph@gmail.com via edge function, or opens mailto when Resend is not configured. */
export async function sendInboundEmail(input: InboundEmailInput): Promise<SendInboundEmailResult> {
  if (!supabase) {
    return { ok: true, via: 'mailto', mailto: mailtoFallback(input) };
  }

  const body =
    input.kind === 'kado_circle'
      ? { kind: 'kado_circle', email: input.email }
      : {
          kind: 'contact',
          email: input.email,
          name: input.name,
          message: input.message,
          purpose: purposeLabel(input.purpose),
        };

  const { data, error } = await supabase.functions.invoke('kk-send-contact', { body });

  const payload =
    data && typeof data === 'object'
      ? (data as { ok?: boolean; error?: string; emailConfigured?: boolean })
      : null;

  if (payload?.ok) {
    return { ok: true, via: 'resend' };
  }

  const notConfigured =
    payload?.emailConfigured === false ||
    error?.message?.includes('503') ||
    error?.message?.includes('not configured') ||
    error?.message?.includes('Email service not configured');

  if (notConfigured) {
    return { ok: true, via: 'mailto', mailto: mailtoFallback(input) };
  }

  const contextError =
    error?.context && typeof error.context === 'object'
      ? String((error.context as { error?: string }).error ?? '')
      : '';
  const apiError = payload?.error || contextError || error?.message;

  return {
    ok: false,
    message: apiError?.trim() || 'Could not send your message. Please try again.',
  };
}
