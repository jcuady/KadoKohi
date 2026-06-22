import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { authRepo } from '../../lib/supabase/repositories/auth';
import { formatAuthErrorMessage } from '../../lib/supabase/authSession';
import { isValidEmail } from '../../lib/validation';
import { customerLoginPath, internalLoginPath, passwordResetRedirectUrl } from '../../lib/authRedirects';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthBrandMark from '../../components/auth/AuthBrandMark';

type ForgotPasswordProps = {
  variant?: 'customer' | 'internal';
};

export default function ForgotPassword({ variant = 'customer' }: ForgotPasswordProps) {
  const isInternal = variant === 'internal';
  const loginPath = isInternal ? internalLoginPath() : customerLoginPath();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSent(false);

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await authRepo.requestPasswordReset(email, passwordResetRedirectUrl());
      setSent(true);
    } catch (err) {
      setError(formatAuthErrorMessage(err, 'Could not send reset email. Try again in a moment.'));
    } finally {
      setSubmitting(false);
    }
  };

  const panel = (
    <>
      <AuthBrandMark
        variant={variant}
        subtitle={
          isInternal
            ? 'Reset the password for your admin, barista, or staff account.'
            : 'We will email you a secure link to choose a new password.'
        }
      />

      <h1
        className={`font-display text-2xl font-bold mt-6 mb-6 ${isInternal ? 'text-white' : 'text-kado-dark'}`}
      >
        Forgot password
      </h1>

      {sent && (
        <AuthAlert variant="success" tone={variant}>
          If an account exists for <strong>{email.trim().toLowerCase()}</strong>, you will receive a reset link
          shortly. Check spam if it does not arrive within a few minutes.
        </AuthAlert>
      )}

      {error && <AuthAlert variant="error" tone={variant}>{error}</AuthAlert>}

      {!sent && (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              required
              className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 focus:border-kado-red ${
                isInternal
                  ? 'border-white/15 bg-[#232323] text-white'
                  : 'border-kado-dark/12 bg-white text-kado-dark'
              }`}
              placeholder="you@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-kado-red text-kado-cream py-3.5 font-bold uppercase tracking-[0.14em] text-xs hover:bg-kado-dark transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <Link
        to={loginPath}
        className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-kado-red transition-colors ${
          isInternal ? 'text-white/55' : 'text-kado-dark/50'
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to sign in
      </Link>
    </>
  );

  if (isInternal) {
    return (
      <div className="min-h-dvh bg-[#141414] flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#1b1b1b] p-8 md:p-10 shadow-2xl">
          {panel}
        </div>
      </div>
    );
  }

  return (
    <div className="customer-surface min-h-dvh bg-kado-cream flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[2rem] border border-kado-dark/10 bg-kado-offwhite p-8 md:p-10 shadow-2xl">
        {panel}
      </div>
    </div>
  );
}
