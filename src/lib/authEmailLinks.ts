/** Supabase email templates: use token_hash so confirm works on any device (not PKCE-only). */
export function buildAuthEmailLink(input: {
  redirectTo: string;
  tokenHash: string;
  type: 'signup' | 'recovery' | 'email' | 'invite' | 'magiclink' | 'email_change';
}): string {
  const base = input.redirectTo.replace(/\/$/, '');
  const params = new URLSearchParams({
    token_hash: input.tokenHash,
    type: input.type,
  });
  return `${base}?${params.toString()}`;
}
