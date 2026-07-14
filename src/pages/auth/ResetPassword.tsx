import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { authRepo } from '../../lib/supabase/repositories/auth';
import { formatAuthErrorMessage } from '../../lib/supabase/authSession';
import { completeSupabaseAuthRedirect, hasAuthCallbackInUrl } from '../../lib/supabase/authRedirect';
import { customerLoginPath, forgotPasswordPath, internalLoginPath } from '../../lib/authRedirects';
import { isInternalRole } from '../../lib/roles';
import { useAuthStore } from '../../store/authStore';
import CustomerAuthLayout from '../../components/auth/CustomerAuthLayout';
import AuthAlert from '../../components/auth/AuthAlert';
import PasswordField from '../../components/auth/PasswordField';

type Phase = 'booting' | 'ready' | 'invalid';

const SUCCESS_NOTICE = 'Password updated. Sign in with your new password.';

export default function ResetPassword() {
  const navigate = useNavigate();
  const initFromSupabase = useAuthStore((s) => s.initFromSupabase);
  const logout = useAuthStore((s) => s.logout);

  const [phase, setPhase] = useState<Phase>('booting');
  const [bootError, setBootError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setPhase('invalid');
      setBootError('Auth is not configured.');
      return;
    }
    let cancelled = false;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    const markReady = () => {
      if (cancelled) return;
      setPhase('ready');
      setBootError('');
    };

    const markInvalid = (message: string) => {
      if (cancelled) return;
      setPhase('invalid');
      setBootError(message);
    };

    void (async () => {
      const hadCallback = hasAuthCallbackInUrl();
      const { session, error: redirectError } = await completeSupabaseAuthRedirect();
      if (cancelled) return;

      if (redirectError) {
        markInvalid(formatAuthErrorMessage(redirectError, 'This reset link is invalid or expired.'));
        return;
      }
      // Only accept a session created from the email recovery callback — not an ordinary logged-in visit.
      if (hadCallback && session) {
        markReady();
        return;
      }
      settleTimer = setTimeout(() => {
        if (cancelled) return;
        setPhase((current) => {
          if (current === 'ready') return current;
          return 'invalid';
        });
        setBootError((prev) => prev || 'This reset link is invalid or expired.');
      }, hadCallback ? 2500 : 600);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        markReady();
      }
    });

    return () => {
      cancelled = true;
      if (settleTimer) clearTimeout(settleTimer);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
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
      await initFromSupabase();
      const role = useAuthStore.getState().user?.role;
      await logout();
      const dest = role && isInternalRole(role) ? internalLoginPath() : customerLoginPath();
      navigate(dest, { replace: true, state: { notice: SUCCESS_NOTICE } });
    } catch (err) {
      setError(formatAuthErrorMessage(err, 'Could not update password. Request a new reset link.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerAuthLayout variant="login">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-kado-dark mb-1.5">Set new password</h1>
      <p className="text-sm text-kado-dark/60 mb-5 sm:mb-6">Choose a strong password for your Kado Kohi account.</p>

      {phase === 'booting' ? (
        <div className="flex flex-col items-center gap-3 py-10" aria-busy="true" aria-label="Verifying reset link">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-kado-dark/15 border-t-kado-red" />
          <p className="text-sm text-kado-dark/55">Verifying your reset link…</p>
        </div>
      ) : null}

      {phase === 'invalid' ? (
        <AuthAlert variant="error">
          {bootError || 'This reset link is invalid or expired.'}{' '}
          <Link to={forgotPasswordPath('customer')} className="underline font-semibold">
            Request a new one
          </Link>
          .
        </AuthAlert>
      ) : null}

      {phase === 'ready' ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error && <AuthAlert variant="error">{error}</AuthAlert>}
          <PasswordField
            id="reset-password"
            label="New password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
          />
          <PasswordField
            id="reset-confirm"
            label="Confirm password"
            autoComplete="new-password"
            minLength={8}
            value={confirm}
            onChange={(ev) => setConfirm(ev.target.value)}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-kado-red text-kado-cream py-3.5 font-bold uppercase tracking-[0.14em] text-xs hover:bg-kado-dark transition-colors disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </form>
      ) : null}
    </CustomerAuthLayout>
  );
}
