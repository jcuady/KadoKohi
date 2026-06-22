import { Link } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import AuthBrandMark from '../../components/auth/AuthBrandMark';
import { clerkAppearance, internalPortalClerkAppearance } from '../../lib/clerk/appearance';

type ForgotPasswordProps = {
  variant?: 'customer' | 'internal';
};

export default function ForgotPassword({ variant = 'customer' }: ForgotPasswordProps) {
  const isInternal = variant === 'internal';
  const signInPath = isInternal ? '/management-portal' : '/auth/login';

  const panel = (
    <div className="w-full max-w-md mx-auto">
      <AuthBrandMark
        variant={isInternal ? 'internal' : 'customer'}
        subtitle={isInternal ? 'Reset your management portal password.' : 'Reset your customer account password.'}
      />
      <h1 className={`font-display text-2xl font-bold mt-8 mb-2 ${isInternal ? 'text-white' : 'text-kado-dark'}`}>
        Forgot password
      </h1>
      <p className={`text-sm mb-6 ${isInternal ? 'text-white/60' : 'text-kado-dark/60'}`}>
        Use the form below — we will email you a secure reset link.
      </p>
      <SignIn
        routing="path"
        path={isInternal ? '/management-portal/forgot-password' : '/auth/forgot-password'}
        signInUrl={signInPath}
        appearance={isInternal ? internalPortalClerkAppearance : clerkAppearance}
      />
      <Link
        to={signInPath}
        className={`mt-6 block text-center text-sm font-semibold ${isInternal ? 'text-white/50 hover:text-kado-red' : 'text-kado-dark/45 hover:text-kado-red'}`}
      >
        Back to sign in
      </Link>
    </div>
  );

  if (isInternal) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#141414] px-6 py-12">
        {panel}
      </div>
    );
  }

  return (
    <div className="customer-surface min-h-dvh flex items-center justify-center bg-kado-cream px-6 py-12">
      {panel}
    </div>
  );
}
