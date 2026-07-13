import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, ShoppingBag, CheckCircle2, LogIn, Check } from 'lucide-react';
import type { Product, MerchProduct } from '../types/domain';
import { useCartStore, type CartLineVariant } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useOnlineOrderHours } from '../hooks/useOnlineOrderHours';
import OnlineOrderHoursNotice from './OnlineOrderHoursNotice';
import { formatPhp } from '../lib/money';
import { isProductInStock } from '../lib/productStock';
import MenuProductImage from './catalog/MenuProductImage';
import { isPastriesCategoryId, findPastriesCategory } from '../lib/pastriesCategory';
import { useMenuStore } from '../store/menuStore';
import { productFallbackDescription, resolveOrderTemperature } from '../lib/menuProductModifiers';
import ProductVariantSections from './menu/ProductVariantSections';
import { defaultPosLineConfig, resolvePosUnitPrice, type PosLineConfig } from '../lib/posPricing';

import {
  DEFAULT_MENU_PRODUCT_IMAGE,
  getMenuProductImageUrl,
} from '../lib/menuCatalog';

function isMerchProduct(p: Product | MerchProduct): p is MerchProduct {
  return !('temperature' in p);
}

function DetailChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200 ${
        active
          ? 'bg-kado-red text-white border-kado-red shadow-md shadow-kado-red/20'
          : 'bg-white border-kado-dark/10 text-kado-dark/65 hover:border-kado-red/50 hover:text-kado-red'
      }`}
    >
      {active ? <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" aria-hidden /> : null}
      {children}
    </button>
  );
}

interface Props {
  product: Product | MerchProduct | null;
  categoryName?: string;
  onClose: () => void;
  /** When true, only signed-in customers can add to cart (guests see sign-in CTA). */
  requireAuthToOrder?: boolean;
}

export default function ProductDetailDrawer({
  product,
  categoryName,
  onClose,
  requireAuthToOrder = false,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const categories = useMenuStore((s) => s.categories);
  const addItem = useCartStore((s) => s.addItem);
  const orderHours = useOnlineOrderHours();
  const isCustomer = user?.role === 'customer';
  const canOrderAuth = !requireAuthToOrder || isCustomer;
  const coffeeInStock =
    product && !isMerchProduct(product) ? isProductInStock(product as Product) : true;
  const canPlaceOrder = canOrderAuth && orderHours.isOpen && coffeeInStock;

  const [lineConfig, setLineConfig] = useState<PosLineConfig | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const isMerch = product ? isMerchProduct(product) : false;

  useEffect(() => {
    if (!product) return;
    setQty(1);
    setAdded(false);
    if (isMerchProduct(product)) {
      const defaults: Record<string, string> = {};
      for (const g of product.variants) {
        if (g.options.length > 0) defaults[g.id] = g.options[0].id;
      }
      setSelectedVariants(defaults);
      setLineConfig(null);
    } else {
      setLineConfig(defaultPosLineConfig(product));
      setSelectedVariants({});
    }
  }, [product?.id, categories]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const variantsDelta = useMemo(() => {
    if (!product || !isMerchProduct(product)) return 0;
    let d = 0;
    for (const g of product.variants) {
      const sel = selectedVariants[g.id];
      const opt = g.options.find((o) => o.id === sel);
      if (opt) d += opt.priceDelta;
    }
    return d;
  }, [product, selectedVariants]);

  const coffeeProduct = product && !isMerch ? (product as Product) : null;
  const isPastryProduct =
    coffeeProduct && isPastriesCategoryId(categories, coffeeProduct.categoryId);

  const resolvedCoffee = useMemo(() => {
    if (!coffeeProduct || !lineConfig) return null;
    return resolvePosUnitPrice(coffeeProduct, lineConfig);
  }, [coffeeProduct, lineConfig]);

  const unitPrice =
    coffeeProduct && resolvedCoffee
      ? resolvedCoffee.unit
      : (product?.basePrice ?? 0) + variantsDelta;
  const lineTotal = unitPrice * qty;

  const desc = product
    ? isMerch
      ? product.description ?? 'Premium Kado Kohi merchandise.'
      : productFallbackDescription(product as Product)
    : '';

  const handleAdd = () => {
    if (!product || !canPlaceOrder) return;

    if (isMerchProduct(product)) {
      const variants: CartLineVariant[] = [];
      for (const g of product.variants) {
        const sel = selectedVariants[g.id];
        const opt = g.options.find((o) => o.id === sel);
        if (opt) {
          variants.push({
            groupName: g.name,
            optionId: opt.id,
            optionLabel: opt.label,
            priceDelta: opt.priceDelta,
          });
        }
      }
      addItem(
        {
          itemType: 'merch',
          productId: product.id,
          productNameSnapshot: product.name,
          qty,
          selectedVariants: variants,
          unitPrice,
          lineTotal,
          image: product.image,
        },
        { openCart: orderHours.isOpen },
      );
    } else if (coffeeProduct && lineConfig && resolvedCoffee) {
      const selectedVariantsCart: CartLineVariant[] = lineConfig.customizations.map((c, index) => ({
        groupName: c.groupName,
        optionId: `${c.groupName}-${index}`,
        optionLabel: c.optionLabel,
        priceDelta: c.priceDelta,
      }));
      addItem(
        {
          itemType: 'coffee',
          productId: product.id,
          productNameSnapshot: product.name,
          qty,
          milkId: lineConfig.milkId,
          milkLabelSnapshot: resolvedCoffee.milkLabel,
          sizeId: lineConfig.sizeId,
          sizeLabelSnapshot: resolvedCoffee.sizeLabel,
          temperature: resolveOrderTemperature(coffeeProduct, lineConfig.temperature),
          selectedVariants: selectedVariantsCart.length ? selectedVariantsCart : undefined,
          unitPrice: resolvedCoffee.unit,
          lineTotal: resolvedCoffee.unit * qty,
        },
        { openCart: orderHours.isOpen },
      );
    }
    setAdded(true);
    setTimeout(onClose, 700);
  };

  const merchProduct = product && isMerch ? (product as MerchProduct) : null;
  const pastriesCategoryId = findPastriesCategory(categories)?.id;
  const productImageSrc =
    merchProduct?.image?.trim() ||
    (coffeeProduct
      ? getMenuProductImageUrl(coffeeProduct, { pastriesCategoryId })
      : DEFAULT_MENU_PRODUCT_IMAGE);

  const patchLineConfig = (patch: Partial<PosLineConfig>) => {
    setLineConfig((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[150] bg-kado-dark/55 backdrop-blur-[3px]"
            onClick={onClose}
          />

          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: 48, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[151] pointer-events-none px-[max(0px,env(safe-area-inset-left))] pr-[max(0px,env(safe-area-inset-right))]"
          >
            <div className="pointer-events-auto w-full sm:max-w-lg bg-white sm:rounded-[2rem] rounded-t-[2.5rem] shadow-[0_30px_60px_rgba(158,24,29,0.15)] overflow-hidden max-h-[min(93dvh,640px)] sm:max-h-[88vh] [@media(orientation:landscape)_and_(max-height:30rem)]:max-h-[96dvh] flex flex-col border sm:border-kado-red/10">
              <div className="relative shrink-0">
                <div className="aspect-[16/9] [@media(orientation:landscape)_and_(max-height:30rem)]:aspect-[3/1] overflow-hidden bg-kado-dark/5">
                  {coffeeProduct ? (
                    <MenuProductImage
                      product={coffeeProduct}
                      alt={product.name}
                      loading="eager"
                      pastriesCategoryId={isPastryProduct ? pastriesCategoryId : undefined}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={productImageSrc}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="eager"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>

                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-kado-red transition-colors shadow-sm"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                {product.tags?.length ? (
                  <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-black uppercase tracking-widest bg-white text-kado-dark px-3 py-1 rounded-full shadow-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
                {categoryName && (
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-kado-red/80 mb-2">
                    {categoryName}
                  </p>
                )}

                <div className="flex items-start justify-between gap-3 mb-2 mt-1">
                  <h2 className="font-display font-black text-3xl text-kado-dark leading-tight tracking-tight">
                    {product.name}
                  </h2>
                  <span className="font-display font-black text-2xl text-kado-red shrink-0 pt-1">
                    {formatPhp(unitPrice)}
                  </span>
                </div>

                <p className="text-sm text-kado-dark/70 font-medium leading-relaxed mb-6">{desc}</p>

                {coffeeProduct && lineConfig ? (
                  <ProductVariantSections
                    product={coffeeProduct}
                    config={lineConfig}
                    onChange={patchLineConfig}
                    showTemperature={!isPastryProduct}
                    Chip={DetailChip as ComponentType<{ active: boolean; onClick: () => void; children: ReactNode }>}
                  />
                ) : null}

                {merchProduct?.variants.map((group) => (
                  <div key={group.id} className="mb-6">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-kado-dark/50 mb-3">
                      {group.name}
                      {group.required && ' *'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedVariants((prev) => ({ ...prev, [group.id]: opt.id }))}
                          className={`px-5 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                            selectedVariants[group.id] === opt.id
                              ? 'bg-kado-red text-white border-kado-red shadow-md shadow-kado-red/20'
                              : 'bg-white border-kado-dark/10 text-kado-dark/65 hover:border-kado-red/50 hover:text-kado-red'
                          }`}
                        >
                          {opt.label}
                          {opt.priceDelta > 0 && (
                            <span className="ml-1.5 font-bold text-[10px] opacity-80">+₱{opt.priceDelta}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="shrink-0 border-t border-kado-dark/5 px-6 md:px-8 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-gray-50/50 backdrop-blur-md">
                {canPlaceOrder ? (
                  <>
                    <div className="flex items-center gap-3 bg-white border border-kado-dark/10 shadow-sm rounded-full px-3 py-2.5 shrink-0 self-center sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 flex items-center justify-center hover:text-kado-red hover:bg-kado-red/5 transition-colors rounded-full"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-black text-sm text-kado-dark min-w-[1.25rem] text-center select-none">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty((q) => q + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:text-kado-red hover:bg-kado-red/5 transition-colors rounded-full"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <motion.button
                      type="button"
                      onClick={handleAdd}
                      disabled={added}
                      whileTap={{ scale: 0.97 }}
                      className={`flex-1 rounded-full py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
                        added
                          ? 'bg-kado-dark text-white shadow-kado-dark/20'
                          : 'bg-kado-red text-white shadow-kado-red/30 hover:bg-kado-red-hover hover:shadow-kado-red/40'
                      }`}
                    >
                      {added ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Added!
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" /> Add — {formatPhp(lineTotal)}
                        </>
                      )}
                    </motion.button>
                  </>
                ) : !coffeeInStock && canOrderAuth && orderHours.isOpen ? (
                  <div className="flex-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-center">
                    <p className="text-sm font-medium text-amber-900 leading-relaxed">
                      This item is out of stock right now. Check back later or ask our baristas.
                    </p>
                  </div>
                ) : !canOrderAuth ? (
                  <div className="flex-1 flex flex-col gap-3 text-center sm:text-left">
                    <p className="text-sm font-medium text-kado-dark/70 leading-relaxed">
                      Sign in to customize your order and add it to your cart.
                    </p>
                    <Link
                      to="/auth/login"
                      state={{ from: '/' }}
                      onClick={onClose}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-kado-red py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-kado-red/30 hover:bg-kado-red-hover transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign in to order
                    </Link>
                    <Link
                      to="/auth/signup"
                      onClick={onClose}
                      className="text-xs font-bold text-kado-dark/55 hover:text-kado-red transition-colors"
                    >
                      New here? Create an account
                    </Link>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-3">
                    <OnlineOrderHoursNotice status={orderHours} variant="inline" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
