import type { Session } from '@supabase/supabase-js';
import { supabase } from './client';
import { recoverStaleAuthSession } from './authSession';

function hasAuthCallbackInUrl(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.hash.includes('access_token=')) return true;
  const params = new URLSearchParams(window.location.search);
  return params.has('code') || params.has('token_hash');
}

/** Remove tokens / codes from the address bar after Supabase processes the redirect. */
export function stripAuthParamsFromUrl(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.hash = '';
  for (const key of ['code', 'error', 'error_description', 'type', 'token_hash']) {
    url.searchParams.delete(key);
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', next);
}

function isPkceCrossDeviceError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return (
    msg.includes('pkce') ||
    msg.includes('code verifier') ||
    msg.includes('flow state') ||
    msg.includes('invalid request') && msg.includes('code')
  );
}

async function sessionFromUrlHash(): Promise<Session | null> {
  if (!supabase || typeof window === 'undefined') return null;
  if (!window.location.hash.includes('access_token=')) return null;
  await new Promise((resolve) => setTimeout(resolve, 0));
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  stripAuthParamsFromUrl();
  return data.session;
}

/**
 * Finish an email-confirm or magic-link redirect (token_hash, PKCE ?code=, or legacy hash tokens).
 * token_hash works across devices; PKCE ?code= only works on the browser that started sign-up.
 */
export async function completeSupabaseAuthRedirect(): Promise<{
  session: Session | null;
  error: Error | null;
}> {
  if (!supabase) {
    return { session: null, error: new Error('Supabase is not configured.') };
  }

  await recoverStaleAuthSession();

  const params = new URLSearchParams(window.location.search);
  const tokenHash = params.get('token_hash');
  const type = params.get('type');
  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
    });
    if (error) return { session: null, error };
    stripAuthParamsFromUrl();
    return { session: data.session, error: null };
  }

  const code = params.get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      if (isPkceCrossDeviceError(error)) {
        return {
          session: null,
          error: new Error(
            'This confirmation link must be opened on the same device where you signed up, or request a new confirmation email and open that link on this device.',
          ),
        };
      }
      return { session: null, error };
    }
    stripAuthParamsFromUrl();
    return { session: data.session, error: null };
  }

  const hashSession = await sessionFromUrlHash();
  if (hashSession) {
    return { session: hashSession, error: null };
  }

  if (!hasAuthCallbackInUrl()) {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { session: null, error };
    return { session: data.session, error: null };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) return { session: null, error };
  if (data.session) stripAuthParamsFromUrl();
  return { session: data.session, error: null };
}

export { hasAuthCallbackInUrl };
