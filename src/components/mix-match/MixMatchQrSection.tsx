import { useMemo } from 'react';
import type { MenuCategory } from '../../types/domain';
import type { QrCartPayload } from '../qr/QrProductSheet';
import { findPastriesCategory } from '../../lib/pastriesCategory';
import { mixMatchCookies, mixMatchDrinkProducts } from '../../lib/pastriesCategory';
import MixMatchBundlePicker from './MixMatchBundlePicker';
import { PASTRIES_PAGE, MIX_MATCH_BLUE } from '../../content/pastriesPage';
import { Percent } from 'lucide-react';

type Props = {
  categories: MenuCategory[];
  products: import('../../types/domain').Product[];
  onAdd: (payload: QrCartPayload) => void;
};

/** Compact Mix & Match block for QR dine-in / takeout menus. */
export default function MixMatchQrSection({ categories, products, onAdd }: Props) {
  const pastriesCategory = useMemo(() => findPastriesCategory(categories), [categories]);
  const hasCatalog =
    mixMatchDrinkProducts(categories, products).length > 0 || mixMatchCookies(categories, products).length > 0;

  if (!hasCatalog) return null;

  return (
    <section className="mb-6 rounded-[1.25rem] border border-[#1e4d8c]/20 bg-white p-4 sm:p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red">
            {PASTRIES_PAGE.hero.eyebrow}
          </p>
          <h2 className="font-display text-lg font-black uppercase tracking-tight text-kado-dark sm:text-xl">
            <span style={{ color: MIX_MATCH_BLUE }}>Mix</span>{' '}
            <span className="text-kado-red">& Match</span>
          </h2>
          <p className="mt-1 text-xs text-kado-dark/60 sm:text-sm">
            Order a drink, a cookie, or both — {PASTRIES_PAGE.bundleDiscountPercent}% off when you pair them.
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: MIX_MATCH_BLUE }}
        >
          <Percent className="h-3.5 w-3.5" aria-hidden />
          {PASTRIES_PAGE.hero.badge}
        </span>
      </div>

      <MixMatchBundlePicker
        categories={categories}
        products={products}
        pastriesCategoryId={pastriesCategory?.id}
        channel="qr"
        onQrAdd={onAdd}
      />
    </section>
  );
}
