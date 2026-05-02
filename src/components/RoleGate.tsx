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
 */
export default function RoleGate({ allowed, children }: RoleGateProps) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
}
