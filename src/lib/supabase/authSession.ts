import type { AuthError } from '@supabase/supabase-js';
import { supabase } from './client';
import {
  clearSupabaseAuthStorageSync,
  hasLocalAuthStorage,
  pruneCorruptLocalAuthSync,
  purgeForeignSupabaseAuthKeysSync,
} from './authStorage';

export {
  clearSupabaseAuthStorageSync,
  getSupabaseAuthStorageKey,
  hasLocalAuthStorage,
  prepareAuthStorageSync,
  purgeForeignSupabaseAuthKeysSync,
} from './authStorage';

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

/** True when fetch/auth failed at the network layer (offline, DNS, CORS block). */
export function isNetworkAuthError(error: unknown): boolean {
  if (!error) return false;
  const msg = String(error instanceof Error ? error.message : error).toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    msg.includes('err_name_not_resolved') ||
    msg.includes('err_internet_disconnected')
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
    return 'Please wait about a minute and try again, or sign in if you already have an account.';
  }
  if (isNetworkAuthError(error)) {
    return 'Cannot reach Kado Kohi servers. Check your internet connection and try again.';
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
export async function invalidateLocalAuthSession(): Promise<void> {
  stopAuthAutoRefresh();
  clearSupabaseAuthStorageSync();
  if (!supabase) return;
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // Storage is already cleared; ignore lock errors.
  }
}

/** Resume background token refresh after a valid session is confirmed. */
export function startAuthAutoRefresh(): void {
  if (!supabase) return;
  try {
    supabase.auth.startAutoRefresh();
  } catch {
    // Older auth clients may not expose startAutoRefresh; safe to ignore.
  }
}

/** Pause background refresh during sign-out or before clearing bad tokens. */
export function stopAuthAutoRefresh(): void {
  if (!supabase) return;
  try {
    supabase.auth.stopAutoRefresh();
  } catch {
    // Safe to ignore when auth is not initialized.
  }
}

/** Clears local tokens only — no Auth API call (safe on the sign-up page). */
export async function clearLocalAuthBeforeSignup(): Promise<void> {
  await invalidateLocalAuthSession();
}

export async function recoverStaleAuthSession(): Promise<void> {
  if (!supabase) return;
  stopAuthAutoRefresh();
  purgeForeignSupabaseAuthKeysSync();
  pruneCorruptLocalAuthSync();
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        await invalidateLocalAuthSession();
      }
      return;
    }

    const session = data.session;
    if (!session) {
      if (hasLocalAuthStorage()) {
        await invalidateLocalAuthSession();
      }
      return;
    }

    const expiresAtMs = (session.expires_at ?? 0) * 1000;
    const needsRefresh = expiresAtMs > 0 && expiresAtMs < Date.now() + 60_000;
    if (needsRefresh) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError && isInvalidRefreshTokenError(refreshError)) {
        await invalidateLocalAuthSession();
      }
      return;
    }
  } catch (err) {
    if (isInvalidRefreshTokenError(err)) {
      await invalidateLocalAuthSession();
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
