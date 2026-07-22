import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authRepo } from '../../lib/supabase/repositories/auth';
import { formatAuthErrorMessage } from '../../lib/supabase/authSession';
import { passwordResetRedirectUrl } from '../../lib/authRedirects';
import { isValidEmail } from '../../lib/validation';
import CustomerAuthLayout from '../../components/auth/CustomerAuthLayout';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthFieldError from '../../components/auth/AuthFieldError';
import AuthFlowGuide from '../../components/auth/AuthFlowGuide';
import { PASSWORD_RESET_SENT_NOTICE, PASSWORD_RESET_SENT_STEPS } from '../../lib/authNotices';

type ForgotPasswordProps = {
  variant?: 'customer' | 'internal';
};

export default function ForgotPassword({ variant = 'customer' }: ForgotPasswordProps) {
  const isInternal = variant === 'internal';
  const signInPath = isInternal ? '/management-portal' : '/auth/login';
  const signupPath = '/auth/signup';
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get('email')?.trim() ?? '');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Email is required.');
      return;
    }
    if (!isValidEmail(trimmed)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      const redirectTo = passwordResetRedirectUrl();
      const normalized = trimmed.toLowerCase();
      await authRepo.resetPasswordForEmail(normalized, redirectTo);
      setSentEmail(normalized);
      setSent(true);
    } catch (err) {
      const message = formatAuthErrorMessage(err, 'Could not send reset email. Please try again.');
      if (/no account found|valid email/i.test(message)) {
        setEmailError(message);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const form = (
    <>
      {sent ? (
        <>
          <AuthAlert variant="success">{PASSWORD_RESET_SENT_NOTICE}</AuthAlert>
          <p
            className={`mt-2 text-sm font-medium ${isInternal ? 'text-white/80' : 'text-kado-dark/70'}`}
          >
            Sent to <span className="font-semibold">{sentEmail}</span>
          </p>
          {!isInternal && <AuthFlowGuide steps={PASSWORD_RESET_SENT_STEPS} title="Next steps" variant="success" />}
          {isInternal ? (
            <p className="mt-4 text-xs text-white/55">
              Still nothing? Ask a super admin to set a temporary password in Admin → Users (instant, no email).
            </p>
          ) : (
            <p className="mt-4 text-xs text-kado-dark/55">
              Still nothing after a few minutes? Message us on Instagram @kadocoffeeph or visit the cafe — staff can
              help escalate a reset.
            </p>
          )}
        </>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
          {error && <AuthAlert variant="error">{error}</AuthAlert>}
          <div>
            <label
              htmlFor="forgot-email"
              className={`block text-[10px] font-black uppercase tracking-[0.18em] mb-1.5 ${
                isInternal ? 'text-white/70' : 'text-kado-dark/55'
              }`}
            >
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(ev) => {
                setEmail(ev.target.value);
                setEmailError('');
                setError('');
              }}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? 'forgot-email-error' : undefined}
              className={
                isInternal
                  ? `w-full rounded-xl border px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-kado-red/30 ${
                      emailError ? 'border-red-400 bg-[#1a1a1a]' : 'border-white/15 bg-[#1a1a1a]'
                    }`
                  : `w-full rounded-xl border bg-white px-4 py-3 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/25 ${
                      emailError ? 'border-red-400' : 'border-kado-dark/12'
                    }`
              }
              required
            />
            <AuthFieldError id="forgot-email-error" message={emailError || null} />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-kado-red text-kado-cream py-3.5 font-bold uppercase tracking-[0.14em] text-xs hover:bg-kado-dark transition-colors disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
          {!isInternal && emailError && /no account found/i.test(emailError) ? (
            <p className="text-center text-sm text-kado-dark/55">
              New here?{' '}
              <Link to={signupPath} state={{ email: email.trim().toLowerCase() }} className="font-semibold text-kado-red hover:underline">
                Create an account
              </Link>
            </p>
          ) : null}
        </form>
      )}
      <Link
        to={signInPath}
        className={`mt-6 block text-center text-sm font-semibold transition-colors ${
          isInternal ? 'text-white/50 hover:text-kado-red' : 'text-kado-dark/45 hover:text-kado-red'
        }`}
      >
        Back to sign in
      </Link>
    </>
  );

  if (isInternal) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#141414] px-4 sm:px-6 py-10 sm:py-12">
        <div className="w-full max-w-md">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-kado-red mb-2">Management portal</p>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Forgot password</h1>
          <p className="text-sm text-white/60 mb-6">We will email you a secure reset link.</p>
          {form}
        </div>
      </div>
    );
  }

  return (
    <CustomerAuthLayout variant="login">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-kado-dark mb-1.5">Forgot password</h1>
      <p className="text-sm text-kado-dark/60 mb-5 sm:mb-6">Enter your email — we will send a secure reset link.</p>
      {form}
    </CustomerAuthLayout>
  );
}
