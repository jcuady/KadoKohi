import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { authRepo } from '../../lib/supabase/repositories/auth';
import { formatAuthErrorMessage } from '../../lib/supabase/authSession';
import CustomerAuthLayout from '../../components/auth/CustomerAuthLayout';
import AuthAlert from '../../components/auth/AuthAlert';
import PasswordField from '../../components/auth/PasswordField';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
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
      navigate('/auth/login', {
        replace: true,
        state: { notice: 'Password updated. Sign in with your new password.' },
      });
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

      {!ready ? (
        <AuthAlert variant="error">
          This reset link is invalid or expired.{' '}
          <Link to="/auth/forgot-password" className="underline font-semibold">
            Request a new one
          </Link>
          .
        </AuthAlert>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error && <AuthAlert variant="error">{error}</AuthAlert>}
          <PasswordField
            id="reset-password"
            label="New password"
            autoComplete="new-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
          />
          <PasswordField
            id="reset-confirm"
            label="Confirm password"
            autoComplete="new-password"
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
      )}
    </CustomerAuthLayout>
  );
}
