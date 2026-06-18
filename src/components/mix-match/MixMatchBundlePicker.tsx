import { useMemo, useState } from 'react';
import { Check, Coffee, Cookie, Percent, ShoppingBag } from 'lucide-react';
import type { MenuCategory, Product } from '../../types/domain';
import {
  computeMixMatchBundleTotal,
  mixMatchCookies,
  mixMatchDrinkEntries,
  pastryHasPrice,
} from '../../lib/pastriesCategory';
import { formatPhp } from '../../lib/money';
import MenuProductImage from '../catalog/MenuProductImage';
import { isProductInStock } from '../../lib/productStock';
import { useCartStore } from '../../store/cartStore';
import { useOnlineOrderHours } from '../../hooks/useOnlineOrderHours';
import OnlineOrderHoursNotice from '../OnlineOrderHoursNotice';
import { PASTRIES_PAGE, MIX_MATCH_BLUE } from '../../content/pastriesPage';
import type { QrCartPayload } from '../qr/QrProductSheet';
import {
  buildMixMatchQrPayload,
  canAddMixMatchSelection,
  defaultMixMatchMilkId,
  mixMatchAddHint,
  mixMatchCtaLabel,
  mixMatchSelectionLabel,
  mixMatchUnitPrice,
  resolveMixMatchMode,
} from '../../lib/mixMatchOrder';
import { resolveMilkLabel } from '../../lib/menuProductModifiers';

type Props = {
  categories: MenuCategory[];
  products: Product[];
  pastriesCategoryId?: string;
  bundleNote?: string;
  /** Online uses cart drawer + store hours; QR adds directly to table/takeout cart. */
  channel?: 'online' | 'qr';
  onQrAdd?: (payload: QrCartPayload) => void;
};

const SELECT_BTN =
  'flex w-full min-h-[48px] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors touch-manipulation sm:gap-3 sm:px-3.5';

function SelectionRing({ selected, tone }: { selected: boolean; tone: 'blue' | 'red' }) {
  const active =
    tone === 'blue'
      ? 'border-[#1e4d8c] bg-[#1e4d8c] text-white'
      : 'border-kado-red bg-kado-red text-white';
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 sm:h-6 sm:w-6 ${
        selected ? active : 'border-kado-dark/25'
      }`}
      aria-hidden
    >
      {selected ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : null}
    </span>
  );
}

function toggleId(current: string | null, next: string): string | null {
  return current === next ? null : next;
}

export default function MixMatchBundlePicker({
  categories,
  products,
  pastriesCategoryId,
  bundleNote,
  channel = 'online',
  onQrAdd,
}: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const orderHours = useOnlineOrderHours();
  const drinks = useMemo(() => mixMatchDrinkEntries(categories, products), [categories, products]);
  const cookies = useMemo(() => mixMatchCookies(categories, products), [categories, products]);
  const orderableDrinks = useMemo(
    () => drinks.filter((e): e is { kind: 'product'; product: Product } => e.kind === 'product'),
    [drinks],
  );

  const [selectedDrinkId, setSelectedDrinkId] = useState<string | null>(null);
  const [selectedCookieId, setSelectedCookieId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const selectedDrink = orderableDrinks.find((e) => e.product.id === selectedDrinkId)?.product;
  const selectedCookie = cookies.find((c) => c.id === selectedCookieId);
  const mode = resolveMixMatchMode(selectedDrink, selectedCookie);

  const bundlePricing =
    mode === 'bundle' && selectedDrink && selectedCookie
      ? computeMixMatchBundleTotal(selectedDrink, selectedCookie)
      : null;

  const singlePrice =
    mode === 'drink-only' && selectedDrink
      ? mixMatchUnitPrice('drink-only', selectedDrink)
      : mode === 'cookie-only' && selectedCookie
        ? mixMatchUnitPrice('cookie-only', undefined, selectedCookie)
        : null;

  const requireHours = channel === 'online';
  const canAdd = canAddMixMatchSelection(selectedDrink, selectedCookie, {
    requireOpenHours: requireHours,
    isOpen: orderHours.isOpen,
  });

  const addHint = mixMatchAddHint(selectedDrinkId, selectedCookieId, {
    requireOpenHours: requireHours,
    isOpen: orderHours.isOpen,
  });

  const handleAdd = () => {
    if (!canAdd || !mode) return;

    if (channel === 'qr') {
      const payload = buildMixMatchQrPayload({
        mode,
        drink: selectedDrink,
        cookie: selectedCookie,
      });
      if (!payload || !onQrAdd) return;
      onQrAdd({
        ...payload,
        productNameSnapshot: mixMatchSelectionLabel(mode, selectedDrink, selectedCookie),
      });
    } else {
      const milkId = selectedDrink ? defaultMixMatchMilkId(selectedDrink) : undefined;
      const unit = mixMatchUnitPrice(mode, selectedDrink, selectedCookie, milkId);
      const name = mixMatchSelectionLabel(mode, selectedDrink, selectedCookie);
      const productId =
        mode === 'cookie-only' && selectedCookie ? selectedCookie.id : selectedDrink!.id;

      addItem(
        {
          itemType: mode === 'bundle' ? 'mix-match' : 'coffee',
          productId,
          mixMatchCookieId: mode === 'bundle' ? selectedCookie!.id : undefined,
          productNameSnapshot: name,
          qty: 1,
          milkId,
          milkLabelSnapshot: selectedDrink && milkId ? resolveMilkLabel(selectedDrink, milkId) : undefined,
          temperature:
            selectedDrink && selectedDrink.temperature === 'hot'
              ? 'hot'
              : selectedDrink
                ? 'iced'
                : undefined,
          unitPrice: unit,
          lineTotal: unit,
          image: selectedCookie?.image ?? selectedDrink?.image,
        },
        { openCart: true },
      );
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const checkoutPanel = (
    <div className="rounded-[1.25rem] border border-kado-dark/10 bg-kado-cream/40 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="kado-label text-kado-red">Your selection</p>
          {bundlePricing ? (
            <div className="mt-1 space-y-1 kado-body-sm text-kado-dark/75">
              <p className="break-words">
                {selectedDrink?.name} + {selectedCookie?.name}
              </p>
              <p className="flex flex-wrap gap-x-2 gap-y-0.5">
                <span>Subtotal {formatPhp(bundlePricing.subtotal)}</span>
                <span className="font-semibold" style={{ color: MIX_MATCH_BLUE }}>
                  {PASTRIES_PAGE.bundleDiscountPercent}% off (−{formatPhp(bundlePricing.discount)})
                </span>
              </p>
              <p className="kado-h3 text-kado-dark">{formatPhp(bundlePricing.total)}</p>
              {bundleNote ? <p className="text-xs text-kado-dark/50">{bundleNote}</p> : null}
            </div>
          ) : singlePrice != null && mode ? (
            <div className="mt-1 space-y-1 kado-body-sm text-kado-dark/75">
              <p className="break-words">{mixMatchSelectionLabel(mode, selectedDrink, selectedCookie)}</p>
              <p className="kado-h3 text-kado-dark">{formatPhp(singlePrice)}</p>
              {mode !== 'bundle' ? (
                <p className="text-xs text-kado-dark/50">
                  Add both drink and cookie for {PASTRIES_PAGE.bundleDiscountPercent}% off the pair.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-1 kado-body-sm text-kado-dark/55">
              Pick a Kado Kohi drink, a Kukidō cookie, or both for a bundle discount.
            </p>
          )}
          {addHint ? (
            <p className="mt-2 text-xs font-medium text-kado-dark/50" role="status">
              {addHint}
            </p>
          ) : null}
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 lg:max-w-xs">
          {requireHours && !orderHours.isOpen ? (
            <OnlineOrderHoursNotice status={orderHours} variant="compact" />
          ) : null}
          <button
            type="button"
            disabled={!canAdd}
            onClick={handleAdd}
            aria-live="polite"
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-kado-red px-6 kado-label text-kado-cream transition-colors hover:bg-kado-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {added ? (
              <>
                <Check className="h-4 w-4 shrink-0" /> Added
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 shrink-0" />
                {mixMatchCtaLabel(mode)}
              </>
            )}
          </button>
          {mode === 'bundle' ? (
            <span className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1e4d8c]">
              <Percent className="h-3.5 w-3.5 shrink-0" />
              {PASTRIES_PAGE.hero.badge}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
        <div className="min-w-0 rounded-[1.25rem] border border-kado-dark/10 bg-white p-4 sm:p-5">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] sm:tracking-[0.2em]" style={{ color: MIX_MATCH_BLUE }}>
            {PASTRIES_PAGE.steps.drinks.step}
          </p>
          <h3 className="mb-3 font-display text-base font-bold uppercase tracking-tight text-kado-dark sm:mb-4 sm:text-lg">
            {PASTRIES_PAGE.steps.drinks.title}
          </h3>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-1.5">
            {drinks.map((entry) => {
              if (entry.kind === 'label') {
                return (
                  <li
                    key={entry.name}
                    className="flex min-h-[44px] items-center gap-2 px-2 py-2 text-kado-dark/50 sm:col-span-1"
                  >
                    <Coffee className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate kado-body-sm font-semibold italic">{entry.name}</span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider">Soon</span>
                  </li>
                );
              }
              const { product } = entry;
              const selected = selectedDrinkId === product.id;
              const orderable = pastryHasPrice(product);
              const inStock = isProductInStock(product);
              return (
                <li key={product.id} className="min-w-0">
                  <button
                    type="button"
                    disabled={!orderable || !inStock}
                    aria-pressed={selected}
                    onClick={() => setSelectedDrinkId((id) => toggleId(id, product.id))}
                    className={`${SELECT_BTN} ${
                      selected
                        ? 'border-[#1e4d8c] bg-[#1e4d8c]/8'
                        : 'border-transparent hover:border-kado-dark/10 hover:bg-kado-cream/50 active:bg-kado-cream/70'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <SelectionRing selected={selected} tone="blue" />
                    <span className="min-w-0 flex-1 truncate kado-body-sm font-semibold italic text-kado-dark" title={product.name}>
                      {product.name}
                    </span>
                    {orderable ? (
                      <span className="shrink-0 text-[11px] font-bold text-kado-dark/70 sm:text-xs">
                        {formatPhp(product.basePrice)}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="min-w-0 rounded-[1.25rem] border border-kado-dark/10 bg-white p-4 sm:p-5">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-kado-red sm:tracking-[0.2em]">
            {PASTRIES_PAGE.steps.cookies.step}
          </p>
          <h3 className="mb-3 font-display text-base font-bold uppercase tracking-tight text-kado-dark sm:mb-4 sm:text-lg">
            {PASTRIES_PAGE.steps.cookies.title}
          </h3>
          {cookies.length > 0 ? (
            <ul className="space-y-1 sm:space-y-1.5">
              {cookies.map((product) => {
                const selected = selectedCookieId === product.id;
                const inStock = isProductInStock(product);
                return (
                  <li key={product.id} className="min-w-0">
                    <button
                      type="button"
                      disabled={!pastryHasPrice(product) || !inStock}
                      aria-pressed={selected}
                      onClick={() => setSelectedCookieId((id) => toggleId(id, product.id))}
                      className={`${SELECT_BTN} ${
                        selected
                          ? 'border-kado-red bg-kado-red/8'
                          : 'border-transparent hover:border-kado-dark/10 hover:bg-kado-cream/50 active:bg-kado-cream/70'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <SelectionRing selected={selected} tone="red" />
                      {product.image?.trim() ? (
                        <MenuProductImage
                          product={product}
                          alt=""
                          pastriesCategoryId={pastriesCategoryId}
                          loading="lazy"
                          className="h-9 w-9 shrink-0 rounded-lg object-cover sm:h-10 sm:w-10"
                        />
                      ) : (
                        <Cookie className="h-4 w-4 shrink-0 text-kado-red" aria-hidden />
                      )}
                      <span className="min-w-0 flex-1 truncate kado-body-sm font-semibold italic text-kado-dark" title={product.name}>
                        {product.name}
                      </span>
                      <span className="shrink-0 text-[11px] font-bold text-kado-dark/70 sm:text-xs">
                        {formatPhp(product.basePrice)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="kado-body-sm text-kado-dark/55">Cookie lineup updates daily — check back soon.</p>
          )}
        </div>
      </div>

      <div className="hidden md:block">{checkoutPanel}</div>

      <div
        className="sticky bottom-0 z-30 -mx-1 border-t border-kado-dark/10 bg-kado-offwhite/95 px-1 pt-3 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {checkoutPanel}
      </div>
      <div className="h-2 md:hidden" aria-hidden />
    </div>
  );
}
