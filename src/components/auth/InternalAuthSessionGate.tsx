import type { ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useAuthStore } from '../../store/authStore';
import AuthAlert from './AuthAlert';

interface InternalAuthSessionGateProps {
  children: ReactNode;
  loadingMessage?: string;
}

/**
 * Management portal: show login form while signed out; after sign-in, wait for kk_profiles only.
 */
export default function InternalAuthSessionGate({
  children,
  loadingMessage = 'Completing sign-in…',
}: InternalAuthSessionGateProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const profile = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const hydrateError = useAuthStore((s) => s.hydrateError);
  const hydrateFromClerk = useAuthStore((s) => s.hydrateFromClerk);

  if (!isLoaded) {
    return <InternalSpinner message={loadingMessage} />;
  }

  if (!isSignedIn) {
    return <>{children}</>;
  }

  if (loading || !profile) {
    if (!loading && !profile) {
      const email =
        clerkUser?.primaryEmailAddress?.emailAddress ??
        clerkUser?.emailAddresses[0]?.emailAddress ??
        '';
      const name =
        clerkUser?.fullName?.trim() ||
        clerkUser?.firstName?.trim() ||
        email.split('@')[0] ||
        'User';

      return (
        <div className="rounded-2xl border border-white/10 bg-[#232323] p-6">
          {hydrateError && <AuthAlert variant="error" tone="internal">{hydrateError}</AuthAlert>}
          <p className="text-sm text-white/65 mb-4 text-center">
            Loading your team profile…
          </p>
          <button
            type="button"
            className="w-full rounded-2xl bg-kado-red text-kado-cream py-3.5 font-bold uppercase tracking-[0.14em] text-xs hover:bg-kado-dark transition-colors"
            onClick={() => {
              if (clerkUser?.id) void hydrateFromClerk(clerkUser.id, email, name);
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return <InternalSpinner message="Loading your team profile…" />;
  }

  return <>{children}</>;
}

function InternalSpinner({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/15 border-t-kado-red" />
      <p className="text-sm text-white/60">{message}</p>
    </div>
  );
}
