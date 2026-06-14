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

function invokePayload(data: unknown): { ok?: boolean; error?: string; emailConfigured?: boolean } | null {
  if (!data || typeof data !== 'object') return null;
  return data as { ok?: boolean; error?: string; emailConfigured?: boolean };
}

function isRateLimited(apiError: string, errMsg: string): boolean {
  return (
    apiError.includes('Too many requests') ||
    errMsg.includes('429') ||
    errMsg.toLowerCase().includes('too many requests')
  );
}

function isEmailNotConfigured(apiError: string, errMsg: string, payload: ReturnType<typeof invokePayload>): boolean {
  return (
    payload?.emailConfigured === false ||
    errMsg.includes('503') ||
    /not configured|email service not configured/i.test(apiError) ||
    /not configured|email service not configured/i.test(errMsg)
  );
}

/** Sends to kadocoffeeph@gmail.com via edge function, or opens mailto when delivery fails. */
export async function sendInboundEmail(input: InboundEmailInput): Promise<SendInboundEmailResult> {
  if (!supabase) {
    return { ok: true, via: 'mailto', mailto: mailtoFallback(input) };
  }

  const body =
    input.kind === 'kado_circle'
      ? { kind: 'kado_circle', email: input.email.trim().toLowerCase() }
      : {
          kind: 'contact',
          email: input.email.trim().toLowerCase(),
          name: input.name.trim(),
          message: input.message.trim(),
          purpose: purposeLabel(input.purpose),
        };

  const { data, error } = await supabase.functions.invoke('kk-send-contact', { body });
  const payload = invokePayload(data);
  const apiError = payload?.error?.trim() ?? '';
  const errMsg = error instanceof Error ? error.message : String(error ?? '');

  if (payload?.ok) {
    return { ok: true, via: 'resend' };
  }

  if (isRateLimited(apiError, errMsg)) {
    return {
      ok: false,
      message: apiError || 'Too many requests. Please wait a few minutes and try again.',
    };
  }

  if (isEmailNotConfigured(apiError, errMsg, payload) || error || apiError) {
    return { ok: true, via: 'mailto', mailto: mailtoFallback(input) };
  }

  return { ok: true, via: 'mailto', mailto: mailtoFallback(input) };
}

export function validateContactForm(input: {
  name: string;
  email: string;
  message: string;
}): string | null {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const message = input.message.trim();

  if (name.length < 2) return 'Please enter your full name (at least 2 characters).';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
  if (message.length < 10) return 'Please write a bit more in your message (at least 10 characters).';
  return null;
}
