import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { OrderItem, Product } from '../types/domain';
import { useMenuStore } from '../store/menuStore';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { useTableStore } from '../store/tableStore';
import { useBranchStore } from '../store/branchStore';
import { formatPhp, computeOrderTotals } from '../lib/money';
import { useSettingsStore } from '../store/settingsStore';
import { getProductDescription, getProductImageUrl } from '../lib/productImage';
import { newId } from '../lib/id';
import { clampText, formatOrderError } from '../lib/validation';
import { cartLinesMatchMenu, ensureOrderReadiness } from '../lib/orderReadiness';
import { clearTrackedOrder, getTrackedOrder, setTrackedOrder } from '../lib/guestOrders';
import QrProductSheet, { type QrCartPayload } from '../components/qr/QrProductSheet';
import OrderTrackingPanel from '../components/order/OrderTrackingPanel';
import { startGuestPageRealtime, stopGuestPageRealtime } from '../lib/supabase/guestPageRealtime';
import {
  ShoppingBag,
  ChevronUp,
  ChevronDown,
  Minus,
  Plus,
  Trash2,
  QrCode,
} from 'lucide-react';

type CartLine = QrCartPayload & { key: string };

function resolveUnit(product: Product, milkId?: string): { unit: number; milkLabel?: string } {
  let unit = product.basePrice;
  let milkLabel: string | undefined;
  if (milkId && product.milks?.length) {
    const m = product.milks.find((x) => x.id === milkId);
    if (m) {
      unit += m.priceDelta;
      milkLabel = m.label;
    }
  }
  return { unit, milkLabel };
}

export default function OrderQR() {
  const { code } = useParams<{ code: string }>();
  const user = useAuthStore((s) => s.user);
  const taxRate = useSettingsStore((s) => s.settings.taxRate);
  const table = useTableStore((s) => s.getByCode(code ?? ''));
  const tablesHydrated = useTableStore((s) => s.hydrated);
  const branches = useBranchStore((s) => s.branches);
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const menuReady = useMenuStore((s) => s.remoteLoaded);
  const productsByCategory = useMenuStore((s) => s.productsByCategory);
  const createOrder = useOrderStore((s) => s.createOrder);

  const branchName = useMemo(
    () => branches.find((b) => b.id === table?.branchId)?.name ?? 'Kado Kohi',
    [branches, table?.branchId],
  );

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );

  const sessionKey = `qr.${code ?? 'unknown'}`;

  const [activeCat, setActiveCat] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartExpanded, setCartExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);

  // Restore an in-progress order for this browser session (per-table).
  useEffect(() => {
    const ref = getTrackedOrder(sessionKey);
    if (ref) setTrackedOrderId(ref.orderId);
  }, [sessionKey]);

  useEffect(() => {
    startGuestPageRealtime();
    return () => stopGuestPageRealtime();
  }, []);

  useEffect(() => {
    void ensureOrderReadiness();
  }, []);

  useEffect(() => {
    if (!sortedCategories.length) return;
    if (!activeCat || !sortedCategories.some((c) => c.id === activeCat)) {
      setActiveCat(sortedCategories[0].id);
    }
  }, [sortedCategories, activeCat]);

  const list = useMemo(
    () => (activeCat ? productsByCategory(activeCat) : []),
    [activeCat, productsByCategory],
  );

  const cartCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);

  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let modifiers = 0;
    const lines: OrderItem[] = [];

    for (const line of cart) {
      const p = products.find((x) => x.id === line.productId);
      if (!p) continue;
      const { unit, milkLabel } = resolveUnit(p, line.milkId);
      const lineTotal = unit * line.qty;
      subtotal += p.basePrice * line.qty;
      modifiers += (unit - p.basePrice) * line.qty;
      lines.push({
        id: newId(),
        productId: p.id,
        productNameSnapshot: p.name,
        itemType: 'coffee',
        milkId: line.milkId,
        milkLabelSnapshot: milkLabel ?? line.milkLabel,
        temperature: line.temperature,
        unitPrice: unit,
        qty: line.qty,
        lineTotal,
      });
    }

    const { tax, total } = computeOrderTotals(subtotal, modifiers, taxRate);
    return { lines, subtotal, modifiers, tax, total };
  }, [cart, products, taxRate]);

  const cartStale = cart.length > 0 && !cartLinesMatchMenu(cart, cartTotals.lines);

  const addLine = (payload: QrCartPayload) => {
    setCart((prev) => {
      const match = prev.find(
        (l) =>
          l.productId === payload.productId &&
          l.milkId === payload.milkId &&
          l.temperature === payload.temperature,
      );
      if (match) {
        return prev.map((l) =>
          l.key === match.key ? { ...l, qty: l.qty + payload.qty } : l,
        );
      }
      return [...prev, { ...payload, key: newId() }];
    });
    setCartExpanded(true);
  };

  const updateLineQty = (key: string, qty: number) => {
    if (qty <= 0) {
      setCart((c) => c.filter((x) => x.key !== key));
      return;
    }
    setCart((c) => c.map((x) => (x.key === key ? { ...x, qty } : x)));
  };

  const placeOrder = async () => {
    if (!table || cartTotals.lines.length === 0 || submitting) return;
    if (cartStale) {
      setOrderError('Some items are out of date. Remove them from your cart and add drinks again.');
      return;
    }
    setOrderError('');
    setSubmitting(true);
    try {
      await ensureOrderReadiness();
      const order = await createOrder({
        channel: 'dine-in',
        branchId: table.branchId,
        tableId: table.id,
        customerId: user?.id,
        guestName: user?.name ? clampText(user.name, 80) : table.label,
        status: 'pending',
        items: cartTotals.lines,
        subtotal: cartTotals.subtotal,
        modifiersTotal: cartTotals.modifiers,
        tax: cartTotals.tax,
        total: cartTotals.total,
      });
      setTrackedOrder(sessionKey, {
        orderId: order.id,
        shortCode: order.shortCode,
        label: table.label,
        placedAt: order.createdAt,
      });
      setTrackedOrderId(order.id);
      setCart([]);
      setCartExpanded(false);
    } catch (err) {
      setOrderError(formatOrderError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderAgain = () => {
    clearTrackedOrder(sessionKey);
    setTrackedOrderId(null);
  };

  if (!tablesHydrated || !menuReady) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF7F2] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-kado-dark/15 border-t-kado-red" />
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF7F2] flex items-center justify-center px-6 py-16 text-center">
        <div className="max-w-sm">
          <QrCode className="w-12 h-12 text-kado-red/40 mx-auto mb-4" />
          <h1 className="font-display text-2xl sm:text-3xl font-black text-kado-dark mb-2">Table not found</h1>
          <p className="text-kado-dark/60 text-sm mb-6">
            The QR code &ldquo;{code}&rdquo; doesn&apos;t match any active table.
          </p>
          <Link to="/" className="text-sm font-bold text-kado-red hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (trackedOrderId) {
    return (
      <OrderTrackingPanel
        orderId={trackedOrderId}
        channel="dine-in"
        contextLabel={table.label}
        isLoggedIn={Boolean(user)}
        onOrderAgain={handleOrderAgain}
      />
    );
  }

  if (!table.active) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF7F2] flex items-center justify-center px-6 py-16 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-2xl sm:text-3xl font-black text-kado-dark mb-2">Table inactive</h1>
          <p className="text-kado-dark/60 text-sm mb-6">
            {table.label} is currently disabled. Please ask staff for help.
          </p>
          <Link to="/" className="text-sm font-bold text-kado-red hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] font-sans flex flex-col">
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-kado-dark/8">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-kado-red text-white flex items-center justify-center font-display font-black text-lg shrink-0">
              角
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-kado-red">
                Dine-in · {table.label}
              </p>
              <h1 className="font-display text-lg sm:text-xl font-black text-kado-dark truncate">
                Order from your table
              </h1>
              <p className="text-[11px] text-kado-dark/45 truncate">{branchName}</p>
            </div>
            {cartCount > 0 && (
              <span className="shrink-0 min-w-[2rem] h-8 px-2 rounded-full bg-kado-red text-white text-xs font-black flex items-center justify-center">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="max-w-3xl mx-auto px-4 pb-3 overflow-x-auto scrollbar-none -mx-0">
          <div className="flex gap-2 w-max min-w-full sm:min-w-0 sm:flex-wrap sm:w-auto pb-0.5">
            {sortedCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCat(c.id)}
                className={`shrink-0 min-h-[40px] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors touch-manipulation ${
                  activeCat === c.id
                    ? 'bg-kado-dark text-kado-cream border-kado-dark'
                    : 'bg-white text-kado-dark/60 border-kado-dark/10 hover:border-kado-red/30'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu grid */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-4 sm:py-6 pb-36 sm:pb-40">
        {list.length === 0 ? (
          <p className="text-center text-sm text-kado-dark/50 py-16">
            No items in this category right now. Check another tab or ask staff.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {list.map((p, i) => {
              const image = getProductImageUrl(p);
              const tag = p.tags?.[0];
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.2) }}
                  onClick={() => setSelectedProduct(p)}
                  className="text-left bg-white border border-kado-dark/8 rounded-2xl overflow-hidden hover:border-kado-red/25 hover:shadow-md transition-all touch-manipulation flex flex-col h-full"
                >
                  <div className="relative aspect-[4/3] bg-kado-dark/5 shrink-0">
                    <img
                      src={image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    {tag && (
                      <span className="absolute top-1.5 left-1.5 text-[7px] font-black uppercase tracking-widest bg-kado-dark/85 text-white px-1.5 py-0.5 rounded-full">
                        {tag}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5 sm:p-3 flex flex-col flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <h3 className="font-display font-bold text-xs sm:text-sm text-kado-dark line-clamp-2 leading-snug">
                        {p.name}
                      </h3>
                      <span className="font-black text-xs sm:text-sm text-kado-red shrink-0">
                        {formatPhp(p.basePrice)}
                      </span>
                    </div>
                    <p className="text-[10px] text-kado-dark/45 line-clamp-2 leading-snug mt-auto">
                      {getProductDescription(p)}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </main>

      {/* Sticky cart */}
      <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
        <div className="pointer-events-auto max-w-3xl mx-auto px-3 sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="rounded-2xl border border-kado-dark/10 bg-white shadow-[0_-8px_32px_rgba(25,25,25,0.12)] overflow-hidden">
            <button
              type="button"
              onClick={() => cart.length > 0 && setCartExpanded((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left touch-manipulation"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShoppingBag className="w-5 h-5 text-kado-red shrink-0" />
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm text-kado-dark">
                    {cartCount === 0 ? 'Your table cart' : `${cartCount} item${cartCount !== 1 ? 's' : ''}`}
                  </p>
                  <p className="text-[10px] text-kado-dark/45 truncate">
                    {cartCount === 0 ? 'Tap a drink to add' : formatPhp(cartTotals.total)}
                  </p>
                </div>
              </div>
              {cart.length > 0 &&
                (cartExpanded ? (
                  <ChevronDown className="w-5 h-5 text-kado-dark/40 shrink-0" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-kado-dark/40 shrink-0" />
                ))}
            </button>

            {cartExpanded && cart.length > 0 && (
              <div className="border-t border-kado-dark/8 px-4 py-3 max-h-[40dvh] overflow-y-auto">
                <ul className="space-y-2">
                  {cart.map((line) => {
                    const p = products.find((x) => x.id === line.productId);
                    if (!p) return null;
                    const { unit } = resolveUnit(p, line.milkId);
                    return (
                      <li
                        key={line.key}
                        className="flex gap-2 items-center rounded-xl bg-[#FAF7F2] border border-kado-dark/5 p-2"
                      >
                        <img
                          src={getProductImageUrl(p)}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-kado-dark truncate">{p.name}</p>
                          <p className="text-[10px] text-kado-dark/45 truncate">
                            {[line.milkLabel, line.temperature].filter(Boolean).join(' · ')}
                          </p>
                          <p className="text-xs font-bold text-kado-red mt-0.5">{formatPhp(unit * line.qty)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setCart((c) => c.filter((x) => x.key !== line.key))}
                            className="p-1 text-kado-dark/35 hover:text-red-500"
                            aria-label="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex items-center gap-1 bg-white rounded-full border border-kado-dark/10 px-1">
                            <button
                              type="button"
                              onClick={() => updateLineQty(line.key, line.qty - 1)}
                              className="w-7 h-7 flex items-center justify-center"
                              aria-label="Less"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] font-bold w-4 text-center">{line.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateLineQty(line.key, line.qty + 1)}
                              className="w-7 h-7 flex items-center justify-center"
                              aria-label="More"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 pt-3 border-t border-kado-dark/8 space-y-1 text-[11px] text-kado-dark/55">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPhp(cartTotals.subtotal)}</span>
                  </div>
                  {cartTotals.modifiers > 0 && (
                    <div className="flex justify-between">
                      <span>Modifiers</span>
                      <span>+{formatPhp(cartTotals.modifiers)}</span>
                    </div>
                  )}
                  {cartTotals.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax ({taxRate}%)</span>
                      <span>{formatPhp(cartTotals.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-kado-dark text-sm pt-1">
                    <span>Total</span>
                    <span className="text-kado-red">{formatPhp(cartTotals.total)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-kado-dark/8 p-3 sm:p-4">
              {orderError && (
                <p className="mb-2 text-xs text-red-600 font-medium">{orderError}</p>
              )}
              <button
                type="button"
                onClick={placeOrder}
                disabled={cart.length === 0 || submitting || cartStale}
                className="w-full min-h-[52px] rounded-2xl bg-kado-red text-kado-cream text-xs font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-kado-dark transition-colors touch-manipulation"
              >
                {submitting ? 'Sending…' : 'Place dine-in order'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <QrProductSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={addLine}
      />
    </div>
  );
}
