import { useCallback } from 'react';
import { useCartStore } from '../store/cartStore';
import { useOnlineOrderHours } from './useOnlineOrderHours';

/** Open/close cart; when online ordering is closed, opening still shows the hours notice. */
export function useCartToggle() {
  const isOpen = useCartStore((s) => s.isOpen);
  const openCart = useCartStore((s) => s.openCart);
  const closeCart = useCartStore((s) => s.closeCart);
  const orderHours = useOnlineOrderHours();

  const toggleCart = useCallback(() => {
    if (isOpen) {
      closeCart();
      return;
    }
    openCart();
  }, [isOpen, openCart, closeCart]);

  const tryOpenCart = useCallback(() => {
    if (!orderHours.isOpen && isOpen) return;
    openCart();
  }, [orderHours.isOpen, isOpen, openCart]);

  return { toggleCart, tryOpenCart, orderHours, isCartOpen: isOpen };
}
