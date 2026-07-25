import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Order } from '../types/domain';
import {
  countDrinkStampsForOrder,
  persistLoyaltyStampsForCompletedOrder,
} from './loyaltyStamps';

vi.mock('./supabase/repositories/ordering', () => ({
  orderingRepo: {
    awardLoyaltyStamps: vi.fn(),
    fetchUserById: vi.fn(),
  },
}));

import { orderingRepo } from './supabase/repositories/ordering';

const awardMock = vi.mocked(orderingRepo.awardLoyaltyStamps);

describe('loyaltyStamps', () => {
  beforeEach(() => {
    awardMock.mockReset();
  });

  it('counts drink qty and ignores merch lines', () => {
    expect(
      countDrinkStampsForOrder({
        channel: 'online',
        items: [
          {
            id: '1',
            productId: 'a',
            productNameSnapshot: 'Latte',
            qty: 2,
            unitPrice: 100,
            lineTotal: 200,
            itemType: 'coffee',
          },
          {
            id: '2',
            productId: 'b',
            productNameSnapshot: 'Tee',
            qty: 1,
            unitPrice: 500,
            lineTotal: 500,
            itemType: 'merch',
          },
        ],
      }),
    ).toBe(2);
    expect(countDrinkStampsForOrder({ channel: 'merch', items: [] })).toBe(0);
  });

  it('surfaces RPC failures after completion (does not swallow)', async () => {
    awardMock.mockRejectedValueOnce(new Error('rpc down'));
    const msg = await persistLoyaltyStampsForCompletedOrder({
      id: 'ord-1',
      customerId: 'cust-1',
    } as Pick<Order, 'id' | 'customerId'>);
    expect(msg).toMatch(/loyalty stamps failed/i);
    expect(msg).toContain('rpc down');
  });

  it('no-ops without customerId', async () => {
    const msg = await persistLoyaltyStampsForCompletedOrder({ id: 'ord-1' });
    expect(msg).toBeNull();
    expect(awardMock).not.toHaveBeenCalled();
  });
});
