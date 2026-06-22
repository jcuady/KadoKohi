import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import type { Role } from '../../types/domain';
import PasswordField from './PasswordField';
import AuthAlert from './AuthAlert';
import { authRepo } from '../../lib/supabase/repositories/auth';
import { formatClerkErrorMessage } from '../../lib/clerk/errors';

type Props = {
  expectedRole: Extract<Role, 'admin' | 'barista' | 'staff'>;
};

/** Email + password only — password verified server-side; no device verification codes. */
export default function InternalSignInForm({ expectedRole }: Props) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/15 border-t-kado-red" />
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setError('');
    setSubmitting(true);
    try {
      const { ticket } = await authRepo.signInInternal({
        email: email.trim().toLowerCase(),
        password,
        expectedRole,
      });

      const result = await signIn.create({ strategy: 'ticket', ticket });
      if (result.status !== 'complete' || !result.createdSessionId) {
        setError('Sign-in could not be completed. Please try again.');
        return;
      }
      await setActive({ session: result.createdSessionId });
    } catch (err) {
      setError(formatClerkErrorMessage(err, 'Could not sign in. Check your email and password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#232323] p-6">
      {error && <AuthAlert variant="error" tone="internal">{error}</AuthAlert>}
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label htmlFor="internal-email" className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/70 mb-1.5">
            Email
          </label>
          <input
            id="internal-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            placeholder="you@kadokohi.com"
            required
          />
        </div>
        <PasswordField
          id="internal-password"
          label="Password"
          variant="internal"
          autoComplete="current-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
        />
        <div className="flex justify-end">
          <Link to="/management-portal/forgot-password" className="text-xs font-semibold text-kado-red hover:underline">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={submitting || !email.trim() || !password}
          className="w-full rounded-2xl bg-kado-red text-kado-cream py-3.5 font-bold uppercase tracking-[0.14em] text-xs hover:bg-kado-dark transition-colors disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
