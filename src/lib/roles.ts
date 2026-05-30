import type { User } from '../types/domain';

/** Primary super-admin account — full access to every branch. */
export const SUPER_ADMIN_EMAIL = 'admin@kadokohi.com';

/** Admin accounts are never branch-scoped; null branchId = all branches. */
export function hasAllBranchAccess(
  user: Pick<User, 'role' | 'branchId'> | null | undefined,
): boolean {
  return user?.role === 'admin';
}

export function isSuperAdmin(
  user: Pick<User, 'role' | 'email' | 'branchId'> | null | undefined,
): boolean {
  if (!user || user.role !== 'admin') return false;
  return user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/** Admins must not carry a branch assignment in the database or UI. */
export function profileBranchId(user: Pick<User, 'role' | 'branchId'>): string | null {
  if (user.role === 'admin') return null;
  return user.branchId ?? null;
}
