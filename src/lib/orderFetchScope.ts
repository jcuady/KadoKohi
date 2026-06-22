import type { Order } from '../types/domain';
import type { User } from '../types/domain';
import type { OrderPeriod } from './orderTime';
import { periodRangeStart } from './orderTime';

export type FetchOrdersScope = {
  branchId?: string;
  channels?: Order['channel'][];
  activeOnly?: boolean;
  since?: string;
  limit?: number;
  customerId?: string;
};

export const BARISTA_ORDER_CHANNELS: Order['channel'][] = [
  'online',
  'dine-in',
  'takeout',
  'pos',
  'merch',
];

export function defaultAdminOrderScope(): FetchOrdersScope {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  return { since: since.toISOString(), limit: 1000 };
}

export function adminOrderScopeFromFilters(input: {
  branchId?: string;
  channel?: Order['channel'] | 'all';
  period?: OrderPeriod;
}): FetchOrdersScope {
  const scope: FetchOrdersScope = { ...defaultAdminOrderScope() };
  if (input.branchId && input.branchId !== 'all') scope.branchId = input.branchId;
  if (input.channel && input.channel !== 'all') scope.channels = [input.channel];
  if (input.period && input.period !== 'all') {
    scope.since = periodRangeStart(input.period).toISOString();
  } else if (input.period === 'all') {
    delete scope.since;
    scope.limit = 2000;
  }
  return scope;
}

export function orderScopeForUser(user: User | null, adminScope?: FetchOrdersScope): FetchOrdersScope | undefined {
  if (!user) return undefined;
  if (user.role === 'customer') {
    return { customerId: user.id, limit: 100 };
  }
  if (user.role === 'barista') {
    if (!user.branchId) return { limit: 0 };
    return {
      branchId: user.branchId,
      channels: BARISTA_ORDER_CHANNELS,
      activeOnly: true,
      limit: 300,
    };
  }
  if (user.role === 'staff') {
    return user.branchId
      ? { branchId: user.branchId, limit: 500 }
      : { limit: 500 };
  }
  if (user.role === 'admin') {
    return adminScope ?? defaultAdminOrderScope();
  }
  return undefined;
}
