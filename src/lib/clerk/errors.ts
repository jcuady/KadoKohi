/** Map Clerk / network errors to short user-facing copy. */
export function formatClerkErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const row = err as { errors?: Array<{ message?: string; longMessage?: string; code?: string }>; message?: string };
    const first = row.errors?.[0];
    const msg = first?.longMessage ?? first?.message ?? row.message;
    if (msg && typeof msg === 'string') {
      if (msg.includes('needs_client_trust') || first?.code === 'too_many_requests') {
        return 'Too many sign-in attempts or device verification required. Wait a minute, then try again — you may receive a verification code by email.';
      }
      return msg;
    }
  }
  if (err instanceof Error && err.message) {
    if (err.message.includes('needs_client_trust')) {
      return 'Device verification is required. Enter the email code we send after you sign in with your password.';
    }
    return err.message;
  }
  return fallback;
}
