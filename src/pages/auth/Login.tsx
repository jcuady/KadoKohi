import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isInternalRole } from '../../lib/roles';
import { isValidEmail } from '../../lib/validation';
import { formatAuthErrorMessage } from '../../lib/supabase/authSession';
import AuthAlert from '../../components/auth/AuthAlert';
import CustomerAuthLayout from '../../components/auth/CustomerAuthLayout';
import PasswordField from '../../components/auth/PasswordField';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAuthStore((s) => s.signIn);
  const notice = (location.state as { notice?: string } | null)?.notice;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: FormEvent) => {
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
      await signIn(email.trim().toLowerCase(), password);
      const role = useAuthStore.getState().user?.role;
      if (role && isInternalRole(role)) {
        await useAuthStore.getState().logout();
        setError('This sign-in is for customer accounts only. Staff should use the management portal.');
        return;
      }
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith('/account') ? from : '/account', { replace: true });
    } catch (err) {
      setError(formatAuthErrorMessage(err, 'Invalid credentials. Please check your email and password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerAuthLayout variant="login">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-kado-dark mb-1.5">Sign in</h1>
      <p className="text-sm text-kado-dark/60 mb-5 sm:mb-6">Welcome back to Kado Kohi.</p>

      {notice && !error && <AuthAlert variant="success">{notice}</AuthAlert>}
      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className="w-full rounded-xl border border-kado-dark/12 bg-white px-4 py-3 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/25"
            required
          />
        </div>
        <PasswordField
          id="login-password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
        />
        <div className="flex justify-end">
          <Link to="/auth/forgot-password" className="text-xs font-semibold text-kado-red hover:underline">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-kado-red text-kado-cream py-3.5 font-bold uppercase tracking-[0.14em] text-xs hover:bg-kado-dark transition-colors disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-kado-dark/55">
        New here?{' '}
        <Link to="/auth/signup" className="font-semibold text-kado-red hover:underline">
          Create an account
        </Link>
      </p>

      <Link
        to="/"
        className="mt-4 block text-center text-sm font-semibold text-kado-dark/45 hover:text-kado-red transition-colors"
      >
        Back to site
      </Link>
    </CustomerAuthLayout>
  );
}
