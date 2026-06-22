type ClerkGetToken = (options?: { template?: string; skipCache?: boolean }) => Promise<string | null>;

/**
 * Clerk → Supabase third-party auth (2025+): use the Clerk **session token** directly.
 * The deprecated JWT template `supabase` returns 404 when the native integration is enabled.
 */
export async function waitForClerkSupabaseToken(
  getToken: ClerkGetToken,
  options?: { maxAttempts?: number; delayMs?: number },
): Promise<string | null> {
  const maxAttempts = options?.maxAttempts ?? 15;
  const delayMs = options?.delayMs ?? 250;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const token = await getToken({ skipCache: attempt > 0 });
      if (token) return token;
    } catch {
      // Clerk may throw while the OAuth callback is still completing.
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}

export const CLERK_SUPABASE_SETUP_HINT =
  'Enable Clerk → Integrations → Supabase (native third-party auth). Do not use the deprecated JWT template.';
