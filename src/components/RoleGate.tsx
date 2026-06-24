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
 * Shows a minimal spinner while the Supabase session is being resolved to avoid a
 * flash of redirect-to-login on first load.
 */
export default function RoleGate({ allowed, children }: RoleGateProps) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const location = useLocation();

  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kado-dark/15 border-t-kado-red" />
      </div>
    );
  }

  if (!user || !allowed.includes(user.role)) {
    const target = allowed.includes('customer') ? '/auth/login' : '/management-portal';
    return <Navigate to={target} replace state={{ from: location.pathname }} />;
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
}
