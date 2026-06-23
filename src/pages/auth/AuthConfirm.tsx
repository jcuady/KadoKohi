import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isInternalRole } from '../../lib/roles';
import { formatAuthErrorMessage } from '../../lib/supabase/authSession';
import { completeSupabaseAuthRedirect } from '../../lib/supabase/authRedirect';
import { supabase } from '../../lib/supabase/client';
import CustomerAuthLayout from '../../components/auth/CustomerAuthLayout';
import AuthAlert from '../../components/auth/AuthAlert';

/**
 * Landing page for Supabase email-confirmation links. Exchanges the code/token,
 * hydrates the customer profile, and sends the user to their account dashboard.
 */
export default function AuthConfirm() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!supabase) {
      setError('Sign-in is unavailable — the app is not connected to the server.');
      return;
    }

    let cancelled = false;

    const finish = async () => {
      if (finishedRef.current || cancelled) return;

      const { session, error: redirectError } = await completeSupabaseAuthRedirect();
      if (cancelled || finishedRef.current) return;

      if (redirectError || !session) {
        setError(
          formatAuthErrorMessage(
            redirectError,
            'This confirmation link is invalid or has expired. Sign in if you already confirmed, or create a new account.',
          ),
        );
        return;
      }

      await useAuthStore.getState().initFromSupabase();
      if (cancelled || finishedRef.current) return;

      const role = useAuthStore.getState().user?.role;
      if (role && isInternalRole(role)) {
        await useAuthStore.getState().logout();
        setError('This link is for customer accounts. Staff should use the management portal.');
        return;
      }

      finishedRef.current = true;
      navigate('/account', { replace: true, state: { onboard: true } });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void finish();
      }
    });

    void finish();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <CustomerAuthLayout variant="login">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-kado-dark mb-1.5">Confirming your email</h1>
      <p className="text-sm text-kado-dark/60 mb-5 sm:mb-6">Just a moment while we finish setting up your account.</p>

      {error ? (
        <>
          <AuthAlert variant="error">{error}</AuthAlert>
          <div className="flex flex-col gap-3 text-center text-sm">
            <Link to="/auth/login" className="font-semibold text-kado-red hover:underline">
              Go to sign in
            </Link>
            <Link to="/auth/signup" className="text-kado-dark/55 hover:text-kado-red transition-colors">
              Create a new account
            </Link>
          </div>
        </>
      ) : (
        <div className="flex justify-center py-8" aria-busy="true" aria-label="Confirming email">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-kado-dark/15 border-t-kado-red" />
        </div>
      )}
    </CustomerAuthLayout>
  );
}
