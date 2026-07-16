import { describe, expect, it, beforeEach } from 'vitest';
import { useCartStore, cartLineMergeKey } from '../store/cartStore';

describe('cartStore addItem merge', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false });
  });

  it('should merge identical coffee lines into one counted row', () => {
    const base = {
      itemType: 'coffee' as const,
      productId: 'latte',
      productNameSnapshot: 'KADO Latte',
      qty: 1,
      milkId: 'oat',
      sizeId: '12',
      temperature: 'iced' as const,
      unitPrice: 176,
      lineTotal: 176,
    };
    useCartStore.getState().addItem(base, { openCart: false });
    useCartStore.getState().addItem(base, { openCart: false });
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.qty).toBe(2);
    expect(items[0]?.lineTotal).toBe(352);
    expect(cartLineMergeKey(items[0]!)).toContain('latte');
  });

  it('should keep different milk configs separate', () => {
    useCartStore.getState().addItem(
      {
        itemType: 'coffee',
        productId: 'latte',
        productNameSnapshot: 'KADO Latte',
        qty: 1,
        milkId: 'oat',
        unitPrice: 176,
        lineTotal: 176,
      },
      { openCart: false },
    );
    useCartStore.getState().addItem(
      {
        itemType: 'coffee',
        productId: 'latte',
        productNameSnapshot: 'KADO Latte',
        qty: 1,
        milkId: 'whole',
        unitPrice: 176,
        lineTotal: 176,
      },
      { openCart: false },
    );
    expect(useCartStore.getState().items).toHaveLength(2);
  });
});
