import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSignUp, useAuth } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store/authStore';
import { clampText, isValidEmail, requirePhilippinePhone } from '../../lib/validation';
import { normalizePhilippinePhone } from '../../lib/phonePhilippines';
import PhilippinePhoneField from '../../components/PhilippinePhoneField';
import SignupTermsConsent from '../../components/auth/SignupTermsConsent';
import PasswordField from '../../components/auth/PasswordField';
import { formatClerkErrorMessage } from '../../lib/clerk/errors';
import { isClerkConfigured } from '../../lib/clerk/config';
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
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const profile = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);

  const [name, setName] = useState('');
  const [email, setEmail] = useState(prefilledEmail);
  const [phoneLocal, setPhoneLocal] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    if (!isSignedIn || authLoading) return;
    if (profile?.role === 'customer') {
      navigate('/account', { replace: true });
    }
  }, [isSignedIn, authLoading, profile?.id, profile?.role, navigate]);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isClerkConfigured || !isLoaded || !signUp) {
      setError('Sign-up is unavailable — auth is not configured. Please try again later.');
      return;
    }

    if (!name.trim() || !email.trim() || !phoneLocal.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    const phoneErr = requirePhilippinePhone(phoneLocal);
    if (phoneErr) {
      setError(phoneErr);
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
    if (!acceptedTerms) {
      setError('Please read and accept the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    setSubmitting(true);
    try {
      const phone = normalizePhilippinePhone(phoneLocal);
      await signUp.create({
        emailAddress: email.trim().toLowerCase(),
        password,
        firstName: clampText(name, 80),
        unsafeMetadata: { phone, name: clampText(name, 80), role: 'customer' },
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      setError(formatClerkErrorMessage(err, 'Could not create your account. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!signUp || !setActive) return;
    setError('');
    setSubmitting(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode.trim() });
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        navigate('/account', { replace: true });
        return;
      }
      setError('Verification incomplete. Check the code and try again.');
    } catch (err) {
      setError(formatClerkErrorMessage(err, 'Invalid verification code.'));
    } finally {
      setSubmitting(false);
    }
  };

  const formPanel = (
    <div className="w-full max-w-md mx-auto lg:max-w-none">
      <Link
        to="/auth/login"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-kado-dark/50 hover:text-kado-red mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
      </Link>

      <h1 className="font-display text-2xl md:text-3xl font-bold text-kado-dark mb-2">
        {pendingVerification ? 'Verify your email' : 'Create account'}
      </h1>
      <p className="text-sm text-kado-dark/60 mb-6">
        {pendingVerification
          ? `We sent a 6-digit code to ${email}. Check your inbox (and spam folder).`
          : 'Join Kado Circle and order from any branch.'}
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {pendingVerification ? (
        <form onSubmit={(e) => void handleVerify(e)} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5">
              Verification code
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full rounded-xl border border-kado-dark/12 bg-white px-4 py-3 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              placeholder="123456"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-kado-red text-kado-cream py-3.5 font-bold uppercase tracking-[0.14em] text-xs hover:bg-kado-dark transition-colors disabled:opacity-60"
          >
            {submitting ? 'Verifying…' : 'Verify & continue'}
          </button>
          <button
            type="button"
            disabled={submitting}
            className="w-full text-xs font-semibold text-kado-dark/50 hover:text-kado-red disabled:opacity-50"
            onClick={() => {
              if (!signUp) return;
              setError('');
              void signUp.prepareEmailAddressVerification({ strategy: 'email_code' }).catch((err) => {
                setError(formatClerkErrorMessage(err, 'Could not resend the code.'));
              });
            }}
          >
            Resend code
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => void handleSignup(e)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5">
              Full name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-kado-dark/12 bg-white px-4 py-3 text-sm"
              placeholder="Maria Santos"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-kado-dark/12 bg-white px-4 py-3 text-sm"
            />
          </div>
          <PhilippinePhoneField value={phoneLocal} onChange={setPhoneLocal} id="phone" />
          <PasswordField id="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
          <PasswordField id="confirmPassword" label="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
          <SignupTermsConsent checked={acceptedTerms} onChange={setAcceptedTerms} />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-kado-red text-kado-cream py-3.5 font-bold uppercase tracking-[0.14em] text-xs hover:bg-kado-dark transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div className="customer-surface min-h-dvh flex flex-col bg-kado-offwhite lg:flex-row">
      <aside className="hidden lg:flex lg:w-[42%] xl:w-[40%] shrink-0 flex-col justify-between bg-kado-dark text-kado-cream px-10 xl:px-12 py-12">
        <div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-kado-red">
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.22em]">Kado Circle</span>
          </motion.div>
          <h2 className="font-display text-3xl xl:text-4xl font-bold mt-8 leading-tight">
            Start earning
            <br />
            with every cup.
          </h2>
          <ul className="mt-10 space-y-5">
            {perks.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-kado-red/20 text-kado-red">
                  <Icon className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-kado-cream">{title}</p>
                  <p className="text-xs text-kado-cream/70 mt-0.5 leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-kado-cream/40 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> Free to join
        </p>
      </aside>
      <main className="flex-1 flex items-center justify-center px-6 py-12 lg:py-16 lg:px-12 bg-kado-cream">
        {formPanel}
      </main>
    </div>
  );
}
