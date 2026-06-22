import { Link } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import AuthBrandMark from '../../components/auth/AuthBrandMark';
import { clerkAppearance } from '../../lib/clerk/appearance';

/** Clerk password-reset tickets land here after the user clicks the email link. */
export default function ResetPassword() {
  return (
    <div className="customer-surface min-h-dvh flex items-center justify-center bg-kado-cream px-6 py-12">
      <div className="w-full max-w-md mx-auto">
        <AuthBrandMark subtitle="Choose a new password for your Kado Kohi account." />
        <h1 className="font-display text-2xl font-bold text-kado-dark mt-8 mb-2">Reset password</h1>
        <p className="text-sm text-kado-dark/60 mb-6">Enter a new password below to finish resetting your account.</p>
        <SignIn routing="path" path="/auth/reset-password" signInUrl="/auth/login" appearance={clerkAppearance} />
        <Link
          to="/auth/login"
          className="mt-6 block text-center text-sm font-semibold text-kado-dark/45 hover:text-kado-red"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
