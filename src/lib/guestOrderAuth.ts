import type { User } from '../types/domain';
import { isInternalRole } from './roles';

/** Staff sessions block guest-channel RPCs — place orders via anon client instead. */
export function guestOrderUsesAnonSession(
  user: Pick<User, 'role'> | null | undefined,
): boolean {
  return isInternalRole(user?.role);
}

export function guestOrderCustomerId(
  user: Pick<User, 'id' | 'role'> | null | undefined,
): string | undefined {
  if (!user || guestOrderUsesAnonSession(user)) return undefined;
  return user.id;
}
