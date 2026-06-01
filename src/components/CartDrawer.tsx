import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  ChevronRight,
  ArrowRight,
  MapPin,
  Truck,
  CreditCard,
  QrCode,
  LogIn,
  Clock,
  Gift,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { useBranchStore } from '../store/branchStore';
import { useSettingsStore } from '../store/settingsStore';
import { useOnlineOrderHours } from '../hooks/useOnlineOrderHours';
import OnlineOrderHoursNotice from './OnlineOrderHoursNotice';
import { formatPhp } from '../lib/money';
import { computeVoucherDiscount, computeCartTotalsWithDiscount } from '../lib/voucherDiscount';
import { newId } from '../lib/id';
import type { OrderItem, PaymentMethod } from '../types/domain';
import { useVoucherStore } from '../store/voucherStore';
import { useCheckoutStore, findSelectedVoucher } from '../store/checkoutStore';
import { usePromoStore } from '../store/promoStore';
import { Tag, X as XIcon } from 'lucide-react';

export default function CartDrawer() {
  const navigate = useNavigate();
  const { items, isOpen, closeCart, removeItem, updateQty, clear } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const createOrder = useOrderStore((s) => s.createOrder);
  const branches = useBranchStore((s) => s.branches);
  const taxRate = useSettingsStore((s) => s.settings.taxRate);
  const orderHours = useOnlineOrderHours();
  const activeVouchersForCustomer = useVoucherStore((s) => s.activeVouchersForCustomer);
  const redeemVoucher = useVoucherStore((s) => s.redeemVoucher);
  const selectedVoucherId = useCheckoutStore((s) => s.selectedVoucherId);
  const setSelectedVoucherId = useCheckoutStore((s) => s.setSelectedVoucherId);
  const clearVoucher = useCheckoutStore((s) => s.clearVoucher);
  const appliedPromoCode = useCheckoutStore((s) => s.appliedPromoCode);
  const promoDiscount = useCheckoutStore((s) => s.promoDiscount);
  const setAppliedPromoCode = useCheckoutStore((s) => s.setAppliedPromoCode);
  const clearPromoCode = useCheckoutStore((s) => s.clearPromoCode);
  const clearAll = useCheckoutStore((s) => s.clearAll);
  const validateCode = usePromoStore((s) => s.validateCode);

  const [promoInput, setPromoInput] = useState('');
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const activeBranches = useMemo(
    () => branches.filter((b) => b.status === 'active'),
    [branches],
  );

  const [branchId, setBranchId] = useState<string>(() => activeBranches[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const paymentMethod: PaymentMethod = 'gcash-qr';

  const selectedBranch = useMemo(
    () => activeBranches.find((b) => b.id === branchId),
    [activeBranches, branchId],
  );

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  const activeVouchers = useMemo(
    () => (user?.id ? activeVouchersForCustomer(user.id) : []),
    [activeVouchersForCustomer, user?.id],
  );

  const selectedVoucher = useMemo(
    () => findSelectedVoucher(activeVouchers, selectedVoucherId),
    [activeVouchers, selectedVoucherId],
  );

  const voucherCalc = useMemo(() => {
    if (!selectedVoucher) return { discount: 0, eligible: true as const };
    return computeVoucherDiscount(items, selectedVoucher.rewardType, selectedVoucher.rewardValue);
  }, [items, selectedVoucher]);

  // Total discount = loyalty voucher OR promo code (not both simultaneously)
  const effectiveDiscount = appliedPromoCode ? promoDiscount : voucherCalc.discount;

  const totals = useMemo(
    () => computeCartTotalsWithDiscount(items, taxRate, effectiveDiscount),
    [items, taxRate, effectiveDiscount],
  );

  const voucherBlocksCheckout =
    !!selectedVoucher && !voucherCalc.eligible && voucherCalc.discount <= 0;

  useEffect(() => {
    if (selectedVoucherId && !activeVouchers.some((v) => v.id === selectedVoucherId)) {
      clearVoucher();
    }
  }, [activeVouchers, selectedVoucherId, clearVoucher]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoMsg(null);
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const result = await validateCode(promoInput, subtotal, branchId);
    if (result.ok && result.code) {
      setAppliedPromoCode(result.code, result.discount);
      setPromoMsg({ ok: true, text: `"${result.code.code}" applied — saves ₱${result.discount.toFixed(2)}` });
      setPromoInput('');
    } else {
      setPromoMsg({ ok: false, text: result.reason ?? 'Invalid code.' });
    }
    setPromoLoading(false);
  };

  const isCustomer = user?.role === 'customer';
  const canOrder =
    items.length > 0 && !!branchId && isCustomer && orderHours.isOpen && !voucherBlocksCheckout;

  const handleClose = () => {
    closeCart();
  };

  const hasMerch = items.some((i) => i.itemType === 'merch');
  const hasCoffee = items.some((i) => i.itemType === 'coffee' || !i.itemType);

  const placeOrder = async () => {
    if (!canOrder) return;
    setLoading(true);
    setCheckoutError('');

    const orderItems: OrderItem[] = items.map((line) => ({
      id: newId(),
      productId: line.productId,
      productNameSnapshot: line.productNameSnapshot,
      itemType: line.itemType ?? 'coffee',
      milkId: line.milkId,
      milkLabelSnapshot: line.milkLabelSnapshot,
      sizeId: line.sizeId,
      sizeLabelSnapshot: line.sizeLabelSnapshot,
      temperature: line.temperature,
      merchVariants: line.selectedVariants?.map((v) => ({
        groupName: v.groupName,
        optionLabel: v.optionLabel,
        priceDelta: v.priceDelta,
      })),
      unitPrice: line.unitPrice,
      qty: line.qty,
      lineTotal: line.lineTotal,
    }));

    const channel = hasCoffee ? 'online' : 'merch';

    try {
      const order = await createOrder({
        channel,
        branchId,
        customerId: user!.id,
        paymentMethod,
        status: 'pending',
        paymentStatus: 'unpaid',
        items: orderItems,
        subtotal: totals.subtotal,
        modifiersTotal: 0,
        tax: totals.tax,
        total: totals.total,
        loyaltyVoucherId: selectedVoucher?.id,
        loyaltyVoucherCode: selectedVoucher?.code,
        loyaltyDiscountTotal: totals.discount > 0 ? totals.discount : undefined,
        promoCode: appliedPromoCode?.code,
      });

      if (selectedVoucher) {
        redeemVoucher(selectedVoucher.id, order.id);
      }

      clear();
      clearAll();
      closeCart();
      navigate(`/account/orders?placed=${order.id}`);
    } catch {
      setCheckoutError('Could not place your order. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
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

            {!orderHours.isOpen ? (
              <div className="flex-1 flex flex-col px-5 py-6 overflow-y-auto">
                <OnlineOrderHoursNotice status={orderHours} variant="cart" className="mb-4" />
                {items.length > 0 ? (
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-kado-dark/45 px-1">
                      In your cart ({count})
                    </p>
                    {items.map((line) => (
                      <div
                        key={line.key}
                        className="flex gap-3 rounded-2xl bg-white border border-kado-dark/8 p-3 opacity-80"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-kado-dark truncate">{line.productNameSnapshot}</p>
                          <p className="text-xs text-kado-red font-bold mt-0.5">{formatPhp(line.lineTotal)}</p>
                        </div>
                        <span className="text-xs font-bold text-kado-dark/50">×{line.qty}</span>
                      </div>
                    ))}
                    <p className="text-xs text-kado-dark/50 px-1 pt-2">
                      Checkout reopens during store hours. You can edit items when ordering is open again.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                    <Clock className="w-12 h-12 text-kado-dark/15 mb-4" />
                    <h3 className="font-display text-lg font-bold text-kado-dark mb-2">Ordering is closed</h3>
                    <p className="text-kado-dark/50 text-sm max-w-xs leading-relaxed">
                      The cart opens during our online order hours. Check back during the window above.
                    </p>
                  </div>
                )}
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <ShoppingBag className="w-16 h-16 text-kado-dark/12 mb-4" />
                <h3 className="font-display text-xl font-bold text-kado-dark mb-2">
                  Your cart is empty
                </h3>
                <p className="text-kado-dark/50 text-sm mb-6 max-w-xs leading-relaxed">
                  Browse the menu and add your favourites — your perfect cup is waiting.
                </p>
                <OnlineOrderHoursNotice status={orderHours} variant="inline" className="mb-6 max-w-xs w-full text-left" />
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
                      {line.image && (
                        <img src={line.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-kado-dark text-sm leading-snug">
                          {line.productNameSnapshot}
                        </p>
                        <div className="flex flex-wrap gap-x-2 mt-0.5">
                          {line.itemType === 'merch' && line.selectedVariants?.map((v) => (
                            <span key={v.optionId} className="text-[10px] text-kado-dark/48">
                              {v.groupName}: {v.optionLabel}
                            </span>
                          ))}
                          {line.milkLabelSnapshot && (
                            <span className="text-[10px] text-kado-dark/48">
                              {line.milkLabelSnapshot} milk
                            </span>
                          )}
                          {line.sizeLabelSnapshot && (
                            <span className="text-[10px] text-kado-dark/48">
                              {line.sizeLabelSnapshot}
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
                  <OnlineOrderHoursNotice status={orderHours} variant="compact" />

                  {hasMerch && (
                    <div className="rounded-xl border border-kado-red/20 bg-kado-red/5 px-4 py-3 text-xs text-kado-dark/70 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-kado-red shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <span className="font-bold text-kado-dark">Merch is claim-in-store only.</span>{' '}
                        We don&apos;t deliver merch — pay with GCash now, then pick up your items at your
                        selected branch once we confirm payment.
                      </p>
                    </div>
                  )}

                  {/* Branch selector */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5">
                      {hasMerch && !hasCoffee ? 'Claim / pick up at' : 'Pickup at'}
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
                        className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider bg-kado-red text-white"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        GCash QR
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

                  {!isCustomer && (
                    <div className="rounded-xl border border-kado-red/20 bg-kado-red/5 px-4 py-3 text-xs text-kado-dark/65">
                      <p className="font-bold text-kado-dark mb-1 flex items-center gap-1.5">
                        <LogIn className="w-3.5 h-3.5 text-kado-red" />
                        Sign in to place order
                      </p>
                      <p className="leading-relaxed">
                        GCash checkout requires an account so you can pay and upload proof of payment.
                      </p>
                      <Link
                        to="/auth/login"
                        onClick={handleClose}
                        className="inline-flex items-center gap-1 mt-2 font-bold uppercase tracking-wider text-[10px] text-kado-red hover:underline"
                      >
                        Sign in <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}

                  {isCustomer && activeVouchers.length > 0 && (
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-kado-red" />
                        Kado Circle voucher
                      </label>
                      <select
                        value={selectedVoucherId ?? ''}
                        onChange={(e) => setSelectedVoucherId(e.target.value || null)}
                        className="w-full rounded-xl border border-kado-dark/15 bg-white px-4 py-2.5 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/25"
                      >
                        <option value="">No voucher</option>
                        {activeVouchers.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.code} — {v.rewardNameSnapshot}
                          </option>
                        ))}
                      </select>
                      {selectedVoucher && !voucherCalc.eligible && voucherCalc.reason && (
                        <p className="text-[10px] text-red-600 mt-1.5 leading-snug">{voucherCalc.reason}</p>
                      )}
                      {selectedVoucher && voucherCalc.eligible && totals.discount > 0 && (
                        <p className="text-[10px] text-emerald-700 mt-1.5 font-semibold">
                          Saves {formatPhp(totals.discount)} on this order
                        </p>
                      )}
                      <Link
                        to="/account/vouchers"
                        onClick={handleClose}
                        className="text-[10px] font-bold text-kado-red hover:underline mt-1 inline-block"
                      >
                        Manage vouchers
                      </Link>
                    </div>
                  )}

                  {/* Promo code input */}
                  {isCustomer && (
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-kado-red" />
                        Promo code
                      </label>
                      {appliedPromoCode ? (
                        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
                          <div>
                            <p className="text-xs font-black text-emerald-800 font-mono tracking-wider">{appliedPromoCode.code}</p>
                            <p className="text-[10px] text-emerald-700">{appliedPromoCode.name} · saves ₱{promoDiscount.toFixed(2)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { clearPromoCode(); setPromoMsg(null); }}
                            className="text-emerald-600 hover:text-emerald-900 p-1"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            value={promoInput}
                            onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoMsg(null); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleApplyPromo(); } }}
                            placeholder="Enter code"
                            className="flex-1 rounded-xl border border-kado-dark/15 bg-white px-3 py-2.5 text-xs font-mono font-bold text-kado-dark uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-kado-red/25"
                          />
                          <button
                            type="button"
                            onClick={() => void handleApplyPromo()}
                            disabled={promoLoading || !promoInput.trim()}
                            className="rounded-xl bg-kado-dark text-kado-cream px-3 py-2.5 text-[10px] font-black uppercase tracking-wider hover:bg-kado-red transition-colors disabled:opacity-40"
                          >
                            {promoLoading ? '…' : 'Apply'}
                          </button>
                        </div>
                      )}
                      {promoMsg && (
                        <p className={`text-[10px] mt-1.5 leading-snug font-semibold ${promoMsg.ok ? 'text-emerald-700' : 'text-red-600'}`}>
                          {promoMsg.text}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Totals */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-kado-dark/58">
                      <span>Subtotal</span>
                      <span>{formatPhp(totals.subtotal)}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>
                          {appliedPromoCode ? `Promo (${appliedPromoCode.code})` : `Voucher (${selectedVoucher?.code})`}
                        </span>
                        <span>−{formatPhp(totals.discount)}</span>
                      </div>
                    )}
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

                  {checkoutError && (
                    <p className="text-xs text-red-600 font-medium text-center">{checkoutError}</p>
                  )}

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
