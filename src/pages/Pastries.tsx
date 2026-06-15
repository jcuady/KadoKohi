import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Croissant, MapPin } from 'lucide-react';
import { useMenuStore } from '../store/menuStore';
import { findPastriesCategory, pastriesProducts } from '../lib/pastriesCategory';
import { formatPhp } from '../lib/money';
import { getMenuProductImageUrl } from '../lib/menuCatalog';
import { isProductInStock } from '../lib/productStock';
import ProductDetailDrawer from '../components/ProductDetailDrawer';
import type { Product } from '../types/domain';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';

const PAIRINGS = [
  {
    title: 'Matcha & Bakes',
    body: 'Pair a Matcha Oat Latte with our daily pastry rotation — balanced sweetness and earthy matcha.',
  },
  {
    title: 'Espresso Classics',
    body: 'Spanish Latte and Karamel Latte are regular favorites alongside butter-forward pastries.',
  },
  {
    title: 'Seasonal Drops',
    body: 'Limited bakes appear on busy weekends and event mornings — follow us for same-day availability.',
  },
];

export default function Pastries() {
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const hydrateFromRemote = useMenuStore((s) => s.hydrateFromRemote);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

  const pastriesCategory = useMemo(() => findPastriesCategory(categories), [categories]);
  const items = useMemo(() => pastriesProducts(categories, products), [categories, products]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-kado-offwhite font-sans">
      <section className="border-b border-kado-dark/5 bg-kado-cream px-6 pb-12 pt-28">
        <div className="mx-auto max-w-5xl text-center">
          <p className="kado-label mb-3 text-kado-red">Fresh at the bar</p>
          <h1 className="kado-h2 text-kado-dark uppercase tracking-tight">Pastries</h1>
          <p className="mx-auto mt-4 max-w-xl kado-body text-kado-dark/65">
            Daily bakes at Kado Kohi — pulled from our live menu. Best enjoyed in-store with your favorite drink.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 md:py-24">
        {items.length > 0 ? (
          <div className="mx-auto mb-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => {
              const inStock = isProductInStock(product);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelected(product)}
                  className="group flex flex-col overflow-hidden rounded-[1.25rem] border border-kado-dark/10 bg-white text-left shadow-[0_12px_32px_rgba(25,25,25,0.06)] transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(158,24,29,0.1)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={getMenuProductImageUrl(product, { pastriesCategoryId: pastriesCategory?.id })}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    {!inStock ? (
                      <span className="absolute left-3 top-3 rounded-full bg-amber-600 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                        Out today
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h2 className="kado-h3 text-kado-dark group-hover:text-kado-red transition-colors">{product.name}</h2>
                      <span className="shrink-0 kado-body-sm font-bold text-kado-dark">{formatPhp(product.basePrice)}</span>
                    </div>
                    {product.description ? (
                      <p className="kado-body-sm text-kado-dark/65 line-clamp-2">{product.description}</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mx-auto mb-14 max-w-md text-center kado-body text-kado-dark/55">
            {pastriesCategory
              ? 'Pastry lineup updates throughout the day — check back soon or visit us in-store.'
              : 'Our pastry menu is being updated. Visit us on J.P. Laurel or browse our coffee menu.'}
          </p>
        )}

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {PAIRINGS.map(({ title, body }) => (
            <article
              key={title}
              className="rounded-[1.25rem] border border-kado-dark/10 bg-white p-6 shadow-[0_12px_32px_rgba(25,25,25,0.05)]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-kado-red text-white">
                <Croissant className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="kado-h3 text-kado-dark">{title}</h3>
              <p className="mt-2 kado-body-sm text-kado-dark/65">{body}</p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-[1.5rem] border border-kado-red/20 bg-kado-red px-6 py-8 text-center text-white sm:px-10">
          <p className="kado-label mb-2 text-kado-cream/80">In-store today</p>
          <p className="kado-body text-white/90">
            Pastry selection changes daily. Visit us on J.P. Laurel, Sta. Elena, Marikina — or browse our{' '}
            <Link to="/menu" className="font-semibold text-kado-cream underline-offset-4 hover:underline">
              coffee menu
            </Link>{' '}
            to plan your pairing.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/branches"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-kado-cream px-6 kado-label text-kado-red transition-colors hover:bg-kado-offwhite"
            >
              <MapPin className="h-4 w-4" aria-hidden />
              Find a branch
            </Link>
            <Link
              to="/menu"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/30 px-6 kado-label text-white transition-colors hover:bg-white/10"
            >
              View coffee menu
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <ProductDetailDrawer
        product={selected}
        categoryName={pastriesCategory?.name ?? 'Pastries'}
        onClose={() => setSelected(null)}
      />

      <PageSeoBlurb />
    </div>
  );
}
