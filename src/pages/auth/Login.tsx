import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isValidEmail } from '../../lib/validation';
import { formatAuthErrorMessage } from '../../lib/supabase/authSession';
import { AlertCircle, Check, User as UserIcon } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAuthStore((s) => s.signIn);
  const from = (location.state as { from?: string } | null)?.from;
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
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'barista') {
        navigate('/barista', { replace: true });
      } else if (role === 'staff') {
        navigate('/staff', { replace: true });
      } else {
        navigate(from && from.startsWith('/account') ? from : '/account', { replace: true });
      }
    } catch (err) {
      setError(
        formatAuthErrorMessage(err, 'Invalid credentials. Please check your email and password.'),
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="customer-surface min-h-screen bg-kado-cream flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-[2rem] border border-kado-dark/10 bg-kado-offwhite p-8 md:p-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-kado-red text-kado-cream flex items-center justify-center font-display font-bold text-xl rounded-sm">
              角
            </div>
            <span className="font-display font-bold text-xl text-kado-dark">Kado Kohi</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-kado-dark">Customer Sign In</h1>
          <p className="text-sm text-kado-dark/60 mt-2">
            Access your account, loyalty stamps, and orders.
          </p>
        </div>

        {/* Notice (e.g. after signup confirmation) */}
        {notice && !error && (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 mb-4 text-xs font-medium">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{notice}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-kado-dark/70 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="w-full rounded-xl border border-kado-dark/15 bg-white px-4 py-3 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/30 focus:border-kado-red"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-kado-dark/70 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full rounded-xl border border-kado-dark/15 bg-white px-4 py-3 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/30 focus:border-kado-red"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-kado-red text-kado-cream py-4 font-bold uppercase tracking-wider text-sm hover:bg-kado-dark transition-colors mt-2 disabled:opacity-60"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <UserIcon className="w-4 h-4" />
              {submitting ? 'Signing in…' : 'Sign In'}
            </span>
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-kado-dark/60">
          New customer?{' '}
          <Link to="/auth/signup" className="font-bold text-kado-red hover:underline">
            Create an account
          </Link>
        </p>

        <p className="mt-5 text-center text-[11px] text-kado-dark/45">
          Admin, barista, or staff?{' '}
          <Link to="/management-portal" className="font-bold text-kado-dark/60 hover:text-kado-red">
            Internal portal
          </Link>
        </p>

        <Link to="/" className="mt-3 block text-center text-sm font-semibold text-kado-dark/50 hover:text-kado-red">
          Back to site
        </Link>
      </div>
    </div>
  );
}
