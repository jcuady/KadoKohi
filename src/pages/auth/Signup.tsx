import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { clampText } from '../../lib/validation';
import { normalizePhilippinePhone } from '../../lib/phonePhilippines';
import PhilippinePhoneField from '../../components/PhilippinePhoneField';
import SignupTermsConsent from '../../components/auth/SignupTermsConsent';
import SignupPasswordField from '../../components/auth/SignupPasswordField';
import PasswordField from '../../components/auth/PasswordField';
import CustomerAuthLayout from '../../components/auth/CustomerAuthLayout';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthFieldError from '../../components/auth/AuthFieldError';
import { clearLocalAuthBeforeSignup, formatAuthErrorMessage } from '../../lib/supabase/authSession';
import {
  SIGNUP_CHECK_EMAIL_NOTICE,
  SIGNUP_CHECK_EMAIL_QUERY,
  SIGNUP_EMAIL_QUERY,
} from '../../lib/authNotices';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { authRepo } from '../../lib/supabase/repositories/auth';
import {
  firstInvalidSignupField,
  signupFieldElementId,
  validateSignupField,
  validateSignupForm,
  type SignupFieldKey,
  type SignupFields,
} from '../../lib/signupValidation';

const inputClass =
  'w-full rounded-xl border bg-white px-4 py-3 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/25';
const labelClass = 'block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5';

function fieldInputClass(hasError: boolean): string {
  return `${inputClass} ${hasError ? 'border-red-400' : 'border-kado-dark/12'}`;
}

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
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SignupFieldKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<SignupFieldKey, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const values = useMemo<SignupFields>(
    () => ({
      name,
      email,
      phoneLocal,
      password,
      confirmPassword,
      acceptedTerms,
    }),
    [name, email, phoneLocal, password, confirmPassword, acceptedTerms],
  );

  const showFieldError = useCallback(
    (key: SignupFieldKey) => {
      if (!fieldErrors[key]) return null;
      if (touched[key] || submitAttempted) return fieldErrors[key] ?? null;
      return null;
    },
    [fieldErrors, touched, submitAttempted],
  );

  const markTouched = useCallback((key: SignupFieldKey) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      const err = validateSignupField(key, values);
      if (err) next[key] = err;
      else delete next[key];
      return next;
    });
  }, [values]);

  const clearField = useCallback((key: SignupFieldKey) => {
    setSubmitError('');
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  useEffect(() => {
    void clearLocalAuthBeforeSignup();
  }, []);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'customer') return;
    navigate('/account', { replace: true });
  }, [authLoading, user, navigate]);

  const focusField = (key: SignupFieldKey) => {
    const el = document.getElementById(signupFieldElementId(key));
    el?.focus();
    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitAttempted(true);

    if (!isSupabaseConfigured) {
      setSubmitError('Sign-up is unavailable — the app is not connected to the server. Please try again later.');
      return;
    }

    const errors = validateSignupForm(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const first = firstInvalidSignupField(errors);
      if (first) focusField(first);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    setSubmitting(true);
    try {
      try {
        const status = await authRepo.getEmailStatus(normalizedEmail);
        if (status === 'ready' || status === 'unconfirmed') {
          const msg =
            status === 'unconfirmed'
              ? 'That email is already registered but not confirmed. Sign in and use Resend confirmation, or check your inbox.'
              : 'That email is already registered. Try signing in instead.';
          setFieldErrors((prev) => ({ ...prev, email: msg }));
          focusField('email');
          setSubmitError(msg);
          return;
        }
      } catch {
        // Fall through to Auth signUp if status lookup fails.
      }

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
      const message = formatAuthErrorMessage(
        err,
        'Unable to create account. Please try another email or try again later.',
      );
      if (/already registered/i.test(message)) {
        setFieldErrors((prev) => ({ ...prev, email: message }));
        focusField('email');
        setSubmitError(message);
      } else {
        setSubmitError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const nameError = showFieldError('name');
  const emailError = showFieldError('email');
  const phoneError = showFieldError('phoneLocal');
  const passwordError = showFieldError('password');
  const confirmError = showFieldError('confirmPassword');
  const termsError = showFieldError('acceptedTerms');

  return (
    <CustomerAuthLayout variant="signup">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-kado-dark mb-1.5">Join Kado Circle</h1>
      <p className="text-sm text-kado-dark/60 mb-5 sm:mb-6">
        Create your account to earn stamps and track orders. We will email you a confirmation link when you are done.
      </p>

      {submitError && <AuthAlert variant="error">{submitError}</AuthAlert>}

      <form onSubmit={(e) => void handleSignup(e)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="signup-name" className={labelClass}>
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(ev) => {
              setName(ev.target.value);
              clearField('name');
            }}
            onBlur={() => markTouched('name')}
            className={fieldInputClass(!!nameError)}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? 'signup-name-error' : undefined}
            required
          />
          <AuthFieldError id="signup-name-error" message={nameError} />
        </div>

        <div>
          <label htmlFor="signup-email" className={labelClass}>
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => {
              setEmail(ev.target.value);
              clearField('email');
            }}
            onBlur={() => markTouched('email')}
            className={fieldInputClass(!!emailError)}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? 'signup-email-error signup-email-hint' : 'signup-email-hint'}
            required
          />
          {emailError ? (
            <AuthFieldError id="signup-email-error" message={emailError} />
          ) : (
            <p id="signup-email-hint" className="mt-1.5 text-[11px] text-kado-dark/50">
              We send a confirmation link to this address after you create your account.
            </p>
          )}
        </div>

        <PhilippinePhoneField
          id="signup-phone"
          value={phoneLocal}
          onChange={(v) => {
            setPhoneLocal(v);
            clearField('phoneLocal');
          }}
          onBlur={() => markTouched('phoneLocal')}
          error={phoneError}
          required
        />

        <SignupPasswordField
          id="signup-password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            clearField('password');
            if (confirmPassword) clearField('confirmPassword');
          }}
          onBlur={() => markTouched('password')}
          disabled={submitting}
          error={passwordError}
        />

        <PasswordField
          id="signup-confirm"
          label="Confirm password"
          autoComplete="new-password"
          minLength={8}
          value={confirmPassword}
          onChange={(ev) => {
            setConfirmPassword(ev.target.value);
            clearField('confirmPassword');
          }}
          onBlur={() => markTouched('confirmPassword')}
          error={confirmError}
          required
        />

        <SignupTermsConsent
          checked={acceptedTerms}
          onChange={(checked) => {
            setAcceptedTerms(checked);
            clearField('acceptedTerms');
          }}
          error={termsError}
        />

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
