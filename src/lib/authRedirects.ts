/** Password recovery redirect targets (must be allowlisted in Supabase Auth URL config). */
export function passwordResetRedirectUrl(): string {
  if (typeof window === 'undefined') return '/auth/reset-password';
  return `${window.location.origin}/auth/reset-password`;
}

export function customerLoginPath(): string {
  return '/auth/login';
}

export function internalLoginPath(): string {
  return '/management-portal';
}
