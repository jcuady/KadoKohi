import { hasAuthCallbackInUrl } from './supabase/authRedirect';

const AUTH_HANDLER_PREFIXES = ['/auth/confirm', '/auth/reset-password', '/auth/login'];

function isAuthHandlerPath(pathname: string): boolean {
  return AUTH_HANDLER_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function recoveryRedirectTarget(search: string, hash: string): boolean {
  const params = new URLSearchParams(search);
  const type = params.get('type')?.toLowerCase();
  if (type === 'recovery') return true;
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
  return hashParams.get('type')?.toLowerCase() === 'recovery';
}

/**
 * Email links sometimes land on `/` or another public route when Site URL ≠ confirm path.
 * Forward auth tokens to the dedicated handler before React Router renders a 404 shell.
 */
export function redirectAuthCallbackToHandler(): boolean {
  if (typeof window === 'undefined' || !hasAuthCallbackInUrl()) return false;

  const { pathname, search, hash } = window.location;
  if (isAuthHandlerPath(pathname)) return false;

  const target = recoveryRedirectTarget(search, hash) ? '/auth/reset-password' : '/auth/confirm';
  window.location.replace(`${target}${search}${hash}`);
  return true;
}
