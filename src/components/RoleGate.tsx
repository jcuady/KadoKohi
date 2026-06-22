import { useAuth } from '@clerk/clerk-react';
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Role } from '../types/domain';
import { useAuthStore } from '../store/authStore';

interface RoleGateProps {
  allowed: Role[];
  children?: ReactNode;
}

/**
 * Protects nested routes. Renders `<Outlet />` when used as a route `element` without children.
 * Shows a minimal spinner while the Clerk session / kk_profiles row is being resolved.
 */
export default function RoleGate({ allowed, children }: RoleGateProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const hydrateError = useAuthStore((s) => s.hydrateError);
  const location = useLocation();

  if (!isLoaded || (isSignedIn && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kado-dark/15 border-t-kado-red" />
      </div>
    );
  }

  if (isSignedIn && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-kado-dark/70">
          {hydrateError ?? 'We could not load your account profile.'}
        </p>
        <a href="/auth/login" className="text-sm font-semibold text-kado-red hover:underline">
          Return to sign in
        </a>
      </div>
    );
  }

  if (!user || !allowed.includes(user.role)) {
    const target = allowed.some((r) => r === 'admin' || r === 'barista' || r === 'staff')
      ? '/management-portal'
      : '/auth/login';
    return <Navigate to={target} replace state={{ from: location.pathname }} />;
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
}
