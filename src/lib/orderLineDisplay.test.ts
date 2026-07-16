import { describe, expect, it } from 'vitest';
import { consolidateOrderItemsForDisplay } from './orderLineDisplay';
import type { OrderItem } from '../types/domain';

function line(partial: Partial<OrderItem> & Pick<OrderItem, 'id' | 'productId'>): OrderItem {
  return {
    productNameSnapshot: 'KADO Latte',
    unitPrice: 176,
    qty: 1,
    lineTotal: 176,
    ...partial,
  };
}

describe('consolidateOrderItemsForDisplay', () => {
  it('merges identical lines into a counted row', () => {
    const rows = consolidateOrderItemsForDisplay([
      line({ id: 'a', productId: 'latte', sizeLabelSnapshot: '12oz', milkLabelSnapshot: 'Oat' }),
      line({ id: 'b', productId: 'latte', sizeLabelSnapshot: '12oz', milkLabelSnapshot: 'Oat' }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.qty).toBe(2);
    expect(rows[0]?.lineTotal).toBe(352);
    expect(rows[0]?.name).toBe('KADO Latte');
  });

  it('keeps different configs separate', () => {
    const rows = consolidateOrderItemsForDisplay([
      line({ id: 'a', productId: 'latte', milkLabelSnapshot: 'Oat', temperature: 'iced' }),
      line({ id: 'b', productId: 'latte', milkLabelSnapshot: 'Whole', temperature: 'hot' }),
    ]);
    expect(rows).toHaveLength(2);
  });
});
