import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

export default function AdminPOS() {
  const branches = useBranchStore((s) => s.branches);
  const adminPosBranchId = useBranchStore((s) => s.adminPosBranchId);
  const setAdminPosBranchId = useBranchStore((s) => s.setAdminPosBranchId);

  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const productsByCategory = useMenuStore((s) => s.productsByCategory);

  const user = useAuthStore((s) => s.user);
  const createOrder = useOrderStore((s) => s.createOrder);
  const taxRate = useSettingsStore((s) => s.settings.taxRate);

  const [activeCat, setActiveCat] = useState(() => categories[0]?.id ?? '');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [configuring, setConfiguring] = useState<Product | null>(null);
  const [editingLineKey, setEditingLineKey] = useState<string | null>(null);

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );

  const list = productsByCategory(activeCat || sortedCategories[0]?.id || '');

  const branch = branches.find((b) => b.id === adminPosBranchId) ?? branches[0];

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
    if (!configuring) return undefined;
    if (!editingLineKey) return undefined;
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

  const placeOrder = () => {
    if (!branch || !user || cartTotals.lines.length === 0) return;
    void createOrder({
      channel: 'pos',
      branchId: branch.id,
      staffId: user.id,
      status: 'pending',
      items: cartTotals.lines,
      subtotal: cartTotals.subtotal,
      modifiersTotal: cartTotals.modifiers,
      tax: cartTotals.tax,
      total: cartTotals.total,
    }).then(() => setCart([]));
  };

  if (!branch) {
    return (
      <div className="max-w-xl dash-page">
        <h1 className="font-display text-3xl font-bold dash-heading mb-4">POS</h1>
        <p className="dash-muted mb-6">Add a branch first — POS needs at least one location.</p>
        <Link to="/admin/branches" className="text-kado-red font-bold uppercase tracking-wider text-sm">
          Go to Branches
        </Link>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-6xl dash-page">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading">POS</h1>
          <p className="dash-muted mt-1">
            Select any branch you created — orders are tagged with that branch for future sync.
          </p>
        </div>
        <div className="flex flex-col gap-1">
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
          <Link to="/admin/branches" className="text-xs font-semibold text-kado-red hover:underline">
            Manage branches
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {sortedCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCat(c.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
                  activeCat === c.id
                    ? 'bg-kado-dark text-kado-cream border-kado-dark'
                    : 'dash-card dash-muted dash-border hover:border-kado-red/40'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {list.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setConfiguring(p);
                  setEditingLineKey(null);
                }}
                className="text-left rounded-2xl dash-card border p-4 hover:border-kado-red/40 hover:shadow-lg transition-all"
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
        </div>

        <div className="rounded-2xl dash-card border p-5 h-fit lg:sticky lg:top-6">
          <h2 className="font-display text-lg font-bold dash-heading mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-kado-red" />
            Cart
          </h2>
          {cart.length === 0 ? (
            <p className="text-sm dash-muted">Tap products to add lines.</p>
          ) : (
            <ul className="space-y-3 mb-4 max-h-[360px] overflow-y-auto">
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
                        <p key={`${line.key}_custom_${index}`}>{choice.groupName}: {choice.optionLabel}</p>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 items-center">
                      <span className="text-xs dash-muted">Qty {line.qty}</span>
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
                    <div className="mt-2 text-xs font-bold text-kado-dark dash-heading">{formatPhp(unit * line.qty)}</div>
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
            <div className="flex justify-between dash-muted">
              <span>Modifiers</span>
              <span>{formatPhp(cartTotals.modifiers)}</span>
            </div>
            {cartTotals.tax > 0 && (
              <div className="flex justify-between dash-muted">
                <span>Tax ({taxRate}%)</span>
                <span>{formatPhp(cartTotals.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-display font-bold text-lg text-kado-dark dash-heading pt-2">
              <span>Total</span>
              <span>{formatPhp(cartTotals.total)}</span>
            </div>
          </div>
          <button
            type="button"
            disabled={!cart.length}
            onClick={placeOrder}
            className="mt-4 w-full rounded-xl bg-kado-red text-kado-cream py-3.5 text-sm font-bold uppercase tracking-wider disabled:opacity-40 hover:bg-kado-red-hover transition-colors"
          >
            Place POS order
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
