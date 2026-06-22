import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SignIn, useAuth, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { Coffee, Gift, MapPin } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { isInternalRole } from '../../lib/roles';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthBrandMark from '../../components/auth/AuthBrandMark';
import AuthSessionGate from '../../components/AuthSessionGate';
import { clerkAppearance } from '../../lib/clerk/appearance';

const perks = [
  { icon: Gift, text: 'Track Kado Circle stamps and rewards' },
  { icon: Coffee, text: 'View order history and pickup status' },
  { icon: MapPin, text: 'One account for every branch' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const logout = useAuthStore((s) => s.logout);
  const notice = (location.state as { notice?: string } | null)?.notice;
  const [error, setError] = useState('');
  const isSsoCallback = location.pathname.includes('/sso-callback');

  useEffect(() => {
    if (!isSignedIn || loading) return;
    if (!user) return;
    if (isInternalRole(user.role)) {
      void logout();
      setError('This sign-in is for customer accounts only. Staff should use the management portal.');
      return;
    }
    const from = (location.state as { from?: string } | null)?.from;
    const target = from && from.startsWith('/account') ? from : '/account';
    if (!location.pathname.startsWith(target)) {
      navigate(target, { replace: true });
    }
  }, [isSignedIn, loading, user, logout, navigate, location.state, location.pathname]);

  const formPanel = (
    <div className="w-full max-w-md mx-auto lg:max-w-none">
      <div className="lg:hidden mb-8">
        <AuthBrandMark subtitle="Access your account, loyalty stamps, and orders." />
      </div>

      <h1 className="font-display text-2xl md:text-3xl font-bold text-kado-dark mb-2">Sign in</h1>
      <p className="text-sm text-kado-dark/60 mb-6">Welcome back to Kado Kohi.</p>

      {notice && !error && <AuthAlert variant="success">{notice}</AuthAlert>}
      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      {isSsoCallback ? (
        <AuthSessionGate loadingMessage="Completing Google sign-in…">
          <div className="flex flex-col items-center gap-4 py-10">
            <AuthenticateWithRedirectCallback
              signInFallbackRedirectUrl="/account"
              signUpFallbackRedirectUrl="/account"
            />
          </div>
        </AuthSessionGate>
      ) : (
        <AuthSessionGate loadingMessage="Completing sign-in…">
          <SignIn
            routing="path"
            path="/auth/login"
            signUpUrl="/auth/signup"
            appearance={clerkAppearance}
            fallbackRedirectUrl="/account"
            forceRedirectUrl="/account"
          />
        </AuthSessionGate>
      )}

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
