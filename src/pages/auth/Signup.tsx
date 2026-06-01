import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store/authStore';
import { clampText, isValidEmail } from '../../lib/validation';
import { formatAuthErrorMessage, recoverStaleAuthSession } from '../../lib/supabase/authSession';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import {
  AlertCircle,
  Check,
  Coffee,
  MapPin,
  Sparkles,
  UserPlus,
  ArrowLeft,
  Gift,
} from 'lucide-react';

const perks = [
  { icon: Gift, title: 'Kado Circle stamps', body: 'Earn one stamp per drink when your order is completed — your 10th drink is on us.' },
  { icon: Coffee, title: 'Order from the menu', body: 'Pick your branch at checkout; we route orders to the right bar.' },
  { icon: MapPin, title: 'Every branch', body: 'One account for all locations — track pickup and history in one place.' },
];

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = (location.state as { email?: string } | null)?.email?.trim() ?? '';
  const signUp = useAuthStore((s) => s.signUp);

  const [name, setName] = useState('');
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void recoverStaleAuthSession();
  }, []);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isSupabaseConfigured) {
      setError('Sign-up is unavailable — the app is not connected to the server. Please try again later.');
      return;
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (clampText(name, 80).length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    if (password.trim().length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { needsEmailConfirmation } = await signUp(
        clampText(name, 80),
        email.trim().toLowerCase(),
        password,
      );
      if (needsEmailConfirmation) {
        navigate('/auth/login', {
          replace: true,
          state: { notice: 'Account created! Please check your email to confirm, then sign in.' },
        });
        return;
      }
      navigate('/account', { replace: true, state: { onboard: true } });
    } catch (err) {
      setError(
        formatAuthErrorMessage(
          err,
          'Unable to create account. Please try another email or try again later.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-kado-offwhite lg:h-dvh lg:max-h-dvh lg:flex-row lg:overflow-hidden">
      {/* Brand panel — desktop (fits viewport; no page scroll) */}
      <aside className="relative hidden lg:flex lg:w-[44%] xl:w-[42%] h-full min-h-0 flex-col shrink-0 justify-between overflow-hidden bg-kado-dark text-kado-cream px-6 xl:px-10 py-6 xl:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div
          aria-hidden
          className="absolute -right-12 top-[18%] font-display font-black text-[8rem] xl:text-[10rem] leading-none text-kado-red/20 select-none"
        >
          角
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-kado-red/20 to-transparent pointer-events-none" />

        <div className="relative z-10 min-h-0 space-y-4 xl:space-y-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-kado-cream/70 hover:text-kado-cream transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>

          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 bg-kado-red text-kado-cream flex items-center justify-center font-display font-bold text-xl rounded-sm shadow-lg shadow-black/20">
                角
              </div>
              <img
                src="/logo/Logo1.png"
                alt=""
                className="h-8 w-auto max-w-[160px] object-contain object-left brightness-0 invert opacity-95"
              />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.26em] text-kado-red mb-1.5">Customer portal</p>
            <h1 className="font-display text-2xl xl:text-3xl font-bold text-kado-cream leading-[1.15] tracking-tight">
              Join the corner.
            </h1>
            <p className="mt-2 text-xs text-kado-cream/70 leading-snug max-w-md line-clamp-3 xl:line-clamp-none font-medium">
              Kado means corner; Kohi means coffee. Urban tambayan online — craft drinks, community, loyalty in one place.
            </p>
          </div>
        </div>

        <ul className="relative z-10 min-h-0 space-y-2 xl:space-y-3 pb-1">
          {perks.map(({ icon: Icon, title, body }, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
              className="flex gap-2.5"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kado-red/25 text-kado-cream border border-kado-red/40">
                <Icon className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="font-display font-bold text-kado-cream text-xs leading-tight">{title}</p>
                <p className="text-[11px] text-kado-cream/55 mt-0.5 leading-snug line-clamp-2">{body}</p>
              </div>
            </motion.li>
          ))}
        </ul>

        <p className="relative z-10 hidden xl:block text-[9px] uppercase tracking-[0.16em] text-kado-cream/35 leading-snug">
          Secure sign-up — your account is ready to order and earn Kado Circle stamps.
        </p>
      </aside>

      {/* Form column — desktop: centered in viewport without outer scroll */}
      <main className="flex-1 flex flex-col items-center justify-center min-h-0 min-w-0 px-5 sm:px-8 py-10 lg:py-4 lg:overflow-hidden bg-gradient-to-b from-kado-offwhite via-[#FAF7F2] to-kado-cream/40">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-[440px] lg:min-h-0 lg:max-h-full lg:flex lg:flex-col lg:justify-center"
        >
          {/* Mobile brand strip */}
          <div className="lg:hidden flex flex-col items-center text-center mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-kado-red text-kado-cream flex items-center justify-center font-display font-bold text-xl rounded-sm">
                角
              </div>
              <img
                src="/logo/Logo1.png"
                alt="Kado Kohi"
                className="h-8 w-auto max-w-[160px] object-contain object-left mix-blend-multiply contrast-[1.08]"
              />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-kado-red mb-2">New customer</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-kado-dark tracking-tight">
              Create your account
            </h2>
            <p className="text-sm text-kado-dark/55 mt-2 max-w-sm">
              Order online, earn stamps, and see your history — aligned with our cream, red, and near-black brand system.
            </p>
          </div>

          <div className="rounded-[1.75rem] lg:rounded-2xl border border-kado-dark/10 bg-white/90 backdrop-blur-md shadow-[0_24px_64px_rgba(25,25,25,0.08)] p-6 sm:p-8 lg:p-5 xl:p-6">
            <div className="hidden lg:block mb-3 xl:mb-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-kado-cream/80 border border-kado-dark/10 px-2.5 py-1 mb-2">
                <Sparkles className="w-3 h-3 text-kado-red" />
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-kado-dark/70">
                  Kado Circle · Sign up
                </span>
              </div>
              <h2 className="font-display text-xl xl:text-2xl font-bold text-kado-dark tracking-tight">
                Start your account
              </h2>
              <p className="text-xs text-kado-dark/55 mt-1">
                Under a minute — then you&apos;re ready to order.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200/80 text-red-800 rounded-lg px-3 py-2 mb-3 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-3 lg:space-y-2.5">
              <div>
                <label htmlFor="signup-name" className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1">
                  Full name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  required
                  className="w-full rounded-xl border border-kado-dark/12 bg-kado-offwhite/50 px-3 py-2.5 lg:py-2 text-sm text-kado-dark placeholder:text-kado-dark/35 focus:outline-none focus:ring-2 focus:ring-kado-red/25 focus:border-kado-red transition-shadow"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="signup-email" className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  required
                  className="w-full rounded-xl border border-kado-dark/12 bg-kado-offwhite/50 px-3 py-2.5 lg:py-2 text-sm text-kado-dark placeholder:text-kado-dark/35 focus:outline-none focus:ring-2 focus:ring-kado-red/25 focus:border-kado-red transition-shadow"
                  placeholder="you@email.com"
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-3 gap-3">
                <div className="min-w-0">
                  <label htmlFor="signup-password" className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1">
                    Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-kado-dark/12 bg-kado-offwhite/50 px-3 py-2.5 lg:py-2 text-sm text-kado-dark placeholder:text-kado-dark/35 focus:outline-none focus:ring-2 focus:ring-kado-red/25 focus:border-kado-red transition-shadow"
                    placeholder="8+ characters"
                  />
                </div>
                <div className="min-w-0">
                  <label htmlFor="signup-confirm" className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1">
                    Confirm password
                  </label>
                  <input
                    id="signup-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    required
                    className="w-full rounded-xl border border-kado-dark/12 bg-kado-offwhite/50 px-3 py-2.5 lg:py-2 text-sm text-kado-dark placeholder:text-kado-dark/35 focus:outline-none focus:ring-2 focus:ring-kado-red/25 focus:border-kado-red transition-shadow"
                    placeholder="Repeat"
                  />
                </div>
              </div>

              <p className="flex items-center gap-1 text-[10px] text-kado-dark/40 -mt-0.5">
                <Check className="w-3 h-3 text-kado-red shrink-0" />
                <span>Minimum 8 characters. You can change your password anytime in your profile.</span>
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl lg:rounded-2xl bg-kado-red text-kado-cream py-3 lg:py-2.5 font-bold uppercase tracking-[0.15em] text-[11px] hover:bg-kado-dark transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-md shadow-kado-red/15"
              >
                {submitting ? (
                  'Creating…'
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create account
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 lg:mt-3 text-center text-xs lg:text-sm text-kado-dark/55">
              Already on Kado Kohi?{' '}
              <Link to="/auth/login" className="font-bold text-kado-red hover:underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>

          <Link
            to="/"
            className="mt-5 lg:mt-3 flex items-center justify-center gap-2 text-[10px] lg:text-xs font-bold uppercase tracking-[0.15em] text-kado-dark/45 hover:text-kado-red transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to site
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
