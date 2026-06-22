import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { OrderItem, OrderItemVariantSnapshot, PaymentMethod, Product } from '../../types/domain';
import { useBranchStore } from '../../store/branchStore';
import { useMenuStore } from '../../store/menuStore';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { formatPhp, computeOrderTotals } from '../../lib/money';
import { useSettingsStore } from '../../store/settingsStore';
import { newId } from '../../lib/id';
import { isProductInStock } from '../../lib/productStock';
import {
  defaultFieldsForPosOrder,
  formatPosPaymentLabel,
  posPaymentToMethod,
  type PosPaymentChoice,
} from '../../lib/orderStatus';
import { CheckCircle2, Minus, Pencil, Plus, Search, ShoppingBag, Trash2 } from 'lucide-react';
import PosVariantModal from './PosVariantModal';
import { resolvePosUnitPrice, type PosLineConfig } from '../../lib/posPricing';

type CartLine = {
  key: string;
  productId: string;
  qty: number;
  milkId?: string;
  sizeId?: string;
  temperature?: 'hot' | 'iced';
  customizations: OrderItemVariantSnapshot[];
};

type PosWorkspaceProps = {
  variant: 'admin' | 'barista';
  lockedBranchId?: string | null;
};

type PlacedOrder = {
  shortCode: string;
  id: string;
  total: number;
  paymentMethod: PaymentMethod;
};

export default function PosWorkspace({ variant, lockedBranchId = null }: PosWorkspaceProps) {
  const user = useAuthStore((s) => s.user);
  const branches = useBranchStore((s) => s.branches);
  const adminPosBranchId = useBranchStore((s) => s.adminPosBranchId);
  const setAdminPosBranchId = useBranchStore((s) => s.setAdminPosBranchId);

  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const productsByCategory = useMenuStore((s) => s.productsByCategory);
  const createOrder = useOrderStore((s) => s.createOrder);
  const taxRate = useSettingsStore((s) => s.settings.taxRate);

  const effectiveBranchId = lockedBranchId ?? adminPosBranchId ?? branches[0]?.id ?? null;

  const [activeCat, setActiveCat] = useState(() => categories[0]?.id ?? '');
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [configuring, setConfiguring] = useState<Product | null>(null);
  const [editingLineKey, setEditingLineKey] = useState<string | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<PosPaymentChoice>('cash');
  const [posError, setPosError] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [lastPlaced, setLastPlaced] = useState<PlacedOrder | null>(null);

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );

  const list = useMemo(() => {
    const categoryId = activeCat || sortedCategories[0]?.id || '';
    const q = productSearch.trim().toLowerCase();
    return productsByCategory(categoryId)
      .filter((p) => isProductInStock(p))
      .filter((p) => !q || p.name.toLowerCase().includes(q));
  }, [activeCat, productSearch, productsByCategory, sortedCategories]);

  const branch = branches.find((b) => b.id === effectiveBranchId);

  const addToCart = (product: Product, config: PosLineConfig) => {
    setLastPlaced(null);
    setCart((c) => [
      ...c,
      {
        key: newId(),
        productId: product.id,
        qty: config.qty,
        milkId: config.milkId,
        sizeId: config.sizeId,
        temperature: config.temperature,
        customizations: config.customizations,
      },
    ]);
  };

  const initialConfigForEditing = useMemo(() => {
    if (!configuring || !editingLineKey) return undefined;
    const line = cart.find((item) => item.key === editingLineKey);
    if (!line || line.productId !== configuring.id) return undefined;
    return {
      qty: line.qty,
      milkId: line.milkId,
      sizeId: line.sizeId,
      temperature: line.temperature,
      customizations: line.customizations,
    } satisfies PosLineConfig;
  }, [cart, configuring, editingLineKey]);

  const handleConfirmVariant = (config: PosLineConfig) => {
    if (!configuring) return;
    setLastPlaced(null);
    if (editingLineKey) {
      setCart((current) =>
        current.map((item) =>
          item.key === editingLineKey
            ? {
                ...item,
                qty: config.qty,
                milkId: config.milkId,
                sizeId: config.sizeId,
                temperature: config.temperature,
                customizations: config.customizations,
              }
            : item,
        ),
      );
    } else {
      addToCart(configuring, config);
    }
    setConfiguring(null);
    setEditingLineKey(null);
  };

  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let modifiers = 0;
    const lines: OrderItem[] = [];
    for (const line of cart) {
      const p = products.find((x) => x.id === line.productId);
      if (!p) continue;
      const { unit, milkLabel, sizeLabel } = resolvePosUnitPrice(p, line);
      const base = p.basePrice;
      const mod = unit - base;
      subtotal += base * line.qty;
      modifiers += mod * line.qty;
      lines.push({
        id: newId(),
        productId: p.id,
        productNameSnapshot: p.name,
        milkId: line.milkId,
        milkLabelSnapshot: milkLabel,
        sizeId: line.sizeId,
        sizeLabelSnapshot: sizeLabel,
        temperature: line.temperature,
        merchVariants: line.customizations.length ? line.customizations : undefined,
        unitPrice: unit,
        qty: line.qty,
        lineTotal: unit * line.qty,
      });
    }
    const { tax, total } = computeOrderTotals(subtotal, modifiers, taxRate);
    return { lines, subtotal, modifiers, tax, total };
  }, [cart, products, taxRate]);

  const adjustQty = (lineKey: string, delta: number) => {
    setLastPlaced(null);
    setCart((current) =>
      current
        .map((item) =>
          item.key === lineKey ? { ...item, qty: Math.max(1, item.qty + delta) } : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

  const clearCart = () => {
    setCart([]);
    setLastPlaced(null);
    setPosError(null);
  };

  const placeOrder = async () => {
    if (!branch || !user || cartTotals.lines.length === 0 || placingOrder) return;
    setPosError(null);
    setPlacingOrder(true);
    const paymentMethod = posPaymentToMethod(paymentChoice);
    const posDefaults = defaultFieldsForPosOrder();
    try {
      const placed = await createOrder({
        channel: 'pos',
        branchId: branch.id,
        staffId: user.id,
        paymentMethod,
        status: posDefaults.status,
        paymentStatus: posDefaults.paymentStatus,
        items: cartTotals.lines,
        subtotal: cartTotals.subtotal,
        modifiersTotal: cartTotals.modifiers,
        tax: cartTotals.tax,
        total: cartTotals.total,
      });
      setCart([]);
      setLastPlaced({
        shortCode: placed.shortCode,
        id: placed.id,
        total: placed.total,
        paymentMethod: placed.paymentMethod ?? paymentMethod,
      });
    } catch (err) {
      setPosError(err instanceof Error ? err.message : 'Could not place POS order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!branch) {
    if (variant === 'admin') {
      return (
        <div className="max-w-xl dash-page">
          <p className="dash-muted text-xs font-bold uppercase tracking-[0.2em] mb-1">Admin · Operations</p>
          <h1 className="font-display text-3xl font-bold dash-heading mb-4">POS</h1>
          <p className="dash-muted mb-6">Add a branch first — POS needs at least one location.</p>
          <Link to="/admin/branches" className="text-kado-red font-bold uppercase tracking-wider text-sm">
            Go to Branches
          </Link>
        </div>
      );
    }
    return <p className="p-8 dash-muted">No branch configured.</p>;
  }

  const ordersLink = variant === 'admin' ? '/admin/orders' : '/barista/queue';
  const auditLink = '/admin/audit';

  return (
    <>
      <div className={variant === 'admin' ? 'max-w-6xl dash-page' : 'dash-page p-3 sm:p-4 md:p-8'}>
        <div className="flex flex-col gap-4 mb-6 md:mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            {variant === 'admin' && (
              <p className="dash-muted text-xs font-bold uppercase tracking-[0.2em] mb-1">Admin · Operations</p>
            )}
            <h1 className="font-display text-2xl font-bold dash-heading sm:text-3xl md:text-4xl">POS</h1>
            <p className="dash-muted text-sm mt-1">
              {lockedBranchId
                ? `Counter sales at ${branch.name}. Payment collected before the ticket enters the bar queue.`
                : 'Walk-in counter sales — pick branch, add items, select payment, then place order.'}
            </p>
            {variant === 'admin' && (
              <p className="text-[11px] dash-muted mt-2">
                Orders appear in{' '}
                <Link to={ordersLink} className="text-kado-red font-semibold hover:underline">
                  Orders
                </Link>{' '}
                and are logged in{' '}
                <Link to={auditLink} className="text-kado-red font-semibold hover:underline">
                  Audit log
                </Link>
                .
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            {!lockedBranchId && (
              <>
                <label className="text-[10px] font-bold uppercase tracking-widest text-kado-red">Sales branch</label>
                <select
                  value={adminPosBranchId ?? ''}
                  onChange={(e) => setAdminPosBranchId(e.target.value || null)}
                  className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm font-semibold sm:min-w-[220px] sm:max-w-xs"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.status === 'coming_soon' ? '(soon)' : ''}
                    </option>
                  ))}
                </select>
                {variant === 'admin' && (
                  <Link to="/admin/branches" className="text-xs font-semibold text-kado-red hover:underline">
                    Manage branches
                  </Link>
                )}
              </>
            )}
            {lockedBranchId && (
              <p className="text-xs font-bold uppercase tracking-widest text-kado-red">{branch.name}</p>
            )}
          </div>
        </div>

        {lastPlaced && (
          <div
            className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            role="status"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-display font-bold text-emerald-900">
                  Order {lastPlaced.shortCode} placed
                </p>
                <p className="text-sm text-emerald-800/80 mt-0.5">
                  {formatPhp(lastPlaced.total)} · {formatPosPaymentLabel(paymentChoice)} · sent to bar queue
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={ordersLink}
                className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-900 hover:bg-emerald-100"
              >
                View orders
              </Link>
              {variant === 'admin' && (
                <Link
                  to={auditLink}
                  className="rounded-xl bg-emerald-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-emerald-800"
                >
                  Audit log
                </Link>
              )}
              <button
                type="button"
                onClick={() => setLastPlaced(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-800 hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dash-muted" />
              <input
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search menu…"
                className="w-full rounded-xl dash-input border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {sortedCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCat(c.id)}
                  className={`px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                    (activeCat || sortedCategories[0]?.id) === c.id
                      ? 'bg-kado-red text-kado-cream border-kado-red'
                      : 'dash-card dash-muted dash-border hover:border-kado-red/40'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {list.length === 0 ? (
              <p className="text-sm dash-muted rounded-2xl dash-card border dash-border p-8 text-center">
                {productSearch.trim() ? 'No in-stock items match your search.' : 'No in-stock items in this category.'}
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {list.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setConfiguring(p);
                      setEditingLineKey(null);
                    }}
                    className="text-left rounded-2xl dash-card border p-4 hover:border-kado-red/40 hover:shadow-lg transition-all active:scale-[0.99]"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-display font-bold text-kado-dark dash-heading">{p.name}</span>
                      <span className="text-kado-red font-bold shrink-0">{formatPhp(p.basePrice)}</span>
                    </div>
                    {p.tags?.includes('iced-only') && (
                      <span className="mt-2 inline-block text-[9px] font-bold uppercase tracking-widest text-kado-red bg-kado-red/10 px-2 py-0.5 rounded">
                        Iced only
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl dash-card border p-5 h-fit lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-display text-lg font-bold dash-heading flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-kado-red" />
                Cart
              </h2>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <p className="text-sm dash-muted">Tap a product to add lines.</p>
            ) : (
              <ul className="space-y-3 mb-4 max-h-[280px] overflow-y-auto">
                {cart.map((line) => {
                  const p = products.find((x) => x.id === line.productId);
                  if (!p) return null;
                  const { unit, milkLabel, sizeLabel } = resolvePosUnitPrice(p, line);
                  return (
                    <li key={line.key} className="rounded-xl border dash-border p-3 text-sm">
                      <div className="font-semibold text-kado-dark dash-heading">{p.name}</div>
                      <div className="text-xs dash-muted mt-1 space-y-0.5">
                        {line.temperature && <p>Temp: {line.temperature}</p>}
                        {sizeLabel && <p>Size: {sizeLabel}</p>}
                        {milkLabel && <p>Milk: {milkLabel}</p>}
                        {line.customizations.map((choice, index) => (
                          <p key={`${line.key}_custom_${index}`}>
                            {choice.groupName}: {choice.optionLabel}
                          </p>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 items-center">
                        <div className="inline-flex items-center rounded-lg border dash-border overflow-hidden">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => adjustQty(line.key, -1)}
                            className="px-2 py-1 hover:bg-kado-cream"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-xs font-bold min-w-[2rem] text-center">{line.qty}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => adjustQty(line.key, 1)}
                            className="px-2 py-1 hover:bg-kado-cream"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setConfiguring(p);
                            setEditingLineKey(line.key);
                          }}
                          className="text-xs text-kado-dark font-bold inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setCart((c) => c.filter((x) => x.key !== line.key))}
                          className="text-xs text-kado-red font-bold ml-auto"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2 text-xs font-bold text-kado-dark dash-heading">
                        {formatPhp(unit * line.qty)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="border-t dash-border pt-4 space-y-1 text-sm">
              <div className="flex justify-between dash-muted">
                <span>Subtotal</span>
                <span>{formatPhp(cartTotals.subtotal)}</span>
              </div>
              {cartTotals.modifiers > 0 && (
                <div className="flex justify-between dash-muted">
                  <span>Modifiers</span>
                  <span>{formatPhp(cartTotals.modifiers)}</span>
                </div>
              )}
              {cartTotals.tax > 0 && (
                <div className="flex justify-between dash-muted">
                  <span>Tax ({taxRate}%)</span>
                  <span>{formatPhp(cartTotals.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-display font-bold text-lg text-kado-dark dash-heading pt-2">
                <span>Total</span>
                <span className="text-kado-red">{formatPhp(cartTotals.total)}</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-dark/55 mb-2">Payment</p>
              <div className="grid grid-cols-2 gap-2">
                {(['cash', 'gcash'] as const).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => setPaymentChoice(choice)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                      paymentChoice === choice
                        ? 'bg-kado-red text-kado-cream border-kado-red'
                        : 'dash-card dash-border dash-muted hover:border-kado-red/40'
                    }`}
                  >
                    {formatPosPaymentLabel(choice)}
                  </button>
                ))}
              </div>
            </div>

            {posError && (
              <p className="mt-3 text-xs font-semibold text-red-600" role="alert">
                {posError}
              </p>
            )}

            <button
              type="button"
              disabled={!cart.length || placingOrder}
              onClick={() => void placeOrder()}
              className="mt-4 w-full rounded-xl bg-kado-red text-kado-cream py-3.5 text-sm font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-kado-red-hover transition-colors"
            >
              {placingOrder ? 'Placing…' : `Place order · ${formatPosPaymentLabel(paymentChoice)}`}
            </button>
          </div>
        </div>
      </div>

      <PosVariantModal
        product={configuring}
        open={!!configuring}
        initial={initialConfigForEditing}
        onClose={() => {
          setConfiguring(null);
          setEditingLineKey(null);
        }}
        onConfirm={handleConfirmVariant}
      />
    </>
  );
}
