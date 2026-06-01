import type { AuthError } from '@supabase/supabase-js';
import { supabase } from './client';

/** True when localStorage holds a refresh token Supabase can no longer use. */
export function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const msg = String((error as AuthError).message ?? error).toLowerCase();
  const status = (error as AuthError).status;
  return (
    status === 400 &&
    (msg.includes('refresh token') ||
      msg.includes('invalid refresh') ||
      msg.includes('session not found'))
  );
}

export function isRateLimitAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const status = (error as AuthError).status;
  return status === 429 || String((error as AuthError).message ?? '').toLowerCase().includes('rate limit');
}

/** User-facing copy for signup / login failures. */
export function formatAuthErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (isRateLimitAuthError(error)) {
    return 'Too many attempts. Please wait a few minutes, then try again.';
  }
  if (isInvalidRefreshTokenError(error)) {
    return 'Your session expired. Please try signing up again.';
  }
  if (/already registered|already exists|user already/i.test(lower)) {
    return 'That email is already registered. Try signing in instead.';
  }
  if (/password/i.test(lower) && /weak|short|least/i.test(lower)) {
    return 'Password is too weak. Use at least 8 characters.';
  }
  if (/invalid email|email format/i.test(lower)) {
    return 'Enter a valid email address.';
  }
  if (/signup is disabled|signups not allowed/i.test(lower)) {
    return 'New sign-ups are temporarily disabled. Please contact us for help.';
  }
  if (msg.trim()) return msg;
  return fallback;
}

/** Drop corrupted local auth state so sign-up/sign-in are not blocked by refresh loops. */
const AUTH_STORAGE_KEY_SUFFIX = '-auth-token';

function hasLocalAuthStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!url) return false;
    const projectRef = new URL(url).hostname.split('.')[0];
    const key = `sb-${projectRef}${AUTH_STORAGE_KEY_SUFFIX}`;
    return Boolean(localStorage.getItem(key));
  } catch {
    return false;
  }
}

export async function recoverStaleAuthSession(): Promise<void> {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error && isInvalidRefreshTokenError(error)) {
      await supabase.auth.signOut({ scope: 'local' });
      return;
    }
    // getSession() can return null session while a bad refresh token remains in storage.
    if (!data.session && hasLocalAuthStorage()) {
      await supabase.auth.signOut({ scope: 'local' });
    }
  } catch (err) {
    if (isInvalidRefreshTokenError(err)) {
      await supabase.auth.signOut({ scope: 'local' });
    }
  }
}

let authListenerPaused = false;

export function pauseAuthListener(): void {
  authListenerPaused = true;
}

export function resumeAuthListener(): void {
  authListenerPaused = false;
}

export function isAuthListenerPaused(): boolean {
  return authListenerPaused;
}
