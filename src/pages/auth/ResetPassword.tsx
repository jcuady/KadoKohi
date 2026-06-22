import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { authRepo } from '../../lib/supabase/repositories/auth';
import { formatAuthErrorMessage } from '../../lib/supabase/authSession';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { customerLoginPath, internalLoginPath } from '../../lib/authRedirects';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthBrandMark from '../../components/auth/AuthBrandMark';
import PasswordField from '../../components/auth/PasswordField';
import type { Role } from '../../types/domain';

const INTERNAL_ROLES: Role[] = ['admin', 'barista', 'staff'];

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tone, setTone] = useState<'customer' | 'internal'>('customer');

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      setError('Sign-in is not configured. Contact support.');
      return;
    }

    let cancelled = false;

    const markReady = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session?.user) {
        const profile = await orderingRepo.fetchUserById(data.session.user.id);
        const role = profile?.role ?? (data.session.user.user_metadata?.role as Role | undefined);
        if (role && INTERNAL_ROLES.includes(role)) {
          setTone('internal');
        }
        setReady(true);
      }
      setChecking(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'INITIAL_SESSION' && session)) {
        void markReady();
      }
    });

    void markReady();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.trim().length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authRepo.updatePassword(password);
      const loginPath = tone === 'internal' ? internalLoginPath() : customerLoginPath();
      navigate(loginPath, {
        replace: true,
        state: { notice: 'Password updated. Sign in with your new password.' },
      });
    } catch (err) {
      setError(formatAuthErrorMessage(err, 'Could not update password. Request a new reset link and try again.'));
      setSubmitting(false);
    }
  };

  const isInternal = tone === 'internal';

  const panel = (
    <>
      <AuthBrandMark
        variant={tone}
        subtitle="Choose a strong password you have not used here before."
      />

      <h1
        className={`font-display text-2xl font-bold mt-6 mb-6 ${isInternal ? 'text-white' : 'text-kado-dark'}`}
      >
        Set new password
      </h1>

      {checking && (
        <p className={`text-sm mb-4 ${isInternal ? 'text-white/60' : 'text-kado-dark/60'}`}>
          Verifying reset link…
        </p>
      )}

      {!checking && !ready && (
        <AuthAlert variant="error" tone={tone}>
          This reset link is invalid or has expired.{' '}
          <Link
            to={isInternal ? '/management-portal/forgot-password' : '/auth/forgot-password'}
            className="font-bold underline underline-offset-2"
          >
            Request a new link
          </Link>
          .
        </AuthAlert>
      )}

      {error && <AuthAlert variant="error" tone={tone}>{error}</AuthAlert>}

      {ready && (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <PasswordField
            id="reset-password"
            label="New password"
            variant={tone}
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="8+ characters"
            required
          />
          <PasswordField
            id="reset-confirm"
            label="Confirm password"
            variant={tone}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError('');
            }}
            placeholder="Repeat password"
            required
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-kado-red text-kado-cream py-3.5 font-bold uppercase tracking-[0.14em] text-xs hover:bg-kado-dark transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}

      <Link
        to={isInternal ? internalLoginPath() : customerLoginPath()}
        className={`mt-6 block text-center text-sm font-semibold hover:text-kado-red transition-colors ${
          isInternal ? 'text-white/55' : 'text-kado-dark/50'
        }`}
      >
        Back to sign in
      </Link>
    </>
  );

  if (isInternal) {
    return (
      <div className="min-h-dvh bg-[#141414] flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#1b1b1b] p-8 md:p-10 shadow-2xl">
          {panel}
        </div>
      </div>
    );
  }

  return (
    <div className="customer-surface min-h-dvh bg-kado-cream flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[2rem] border border-kado-dark/10 bg-kado-offwhite p-8 md:p-10 shadow-2xl">
        {panel}
      </div>
    </div>
  );
}
