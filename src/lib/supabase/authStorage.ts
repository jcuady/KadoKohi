/** Sync localStorage helpers — no Supabase client import (safe before createClient). */

const AUTH_STORAGE_KEY_SUFFIX = '-auth-token';

export function getSupabaseAuthStorageKey(
  supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL as string | undefined,
): string | null {
  if (!supabaseUrl) return null;
  try {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    return `sb-${projectRef}${AUTH_STORAGE_KEY_SUFFIX}`;
  } catch {
    return null;
  }
}

/** Drop auth tokens from other Supabase projects (common after switching .env). */
export function purgeForeignSupabaseAuthKeysSync(
  supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL as string | undefined,
): void {
  if (typeof window === 'undefined') return;
  const validKey = getSupabaseAuthStorageKey(supabaseUrl);
  if (!validKey) return;

  const staleKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith('sb-') && key.endsWith(AUTH_STORAGE_KEY_SUFFIX) && key !== validKey) {
      staleKeys.push(key);
    }
  }
  staleKeys.forEach((key) => localStorage.removeItem(key));
}

/** Remove current-project auth token without calling the Auth API. */
export function clearSupabaseAuthStorageSync(
  supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL as string | undefined,
): void {
  if (typeof window === 'undefined') return;
  const key = getSupabaseAuthStorageKey(supabaseUrl);
  if (key) localStorage.removeItem(key);
}

export function hasLocalAuthStorage(
  supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL as string | undefined,
): boolean {
  if (typeof window === 'undefined') return false;
  const key = getSupabaseAuthStorageKey(supabaseUrl);
  if (!key) return false;
  return Boolean(localStorage.getItem(key));
}

/** Run before createClient so GoTrue does not refresh a wrong-project token. */
export function prepareAuthStorageSync(
  supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL as string | undefined,
): void {
  purgeForeignSupabaseAuthKeysSync(supabaseUrl);
}
