import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import PasswordField from './PasswordField';
import { authRepo } from '../../lib/supabase/repositories/auth';
import { formatAuthErrorMessage } from '../../lib/supabase/authSession';
import { forgotPasswordPath } from '../../lib/authRedirects';

type Props = {
  /** Visual tone for the surrounding surface. */
  tone?: 'customer' | 'dashboard';
  email?: string;
  successMessage?: string;
};

/**
 * Signed-in password change: current → new → confirm.
 * Verifies current password via Auth (no email OTP).
 */
export default function ChangePasswordForm({
  tone = 'customer',
  email,
  successMessage = 'Password updated successfully.',
}: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isDash = tone === 'dashboard';
  const forgotHref = forgotPasswordPath(isDash ? 'internal' : 'customer', email);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!currentPassword.trim()) {
      setError('Enter your current password.');
      return;
    }
    if (newPassword.trim().length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await authRepo.changePassword(currentPassword, newPassword.trim());
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(successMessage);
    } catch (err) {
      setError(formatAuthErrorMessage(err, 'Unable to change password.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="flex items-start gap-3">
        <div
          className={
            isDash
              ? 'w-9 h-9 rounded-xl dash-card-alt border dash-border flex items-center justify-center shrink-0'
              : 'w-9 h-9 rounded-xl bg-kado-offwhite flex items-center justify-center shrink-0'
          }
        >
          <Lock className={`w-4 h-4 ${isDash ? 'dash-muted' : 'text-kado-dark/40'}`} />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-bold ${isDash ? 'dash-heading' : 'text-kado-dark'}`}>Password</p>
          <p className={`text-xs font-medium ${isDash ? 'dash-muted' : 'text-kado-dark/40'}`}>
            Enter your current password, then choose a new one (min. 8 characters). No email required.
          </p>
        </div>
      </div>

      <PasswordField
        id={`${tone}-current-password`}
        label="Current password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(ev) => setCurrentPassword(ev.target.value)}
        required
        className={isDash ? 'dash-input border dash-border' : undefined}
      />
      <PasswordField
        id={`${tone}-new-password`}
        label="New password"
        autoComplete="new-password"
        minLength={8}
        value={newPassword}
        onChange={(ev) => setNewPassword(ev.target.value)}
        required
        className={isDash ? 'dash-input border dash-border' : undefined}
      />
      <PasswordField
        id={`${tone}-confirm-password`}
        label="Confirm password"
        autoComplete="new-password"
        minLength={8}
        value={confirmPassword}
        onChange={(ev) => setConfirmPassword(ev.target.value)}
        required
        className={isDash ? 'dash-input border dash-border' : undefined}
      />

      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      {message ? <p className="text-xs font-medium text-emerald-700">{message}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className={
            isDash
              ? 'rounded-xl border dash-border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-heading hover:border-kado-red/40 hover:text-kado-red transition-colors disabled:opacity-60'
              : 'px-4 py-2 rounded-full border border-kado-dark/10 text-[10px] font-black uppercase tracking-widest text-kado-dark/70 hover:border-kado-red/30 hover:text-kado-red transition-all disabled:opacity-50'
          }
        >
          {busy ? 'Updating…' : 'Change password'}
        </button>
        <Link
          to={forgotHref}
          className={
            isDash
              ? 'text-[10px] font-bold uppercase tracking-wider dash-muted hover:text-kado-red transition-colors'
              : 'text-[10px] font-black uppercase tracking-widest text-kado-dark/40 hover:text-kado-red transition-colors'
          }
        >
          Forgot current password?
        </Link>
      </div>
    </form>
  );
}
