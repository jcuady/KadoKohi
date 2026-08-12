import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import type { Product } from '../../types/domain';
import { useCartStore } from '../../store/cartStore';
import { useMenuStore } from '../../store/menuStore';
import { formatPhp } from '../../lib/money';
import {
  KUKIDO_BLUE,
  KUKIDO_BLUE_DEEP,
  KUKIDO_COOKIE_LABEL,
  KUKIDO_PAPER,
  KUKI_SINGLE_PRICE,
  isKukidoCookieId,
  resolveKukiBoxOptions,
  resolveKukiPackPrices,
  resolveKukidoCookieImage,
  type KukiBoxSize,
} from '../../lib/kukido';
import {
  buildKukiBoxLines,
  sumCookieQtys,
  validateKukiBoxFill,
  type KukiBoxCommitLine,
  type KukiPackChoice,
} from '../../lib/kukiBoxOrder';
import { OVERLAY_SCRIM } from '../../lib/overlayTheme';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

type Props = {
  open: boolean;
  cookies: Product[];
  onClose: () => void;
  /** Prefill box size when the dialog opens (e.g. from size rail on /pastries). */
  initialSize?: KukiBoxSize;
  /**
   * QR / takeout: commit lines into guest cart instead of the online cart store.
   * Online checkout leaves this unset.
   */
  onCommit?: (lines: KukiBoxCommitLine[]) => void;
};

/**
 * Build a kukidō Kuki Box: pick size, set per-flavor quantities, optional packaging.
 * Box/pack prices come from Admin → Menu → Pastries (live catalog).
 */
export default function KukiBoxBuilder({ open, cookies, onClose, onCommit, initialSize = 4 }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const catalog = useMenuStore((s) => s.products);
  const [size, setSize] = useState<KukiBoxSize>(initialSize);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [pack, setPack] = useState<KukiPackChoice>('none');
  const [added, setAdded] = useState(false);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    setSize(initialSize);
    setQtys({});
    setPack('none');
    setAdded(false);
  }, [open, initialSize]);

  const cookieList = useMemo(
    () => cookies.filter((c) => isKukidoCookieId(c.id) && c.visible),
    [cookies],
  );
  const allowedIds = useMemo(() => cookieList.map((c) => c.id), [cookieList]);
  const boxOptions = useMemo(() => resolveKukiBoxOptions(catalog), [catalog]);
  const packPrices = useMemo(() => resolveKukiPackPrices(catalog), [catalog]);
  const singlePrice = useMemo(() => {
    const priced = cookieList.find((c) => Number.isFinite(c.basePrice) && c.basePrice > 0);
    return priced ? Number(priced.basePrice) : KUKI_SINGLE_PRICE;
  }, [cookieList]);

  const box = boxOptions.find((o) => o.size === size) ?? boxOptions[0];
  const fill = validateKukiBoxFill(size, qtys, allowedIds.length ? allowedIds : undefined);
  const canAdd = fill.ok && cookieList.length > 0 && box.orderable;

  const reset = () => {
    setSize(initialSize);
    setQtys({});
    setPack('none');
    setAdded(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const setCookieQty = (id: string, next: number) => {
    setQtys((prev) => {
      const filledWithout = sumCookieQtys({ ...prev, [id]: 0 });
      const maxForThis = Math.max(0, size - filledWithout);
      const qty = Math.max(0, Math.min(maxForThis, Math.floor(next)));
      const copy = { ...prev };
      if (qty <= 0) delete copy[id];
      else copy[id] = qty;
      return copy;
    });
    setAdded(false);
  };

  const submit = () => {
    if (!canAdd) return;
    const labels: Record<string, string> = {};
    for (const c of cookieList) {
      labels[c.id] = c.name;
    }
    let built: ReturnType<typeof buildKukiBoxLines>;
    try {
      built = buildKukiBoxLines({
        size,
        qtys,
        labels,
        pack,
        allowedIds: allowedIds.length ? allowedIds : undefined,
        boxPrice: box.price,
        packSinglePrice: packPrices.single,
        packBigPrice: packPrices.big,
      });
    } catch {
      return;
    }

    const lines = [built.box, ...(built.packaging ? [built.packaging] : [])];
    if (onCommit) {
      onCommit(lines);
    } else {
      for (const line of lines) {
        addItem({
          itemType: 'coffee',
          productId: line.productId,
          productNameSnapshot: line.productNameSnapshot,
          qty: line.qty,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          image: line.image,
          selectedVariants: line.selectedVariants,
        });
      }
    }

    setAdded(true);
    window.setTimeout(() => close(), 900);
  };

  if (!open) return null;

  const packExtra = pack === 'single' ? packPrices.single : pack === 'big' ? packPrices.big : 0;
  const total = box.price + packExtra;

  return (
    <div className={`fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4 ${OVERLAY_SCRIM}`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kuki-box-title"
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] border border-kado-dark/10 shadow-[0_28px_64px_rgba(20,58,158,0.22)] sm:rounded-[1.75rem]"
        style={{ backgroundColor: KUKIDO_PAPER }}
      >
        <div
          className="flex items-start justify-between gap-3 px-5 py-4 text-white"
          style={{ backgroundColor: KUKIDO_BLUE }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">kukidō × kado</p>
            <h2 id="kuki-box-title" className="font-display text-2xl font-black uppercase tracking-tight">
              Kuki Boxes
            </h2>
            <p className="mt-1 text-sm text-white/85">
              Singles {formatPhp(singlePrice)}. Free box from 4 pcs.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-kado-dark/50">Box size</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {boxOptions.map((opt) => {
                const active = size === opt.size;
                return (
                  <button
                    key={opt.size}
                    type="button"
                    disabled={!opt.orderable}
                    onClick={() => {
                      setSize(opt.size);
                      setQtys((prev) => {
                        const entries = Object.entries(prev).filter(
                          (entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0,
                        );
                        let remaining = opt.size;
                        const next: Record<string, number> = {};
                        for (const [id, q] of entries) {
                          if (remaining <= 0) break;
                          const take = Math.min(q, remaining);
                          next[id] = take;
                          remaining -= take;
                        }
                        return next;
                      });
                      setAdded(false);
                    }}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-[transform,background-color,border-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
                      active ? 'border-transparent text-white' : 'border-kado-dark/12 bg-white text-kado-dark'
                    }`}
                    style={active ? { backgroundColor: KUKIDO_BLUE_DEEP } : undefined}
                  >
                    <span className="block text-sm font-bold">{opt.size} pcs</span>
                    <span className={`text-xs ${active ? 'text-white/80' : 'text-kado-dark/55'}`}>
                      {formatPhp(opt.price)}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-kado-dark/55">
              Cookies {formatPhp(box.perCookie)} each ({formatPhp(box.price)} total).
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-kado-dark/50">
                Choose cookies · {fill.filled}/{size}
              </p>
              {fill.remaining > 0 ? (
                <span className="text-[11px] font-semibold" style={{ color: KUKIDO_BLUE }}>
                  Pick {fill.remaining} more
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700">Box full</span>
              )}
            </div>

            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {cookieList.map((cookie) => {
                const img = resolveKukidoCookieImage(cookie.id, cookie.image);
                const label = isKukidoCookieId(cookie.id)
                  ? KUKIDO_COOKIE_LABEL[cookie.id]
                  : cookie.name.toLowerCase();
                const qty = qtys[cookie.id] ?? 0;
                const canInc = fill.filled < size;
                return (
                  <li
                    key={cookie.id}
                    className="flex items-center gap-3 rounded-xl border border-kado-dark/10 bg-white p-2.5"
                  >
                    <span
                      className="block h-14 w-14 shrink-0 overflow-hidden rounded-full"
                      style={{ backgroundColor: KUKIDO_PAPER }}
                    >
                      <img
                        src={img}
                        alt=""
                        className="h-full w-full object-contain p-1"
                        loading="lazy"
                        width={112}
                        height={112}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold lowercase text-kado-dark">{label}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-kado-dark/10 bg-kado-offwhite/80 p-0.5">
                        <button
                          type="button"
                          aria-label={`Remove one ${label}`}
                          disabled={qty <= 0}
                          onClick={() => setCookieQty(cookie.id, qty - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-kado-dark disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums">{qty}</span>
                        <button
                          type="button"
                          aria-label={`Add one ${label}`}
                          disabled={!canInc}
                          onClick={() => setCookieQty(cookie.id, qty + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white disabled:opacity-30"
                          style={{ backgroundColor: canInc ? KUKIDO_BLUE : undefined }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {cookieList.length === 0 ? (
              <p className="rounded-xl border border-dashed border-kado-dark/15 px-3 py-6 text-center text-sm text-kado-dark/50">
                Cookies are still loading. Try again in a moment.
              </p>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-kado-dark/50">
              Packaging (optional)
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  { id: 'none' as const, label: 'No add-on', disabled: false },
                  {
                    id: 'single' as const,
                    label: `Single +${Math.round(packPrices.single)}`,
                    disabled: !packPrices.singleOrderable,
                  },
                  {
                    id: 'big' as const,
                    label: `Big box +${Math.round(packPrices.big)}`,
                    disabled: !packPrices.bigOrderable,
                  },
                ] as const
              ).map((opt) => {
                const active = pack === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => setPack(opt.id)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      active ? 'text-white' : 'border-kado-dark/12 bg-white text-kado-dark/70'
                    }`}
                    style={
                      active
                        ? { backgroundColor: KUKIDO_BLUE, borderColor: KUKIDO_BLUE }
                        : undefined
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-kado-dark/8 px-5 py-4">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-kado-dark/45">Total</p>
              <p className="font-display text-2xl font-black" style={{ color: KUKIDO_BLUE_DEEP }}>
                {formatPhp(total)}
              </p>
            </div>
            <button
              type="button"
              disabled={!canAdd}
              onClick={submit}
              className="min-h-12 rounded-full px-6 text-xs font-black uppercase tracking-[0.14em] text-white transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] disabled:opacity-40 active:scale-[0.98]"
              style={{ backgroundColor: KUKIDO_BLUE }}
            >
              {added ? 'Added!' : `Add ${size}-pc box`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
