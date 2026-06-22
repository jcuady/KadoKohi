import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Coffee, Gift, LogIn, MapPin } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { isValidEmail } from '../../lib/validation';
import { formatAuthErrorMessage } from '../../lib/supabase/authSession';
import { isInternalRole } from '../../lib/roles';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthBrandMark from '../../components/auth/AuthBrandMark';
import PasswordField from '../../components/auth/PasswordField';

const perks = [
  { icon: Gift, text: 'Track Kado Circle stamps and rewards' },
  { icon: Coffee, text: 'View order history and pickup status' },
  { icon: MapPin, text: 'One account for every branch' },
];

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
      if (role && isInternalRole(role)) {
        await useAuthStore.getState().logout();
        setError('This sign-in is for customer accounts only. Staff should use the management portal.');
        setSubmitting(false);
        return;
      }
      navigate(from && from.startsWith('/account') ? from : '/account', { replace: true });
    } catch (err) {
      setError(
        formatAuthErrorMessage(err, 'Invalid credentials. Please check your email and password.'),
      );
      setSubmitting(false);
    }
  };

  const formPanel = (
    <div className="w-full max-w-md mx-auto lg:max-w-none">
      <div className="lg:hidden mb-8">
        <AuthBrandMark subtitle="Access your account, loyalty stamps, and orders." />
      </div>

      <h1 className="font-display text-2xl md:text-3xl font-bold text-kado-dark mb-2">Sign in</h1>
      <p className="text-sm text-kado-dark/60 mb-6">Welcome back to Kado Kohi.</p>

      {notice && !error && <AuthAlert variant="success">{notice}</AuthAlert>}
      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            className="w-full rounded-xl border border-kado-dark/12 bg-white px-4 py-3 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/30 focus:border-kado-red"
            placeholder="you@email.com"
          />
        </div>

        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          required
        />

        <div className="flex justify-end">
          <Link
            to="/auth/forgot-password"
            className="text-xs font-bold uppercase tracking-wider text-kado-red hover:underline underline-offset-2"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-kado-red text-kado-cream py-3.5 font-bold uppercase tracking-[0.14em] text-xs hover:bg-kado-dark transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 shadow-md shadow-kado-red/15"
        >
          <LogIn className="w-4 h-4" />
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-kado-dark/60">
        New here?{' '}
        <Link to="/auth/signup" className="font-bold text-kado-red hover:underline underline-offset-2">
          Create an account
        </Link>
      </p>

      <Link
        to="/"
        className="mt-5 block text-center text-sm font-semibold text-kado-dark/45 hover:text-kado-red transition-colors"
      >
        Back to site
      </Link>
    </div>
  );

  return (
    <div className="customer-surface min-h-dvh flex flex-col bg-kado-offwhite lg:flex-row">
      <aside className="hidden lg:flex lg:w-[42%] xl:w-[40%] shrink-0 flex-col justify-between bg-kado-dark text-kado-cream px-10 xl:px-12 py-12">
        <div>
          <AuthBrandMark variant="customer" />
          <h2 className="font-display text-3xl xl:text-4xl font-bold mt-10 leading-tight">
            Your coffee,
            <br />
            your rewards.
          </h2>
          <p className="text-sm text-kado-cream/70 mt-4 max-w-sm leading-relaxed">
            Sign in to manage orders, stamps, vouchers, and booth bookings in one place.
          </p>
          <ul className="mt-10 space-y-4">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-kado-cream/85">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kado-red/20 text-kado-red">
                  <Icon className="w-4 h-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-kado-cream/40">Kado Kohi · Customer account</p>
      </aside>

      <main className="flex-1 flex items-center justify-center px-6 py-12 lg:py-16 lg:px-12 bg-kado-cream">
        {formPanel}
      </main>
    </div>
  );
}
