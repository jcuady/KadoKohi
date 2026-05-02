import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  MapPin,
  Truck,
  Wallet,
  CreditCard,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { useBranchStore } from '../store/branchStore';
import { useSettingsStore } from '../store/settingsStore';
import { formatPhp, computeOrderTotals } from '../lib/money';
import { newId } from '../lib/id';
import type { OrderItem, PaymentMethod } from '../types/domain';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, clear } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const addLoyaltyStamps = useAuthStore((s) => s.addLoyaltyStamps);
  const createOrder = useOrderStore((s) => s.createOrder);
  const branches = useBranchStore((s) => s.branches);
  const taxRate = useSettingsStore((s) => s.settings.taxRate);

  const activeBranches = useMemo(
    () => branches.filter((b) => b.status === 'active'),
    [branches],
  );

  const [branchId, setBranchId] = useState<string>(() => activeBranches[0]?.id ?? '');
  const [guestName, setGuestName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pay-at-store');
  const [placed, setPlaced] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedBranch = useMemo(
    () => activeBranches.find((b) => b.id === branchId),
    [activeBranches, branchId],
  );

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const totals = useMemo(() => {
    const sub = items.reduce((s, i) => s + i.lineTotal, 0);
    return computeOrderTotals(sub, 0, taxRate);
  }, [items, taxRate]);

  const canOrder =
    items.length > 0 && !!branchId && (!!user || guestName.trim().length > 0);

  const handleClose = () => {
    closeCart();
    if (placed) setTimeout(() => setPlaced(false), 300);
  };

  const placeOrder = async () => {
    if (!canOrder) return;
    setLoading(true);

    const orderItems: OrderItem[] = items.map((line) => ({
      id: newId(),
      productId: line.productId,
      productNameSnapshot: line.productNameSnapshot,
      milkId: line.milkId,
      milkLabelSnapshot: line.milkLabelSnapshot,
      temperature: line.temperature,
      unitPrice: line.unitPrice,
      qty: line.qty,
      lineTotal: line.lineTotal,
    }));

    createOrder({
      channel: 'online',
      branchId,
      customerId: user?.id,
      guestName: user ? undefined : guestName.trim(),
      paymentMethod,
      status: 'pending',
      items: orderItems,
      subtotal: totals.subtotal,
      modifiersTotal: 0,
      tax: totals.tax,
      total: totals.total,
    });

    if (user?.role === 'customer') addLoyaltyStamps(1);
    clear();
    setPlaced(true);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[200] bg-kado-dark/55 backdrop-blur-[3px]"
            onClick={handleClose}
          />

          {/* Drawer panel */}
          <motion.aside
            key="cart-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-[420px] flex flex-col bg-[#FAF7F2] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-kado-dark/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-kado-red" />
                <span className="font-display font-bold text-lg text-kado-dark">Your Cart</span>
                {count > 0 && (
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-kado-red text-kado-cream px-2.5 py-1 rounded-full leading-none">
                    {count}
                  </span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-kado-dark/8 transition-colors text-kado-dark/60 hover:text-kado-dark"
                aria-label="Close cart"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Success state */}
            {placed ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-0">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="font-display text-2xl font-bold text-kado-dark mb-2">
                  Order placed!
                </h3>
                <p className="text-kado-dark/58 text-sm mb-8 max-w-xs leading-relaxed">
                  We've received your order and will start preparing it shortly.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <button
                    onClick={handleClose}
                    className="rounded-full bg-kado-dark text-kado-cream px-8 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors"
                  >
                    Continue browsing
                  </button>
                  {user && (
                    <Link
                      to="/account/orders"
                      onClick={handleClose}
                      className="text-sm text-kado-dark/60 hover:text-kado-red transition-colors flex items-center justify-center gap-1"
                    >
                      View my orders <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ) : items.length === 0 ? (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <ShoppingBag className="w-16 h-16 text-kado-dark/12 mb-4" />
                <h3 className="font-display text-xl font-bold text-kado-dark mb-2">
                  Your cart is empty
                </h3>
                <p className="text-kado-dark/50 text-sm mb-8 max-w-xs leading-relaxed">
                  Browse the menu and add your favourites — your perfect cup is waiting.
                </p>
                <Link
                  to="/menu"
                  onClick={handleClose}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-kado-dark text-kado-dark px-7 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark hover:text-kado-cream transition-colors"
                >
                  Browse menu <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <>
                {/* Item list */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
                  {items.map((line) => (
                    <motion.div
                      key={line.key}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex gap-4 rounded-2xl bg-white border border-kado-dark/8 p-4 shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-kado-dark text-sm leading-snug">
                          {line.productNameSnapshot}
                        </p>
                        <div className="flex flex-wrap gap-x-2 mt-0.5">
                          {line.milkLabelSnapshot && (
                            <span className="text-[10px] text-kado-dark/48">
                              {line.milkLabelSnapshot} milk
                            </span>
                          )}
                          {line.temperature && (
                            <span className="text-[10px] text-kado-dark/48 capitalize">
                              {line.temperature}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-kado-red text-sm mt-2">
                          {formatPhp(line.lineTotal)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                        <button
                          onClick={() => removeItem(line.key)}
                          className="text-kado-dark/35 hover:text-kado-red transition-colors p-0.5"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-2 bg-[#EFE6D5] rounded-full px-2.5 py-1.5">
                          <button
                            onClick={() => updateQty(line.key, line.qty - 1)}
                            className="w-5 h-5 flex items-center justify-center hover:text-kado-red transition-colors"
                            aria-label="Decrease"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-bold text-kado-dark min-w-[1ch] text-center select-none">
                            {line.qty}
                          </span>
                          <button
                            onClick={() => updateQty(line.key, line.qty + 1)}
                            className="w-5 h-5 flex items-center justify-center hover:text-kado-red transition-colors"
                            aria-label="Increase"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Checkout footer */}
                <div className="shrink-0 border-t border-kado-dark/10 px-5 py-5 space-y-4 bg-[#FAF7F2]">
                  {/* Branch selector */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5">
                      Pickup at
                    </label>
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full rounded-xl border border-kado-dark/15 bg-white px-4 py-2.5 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/25 transition"
                    >
                      {activeBranches.length === 0 && (
                        <option value="">No active branches</option>
                      )}
                      {activeBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    {selectedBranch?.address && (
                      <p className="text-[10px] text-kado-dark/45 mt-1 ml-1 leading-snug">
                        {selectedBranch.address}
                        {selectedBranch.city ? `, ${selectedBranch.city}` : ''}
                      </p>
                    )}
                  </div>

                  {/* Order type selector */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5">
                      Order type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-kado-red text-white px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Pickup
                      </button>
                      <button
                        type="button"
                        disabled
                        className="relative flex items-center justify-center gap-1.5 rounded-xl border border-kado-dark/10 text-kado-dark/35 px-3 py-2.5 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Delivery
                        <span className="absolute -top-2 -right-1 text-[8px] font-bold uppercase tracking-wider bg-kado-dark/8 text-kado-dark/45 px-1.5 py-0.5 rounded-full leading-none">
                          Soon
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Payment method selector */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5">
                      Payment
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pay-at-store')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                          paymentMethod === 'pay-at-store'
                            ? 'bg-kado-red text-white'
                            : 'border border-kado-dark/10 text-kado-dark/55 hover:border-kado-dark/25'
                        }`}
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        Pay at store
                      </button>
                      <button
                        type="button"
                        disabled
                        className="relative flex items-center justify-center gap-1.5 rounded-xl border border-kado-dark/10 text-kado-dark/35 px-3 py-2.5 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        PayMongo
                        <span className="absolute -top-2 -right-1 text-[8px] font-bold uppercase tracking-wider bg-kado-dark/8 text-kado-dark/45 px-1.5 py-0.5 rounded-full leading-none">
                          Soon
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Guest name (shown when not logged in) */}
                  {!user && (
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5">
                        Your name
                      </label>
                      <input
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Juan"
                        className="w-full rounded-xl border border-kado-dark/15 bg-white px-4 py-2.5 text-sm text-kado-dark placeholder:text-kado-dark/30 focus:outline-none focus:ring-2 focus:ring-kado-red/25 transition"
                      />
                      <p className="text-[9px] text-kado-dark/45 mt-1 ml-1">
                        Or{' '}
                        <Link
                          to="/auth/login"
                          onClick={handleClose}
                          className="underline underline-offset-2 hover:text-kado-red"
                        >
                          sign in
                        </Link>{' '}
                        to track orders &amp; earn stamps.
                      </p>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-kado-dark/58">
                      <span>Subtotal</span>
                      <span>{formatPhp(totals.subtotal)}</span>
                    </div>
                    {totals.tax > 0 && (
                      <div className="flex justify-between text-kado-dark/58">
                        <span>Tax ({taxRate}%)</span>
                        <span>{formatPhp(totals.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-display font-bold text-base text-kado-dark pt-1.5 border-t border-kado-dark/10">
                      <span>Total</span>
                      <span className="text-kado-red">{formatPhp(totals.total)}</span>
                    </div>
                  </div>

                  {/* Place order */}
                  <button
                    type="button"
                    onClick={placeOrder}
                    disabled={!canOrder || loading}
                    className="w-full rounded-2xl bg-kado-red text-kado-cream py-4 text-sm font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-kado-dark transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? 'Placing…' : 'Place order'}
                    {!loading && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
