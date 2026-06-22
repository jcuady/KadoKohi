import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AuthAlert from './auth/AuthAlert';
import { formatClerkErrorMessage } from '../lib/clerk/errors';

interface AuthSessionGateProps {
  children: ReactNode;
  /** Shown while Clerk session or kk_profiles row is loading. */
  loadingMessage?: string;
}

/**
 * Wraps auth pages: handles profile hydration and email verification (email/password only).
 * Google / social sign-in skips verification — email is verified by the provider.
 */
export default function AuthSessionGate({
  children,
  loadingMessage = 'Signing you in…',
}: AuthSessionGateProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const profile = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const hydrateError = useAuthStore((s) => s.hydrateError);
  const hydrateFromClerk = useAuthStore((s) => s.hydrateFromClerk);

  if (!isLoaded) {
    return <AuthSpinner message={loadingMessage} />;
  }

  const hasSocialLogin = (clerkUser?.externalAccounts?.length ?? 0) > 0;
  const needsEmailVerification =
    isSignedIn && clerkUser && !clerkUser.hasVerifiedEmailAddress && !hasSocialLogin;

  if (needsEmailVerification) {
    return <EmailVerificationPanel />;
  }

  if (isSignedIn && loading) {
    return <AuthSpinner message="Loading your Kado Kohi account…" />;
  }

  if (isSignedIn && !profile && !loading) {
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
      <div className="max-w-md mx-auto px-4">
        {hydrateError && <AuthAlert variant="error">{hydrateError}</AuthAlert>}
        <p className="text-sm text-kado-dark/65 mb-4 text-center">
          We could not finish loading your account profile. This usually clears after a moment.
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
        <Link
          to="/"
          className="mt-4 block text-center text-sm font-semibold text-kado-dark/45 hover:text-kado-red"
        >
          Back to site
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

/** Email + password accounts must verify before Clerk session is fully active. */
function EmailVerificationPanel() {
  const { user } = useUser();
  const emailAddress = user?.primaryEmailAddress;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!emailAddress || emailAddress.verification?.status === 'verified') return;
    let cancelled = false;
    void emailAddress.prepareVerification({ strategy: 'email_code' }).then(() => {
      if (!cancelled) setSent(true);
    }).catch((err) => {
      if (!cancelled) {
        setError(formatClerkErrorMessage(err, 'Could not send verification email.'));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [emailAddress]);

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailAddress) return;
    setError('');
    setSubmitting(true);
    try {
      await emailAddress.attemptVerification({ code: code.trim() });
      window.location.reload();
    } catch (err) {
      setError(formatClerkErrorMessage(err, 'Invalid verification code.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!emailAddress) return;
    setError('');
    try {
      await emailAddress.prepareVerification({ strategy: 'email_code' });
      setSent(true);
    } catch (err) {
      setError(formatClerkErrorMessage(err, 'Could not resend the code.'));
    }
  };

  const email = emailAddress?.emailAddress ?? 'your email';

  return (
    <div className="max-w-md mx-auto px-4">
      <h2 className="font-display text-2xl font-bold text-kado-dark mb-2 text-center">Check your email</h2>
      <p className="text-sm text-kado-dark/65 mb-4 text-center">
        {sent ? (
          <>
            We sent a 6-digit code to <span className="font-semibold text-kado-dark">{email}</span>. Check your
            inbox and spam folder.
          </>
        ) : (
          <>Sending a verification code to <span className="font-semibold text-kado-dark">{email}</span>…</>
        )}
      </p>

      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      <form onSubmit={(e) => void handleVerify(e)} className="space-y-4">
        <div>
          <label htmlFor="verify-code" className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5">
            Verification code
          </label>
          <input
            id="verify-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-xl border border-kado-dark/12 bg-white px-4 py-3 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            placeholder="123456"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !code.trim()}
          className="w-full rounded-2xl bg-kado-red text-kado-cream py-3.5 font-bold uppercase tracking-[0.14em] text-xs hover:bg-kado-dark transition-colors disabled:opacity-60"
        >
          {submitting ? 'Verifying…' : 'Verify & continue'}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleResend()}
          className="w-full text-xs font-semibold text-kado-dark/50 hover:text-kado-red disabled:opacity-50"
        >
          Resend code
        </button>
        <button
          type="button"
          className="w-full text-xs font-semibold text-kado-dark/45 hover:text-kado-red"
          onClick={() => window.location.reload()}
        >
          Already verified? Refresh this page
        </button>
      </form>
    </div>
  );
}

function AuthSpinner({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-kado-dark/15 border-t-kado-red" />
      <p className="text-sm text-kado-dark/60">{message}</p>
    </div>
  );
}
