import { useEffect, type ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import {
  registerClerkTokenGetter,
  clearClerkTokenGetter,
  registerClerkSignOut,
  clearClerkSignOut,
} from '../lib/clerk/tokenBridge';
import { CLERK_SUPABASE_SETUP_HINT, waitForClerkSupabaseToken } from '../lib/clerk/supabaseToken';
import { useAuthStore } from '../store/authStore';

/** Wires Clerk session JWT into Supabase client and hydrates kk_profiles into authStore. */
export default function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, sessionId, getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const hydrateFromClerk = useAuthStore((s) => s.hydrateFromClerk);
  const clearUser = useAuthStore((s) => s.clearUser);
  const setHydrateError = useAuthStore((s) => s.setHydrateError);

  useEffect(() => {
    registerClerkTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
    registerClerkSignOut(async () => {
      await signOut();
    });
    return () => {
      clearClerkTokenGetter();
      clearClerkSignOut();
    };
  }, [getToken, signOut]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !sessionId || !clerkUser) {
      clearUser();
      return;
    }

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      '';
    const name =
      clerkUser.fullName?.trim() ||
      clerkUser.firstName?.trim() ||
      email.split('@')[0] ||
      'User';

    let cancelled = false;
    void (async () => {
      const token = await waitForClerkSupabaseToken(getToken);
      if (cancelled) return;
      if (!token) {
        setHydrateError(`Could not obtain a Clerk session for Supabase. ${CLERK_SUPABASE_SETUP_HINT}`);
        return;
      }
      await hydrateFromClerk(clerkUser.id, email, name);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isLoaded,
    isSignedIn,
    sessionId,
    clerkUser?.id,
    clerkUser,
    hydrateFromClerk,
    clearUser,
    setHydrateError,
    getToken,
  ]);

  return <>{children}</>;
}
