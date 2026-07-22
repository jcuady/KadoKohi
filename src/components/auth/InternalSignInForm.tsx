import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Role } from '../../types/domain';
import PasswordField from './PasswordField';
import AuthAlert from './AuthAlert';
import { useAuthStore } from '../../store/authStore';
import { isValidEmail } from '../../lib/validation';
import { formatAuthErrorMessage } from '../../lib/supabase/authSession';
import { forgotPasswordPath } from '../../lib/authRedirects';
import { authRepo } from '../../lib/supabase/repositories/auth';

type Props = {
  expectedRole: Extract<Role, 'admin' | 'barista' | 'staff'>;
};

export default function InternalSignInForm({ expectedRole }: Props) {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const normalized = email.trim().toLowerCase();
      try {
        const status = await authRepo.getEmailStatus(normalized);
        if (status === 'missing') {
          setError('No account found with that email. Check the address or ask an admin to create your login.');
          return;
        }
        if (status === 'unconfirmed') {
          setError('Please confirm your email first — check your inbox for the Kado Kohi link.');
          return;
        }
      } catch {
        // Fall through to sign-in if status lookup fails.
      }

      await signIn(normalized, password);
      const profile = useAuthStore.getState().user;
      const role = profile?.role;
      if (!profile || role !== expectedRole) {
        await useAuthStore.getState().logout();
        if (role && role !== expectedRole) {
          setError(`This account is registered as ${role}. Switch to the ${role} tab.`);
        } else {
          setError('Invalid email or password.');
        }
        return;
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      if (/invalid login credentials|invalid credentials/i.test(raw)) {
        setError('Incorrect password. Try again or use Forgot password.');
      } else {
        setError(formatAuthErrorMessage(err, 'Could not sign in. Check your email and password.'));
      }
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
          <Link
            to={forgotPasswordPath('internal', email)}
            className="text-xs font-semibold text-kado-red hover:underline"
          >
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
