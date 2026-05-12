import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { AlertCircle, User as UserIcon } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginAs = useAuthStore((s) => s.loginAs);
  const users = useUserStore((s) => s.users);
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('customer@kadokohi.com');
  const [password, setPassword] = useState('customer1234');
  const [error, setError] = useState('');

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    const matchedUser = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!matchedUser) {
      setError('No account found with that email. Try a demo credential or sign up.');
      return;
    }

    if (matchedUser.role !== 'customer') {
      setError('This sign in page is for customers only.');
      return;
    }

    loginAs('customer', {
      name: matchedUser.name,
      email: matchedUser.email,
      id: matchedUser.id,
      loyaltyStamps: matchedUser.loyaltyStamps,
      createdAt: matchedUser.createdAt,
    });
    navigate(from && from.startsWith('/account') ? from : '/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-kado-cream flex items-center justify-center px-6 py-16">
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
            className="w-full rounded-2xl bg-kado-red text-kado-cream py-4 font-bold uppercase tracking-wider text-sm hover:bg-kado-dark transition-colors mt-2"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <UserIcon className="w-4 h-4" />
              Sign In
            </span>
          </button>
        </form>

        {/* Auto-fill hint */}
        <div className="mt-6 rounded-xl bg-kado-dark/5 border border-kado-dark/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-kado-dark/50 mb-2">
            Demo credentials (auto-filled)
          </p>
          <div className="text-[11px] text-kado-dark/70">
            <div>
              <span className="font-bold block text-kado-dark">Customer</span>
              customer@kadokohi.com<br />customer1234
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-kado-dark/60">
          New customer?{' '}
          <Link to="/auth/signup" className="font-bold text-kado-red hover:underline">
            Create an account
          </Link>
        </p>

        <Link to="/" className="mt-3 block text-center text-sm font-semibold text-kado-dark/50 hover:text-kado-red">
          Back to site
        </Link>
      </div>
    </div>
  );
}
