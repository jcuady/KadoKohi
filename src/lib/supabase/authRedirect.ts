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
  for (const key of ['code', 'error', 'error_description', 'type']) {
    url.searchParams.delete(key);
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', next);
}

/**
 * Finish an email-confirm or magic-link redirect (PKCE ?code= or legacy hash tokens).
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
  const code = params.get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return { session: null, error };
    stripAuthParamsFromUrl();
    return { session: data.session, error: null };
  }

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
