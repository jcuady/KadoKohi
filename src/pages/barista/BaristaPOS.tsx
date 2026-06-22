import { useMemo, useState } from 'react';
import type { OrderItem, OrderItemVariantSnapshot, Product } from '../../types/domain';
import { useBranchStore } from '../../store/branchStore';
import { useMenuStore } from '../../store/menuStore';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { formatPhp, computeOrderTotals } from '../../lib/money';
import { useSettingsStore } from '../../store/settingsStore';
import { newId } from '../../lib/id';
import { Pencil, ShoppingBag } from 'lucide-react';
import PosVariantModal from '../../components/pos/PosVariantModal';
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

export default function BaristaPOS() {
  const user = useAuthStore((s) => s.user);
  const branches = useBranchStore((s) => s.branches);
  const adminPosBranchId = useBranchStore((s) => s.adminPosBranchId);
  const setAdminPosBranchId = useBranchStore((s) => s.setAdminPosBranchId);

  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const productsByCategory = useMenuStore((s) => s.productsByCategory);
  const createOrder = useOrderStore((s) => s.createOrder);
  const taxRate = useSettingsStore((s) => s.settings.taxRate);

  const lockedBranchId = user?.role === 'barista' ? user.branchId : null;
  const effectiveBranchId = lockedBranchId ?? adminPosBranchId ?? branches[0]?.id ?? null;

  const [activeCat, setActiveCat] = useState(() => categories[0]?.id ?? '');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [configuring, setConfiguring] = useState<Product | null>(null);
  const [editingLineKey, setEditingLineKey] = useState<string | null>(null);
  const [posError, setPosError] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );
  const list = productsByCategory(activeCat || sortedCategories[0]?.id || '');
  const branch = branches.find((b) => b.id === effectiveBranchId);

  const addToCart = (product: Product, config: PosLineConfig) => {
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

  const placeOrder = async () => {
    if (!branch || !user || cartTotals.lines.length === 0 || placingOrder) return;
    setPosError(null);
    setPlacingOrder(true);
    try {
      await createOrder({
        channel: 'pos',
        branchId: branch.id,
        staffId: user.id,
        status: 'pending',
        items: cartTotals.lines,
        subtotal: cartTotals.subtotal,
        modifiersTotal: cartTotals.modifiers,
        tax: cartTotals.tax,
        total: cartTotals.total,
      });
      setCart([]);
    } catch (err) {
      setPosError(err instanceof Error ? err.message : 'Could not place POS order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!branch) {
    return <p className="p-8 dash-muted">No branch configured.</p>;
  }

  return (
    <>
    <div className="dash-page p-3 sm:p-4 md:p-8">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:mb-6 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold dash-heading sm:text-3xl md:text-4xl">POS</h1>
          <p className="dash-muted text-sm mt-1">
            {lockedBranchId ? 'Locked to your branch.' : 'Admin: pick branch (synced with Admin POS selector).'}
          </p>
        </div>
        {!lockedBranchId && (
          <select
            value={adminPosBranchId ?? ''}
            onChange={(e) => setAdminPosBranchId(e.target.value || null)}
            className="w-full max-w-full rounded-xl border dash-input px-4 py-2.5 text-sm font-semibold sm:max-w-xs"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="rounded-[2rem] border dash-card p-4 md:p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-2">
              {sortedCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCat(c.id)}
                  className={`px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    activeCat === c.id ? 'bg-kado-red text-kado-cream border-kado-red' : 'dash-card-alt dash-border'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {list.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setConfiguring(p);
                    setEditingLineKey(null);
                  }}
                  className="text-left rounded-xl border dash-card-alt dash-border p-3 hover:border-kado-red/40"
                >
                  <div className="flex justify-between gap-2 font-display font-bold text-sm">
                    <span>{p.name}</span>
                    <span className="text-kado-red">{formatPhp(p.basePrice)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-kado-red" />
              Cart
            </h2>
            {cart.length === 0 ? (
              <p className="text-sm dash-muted">Add items.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto mb-3">
                {cart.map((line) => {
                  const p = products.find((x) => x.id === line.productId);
                  if (!p) return null;
                  const { unit, milkLabel, sizeLabel } = resolvePosUnitPrice(p, line);
                  return (
                    <li key={line.key} className="text-xs rounded-lg border dash-border p-2 space-y-1">
                      <div className="font-bold">{p.name}</div>
                      {line.temperature && <div className="dash-muted">Temp: {line.temperature}</div>}
                      {sizeLabel && <div className="dash-muted">Size: {sizeLabel}</div>}
                      {milkLabel && <div className="dash-muted">Milk: {milkLabel}</div>}
                      {line.customizations.map((choice, index) => (
                        <div key={`${line.key}_custom_${index}`} className="dash-muted">
                          {choice.groupName}: {choice.optionLabel}
                        </div>
                      ))}
                      <div className="dash-muted">Qty: {line.qty}</div>
                      <button
                        type="button"
                        className="text-kado-dark font-bold inline-flex items-center gap-1 mr-2"
                        onClick={() => {
                          setConfiguring(p);
                          setEditingLineKey(line.key);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button type="button" className="text-kado-red font-bold" onClick={() => setCart((c) => c.filter((x) => x.key !== line.key))}>
                        Remove
                      </button>
                      <div className="font-bold">{formatPhp(unit * line.qty)}</div>
                    </li>
                  );
                })}
              </ul>
            )}
            {cart.length > 0 && (
              <div className="space-y-1 text-xs dash-muted mb-3 border-t dash-border pt-2">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatPhp(cartTotals.subtotal)}</span></div>
                {cartTotals.modifiers > 0 && <div className="flex justify-between"><span>Modifiers</span><span>{formatPhp(cartTotals.modifiers)}</span></div>}
                {cartTotals.tax > 0 && <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>{formatPhp(cartTotals.tax)}</span></div>}
                <div className="flex justify-between font-display font-bold dash-heading pt-1"><span>Total</span><span className="text-kado-red">{formatPhp(cartTotals.total)}</span></div>
              </div>
            )}
            {posError && (
              <p className="mb-2 text-xs font-semibold text-red-600" role="alert">{posError}</p>
            )}
            <button
              type="button"
              disabled={!cart.length || placingOrder}
              onClick={() => void placeOrder()}
              className="w-full rounded-xl bg-kado-red text-kado-cream py-3 text-xs font-bold uppercase tracking-wider disabled:opacity-40"
            >
              {placingOrder ? 'Placing…' : 'Place order'}
            </button>
          </div>
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
