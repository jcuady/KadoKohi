import { getAuthRedirectOrigin } from './siteUrl';

/** Password recovery redirect targets (must be allowlisted in Supabase Auth URL config). */
export function passwordResetRedirectUrl(): string {
  return `${getAuthRedirectOrigin()}/auth/reset-password`;
}

export function customerLoginPath(): string {
  return '/auth/login';
}

export function internalLoginPath(): string {
  return '/management-portal';
}

/** Forgot-password page path; optionally prefill email. */
export function forgotPasswordPath(variant: 'customer' | 'internal', email?: string): string {
  const base = variant === 'internal' ? '/management-portal/forgot-password' : '/auth/forgot-password';
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return base;
  return `${base}?email=${encodeURIComponent(trimmed)}`;
}
