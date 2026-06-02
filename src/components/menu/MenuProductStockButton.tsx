import { useState } from 'react';
import { PackageX, PackageCheck, Loader2 } from 'lucide-react';
import type { Product } from '../../types/domain';
import { isProductInStock } from '../../lib/productStock';
import { useMenuStore } from '../../store/menuStore';

type Props = {
  product: Product;
  /** Compact layout for barista grid cards. */
  compact?: boolean;
};

export default function MenuProductStockButton({ product, compact = false }: Props) {
  const setProductInStock = useMenuStore((s) => s.setProductInStock);
  const inStock = isProductInStock(product);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    setError(null);
    setBusy(true);
    try {
      await setProductInStock(product.id, !inStock);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update stock.');
    } finally {
      setBusy(false);
    }
  };

  const base =
    'inline-flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider transition-colors touch-manipulation disabled:opacity-50';
  const size = compact
    ? 'min-h-[40px] w-full rounded-lg px-3 py-2 text-[10px]'
    : 'min-h-[44px] rounded-xl px-4 py-2.5 text-[10px]';

  return (
    <div className={compact ? 'w-full' : 'shrink-0'}>
      <button
        type="button"
        disabled={busy}
        onClick={() => void toggle()}
        className={`${base} ${size} ${
          inStock
            ? 'border border-amber-300/80 bg-amber-50 text-amber-900 hover:bg-amber-100'
            : 'border border-emerald-300/80 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
        }`}
        aria-pressed={!inStock}
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : inStock ? (
          <PackageX className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <PackageCheck className="w-3.5 h-3.5 shrink-0" />
        )}
        {inStock ? 'Out of stock' : 'Mark available'}
      </button>
      {error && (
        <p className={`mt-1 text-[10px] text-red-600 font-medium ${compact ? 'text-center' : ''}`}>
          {error}
        </p>
      )}
    </div>
  );
}
