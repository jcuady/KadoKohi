import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { clampText, isValidEmail, requirePhilippinePhone } from '../../lib/validation';
import { normalizePhilippinePhone } from '../../lib/phonePhilippines';
import PhilippinePhoneField from '../../components/PhilippinePhoneField';
import SignupTermsConsent from '../../components/auth/SignupTermsConsent';
import SignupPasswordField from '../../components/auth/SignupPasswordField';
import PasswordField from '../../components/auth/PasswordField';
import CustomerAuthLayout from '../../components/auth/CustomerAuthLayout';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthFlowGuide from '../../components/auth/AuthFlowGuide';
import { clearLocalAuthBeforeSignup, formatAuthErrorMessage } from '../../lib/supabase/authSession';
import { isPasswordStrong } from '../../lib/passwordStrength';
import {
  SIGNUP_CHECK_EMAIL_NOTICE,
  SIGNUP_CHECK_EMAIL_QUERY,
  SIGNUP_EMAIL_QUERY,
  SIGNUP_FORM_GUIDE,
} from '../../lib/authNotices';
import { isSupabaseConfigured } from '../../lib/supabase/client';

const inputClass =
  'w-full rounded-xl border border-kado-dark/12 bg-white px-4 py-3 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/25';
const labelClass = 'block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5';

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = (location.state as { email?: string } | null)?.email?.trim() ?? '';
  const signUp = useAuthStore((s) => s.signUp);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);

  const [name, setName] = useState('');
  const [email, setEmail] = useState(prefilledEmail);
  const [phoneLocal, setPhoneLocal] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void clearLocalAuthBeforeSignup();
  }, []);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'customer') return;
    navigate('/account', { replace: true });
  }, [authLoading, user, navigate]);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isSupabaseConfigured) {
      setError('Sign-up is unavailable — the app is not connected to the server. Please try again later.');
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
    if (!isPasswordStrong(password)) {
      setError('Password must meet all requirements shown below.');
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

    const normalizedEmail = email.trim().toLowerCase();

    setSubmitting(true);
    try {
      const { needsEmailConfirmation } = await signUp(
        clampText(name, 80),
        normalizedEmail,
        normalizePhilippinePhone(phoneLocal),
        password,
      );
      if (needsEmailConfirmation) {
        const params = new URLSearchParams({
          [SIGNUP_CHECK_EMAIL_QUERY]: '1',
          [SIGNUP_EMAIL_QUERY]: normalizedEmail,
        });
        navigate(`/auth/login?${params.toString()}`, {
          replace: true,
          state: { notice: SIGNUP_CHECK_EMAIL_NOTICE },
        });
        return;
      }
      navigate('/account', { replace: true, state: { onboard: true } });
    } catch (err) {
      setError(
        formatAuthErrorMessage(err, 'Unable to create account. Please try another email or try again later.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerAuthLayout variant="signup">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-kado-dark mb-1.5">Join Kado Circle</h1>
      <p className="text-sm text-kado-dark/60 mb-4 sm:mb-5">Create your account to earn stamps and track orders.</p>

      <AuthFlowGuide steps={SIGNUP_FORM_GUIDE} title="How sign-up works" />

      {error && <AuthAlert variant="error">{error}</AuthAlert>}

      <form onSubmit={(e) => void handleSignup(e)} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className={labelClass}>Full name</label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="signup-email" className={labelClass}>Email</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className={inputClass}
            required
          />
          <p className="mt-1.5 text-[11px] text-kado-dark/50">We send a confirmation link to this address.</p>
        </div>
        <PhilippinePhoneField
          id="signup-phone"
          label="Mobile number"
          value={phoneLocal}
          onChange={setPhoneLocal}
          required
        />
        <SignupPasswordField
          id="signup-password"
          value={password}
          onChange={setPassword}
          disabled={submitting}
        />
        <PasswordField
          id="signup-confirm"
          label="Confirm password"
          autoComplete="new-password"
          minLength={8}
          value={confirmPassword}
          onChange={(ev) => setConfirmPassword(ev.target.value)}
          required
        />
        <SignupTermsConsent checked={acceptedTerms} onChange={setAcceptedTerms} />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-kado-red text-kado-cream py-3.5 font-bold uppercase tracking-[0.14em] text-xs hover:bg-kado-dark transition-colors disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-kado-dark/55">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-semibold text-kado-red hover:underline">
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-kado-dark/45">
        Staff or barista?{' '}
        <Link to="/management-portal" className="font-semibold text-kado-red hover:underline">
          Use the management portal
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
