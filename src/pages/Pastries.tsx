import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, ShoppingBag } from 'lucide-react';
import { useMenuStore } from '../store/menuStore';
import { findPastriesCategory, pastryHasPrice } from '../lib/pastriesCategory';
import { formatPhp } from '../lib/money';
import { isProductInStock } from '../lib/productStock';
import ProductDetailDrawer from '../components/ProductDetailDrawer';
import type { Product } from '../types/domain';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import { PASTRIES_PAGE, PASTRIES_ACCENT } from '../content/pastriesPage';
import { hydratePastries } from '../lib/bootstrapHydration';
import { usePastriesContentStore } from '../store/pastriesContentStore';
import Skeleton from '../components/ui/Skeleton';
import MenuProductImage from '../components/catalog/MenuProductImage';

export default function Pastries() {
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const remoteLoaded = useMenuStore((s) => s.remoteLoaded);
  const hydrateFromRemote = useMenuStore((s) => s.hydrateFromRemote);
  const cmsContent = usePastriesContentStore((s) => s.content);
  const pastriesHydrated = usePastriesContentStore((s) => s.hydrated);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    void hydrateFromRemote();
    void hydratePastries();
  }, [hydrateFromRemote]);

  const pastriesCategory = useMemo(() => findPastriesCategory(categories), [categories]);
  const pastryGrid = useMemo(() => {
    if (!pastriesCategory) return [];
    return products
      .filter((p) => p.categoryId === pastriesCategory.id && p.visible && pastryHasPrice(p))
      .sort((a, b) => a.order - b.order);
  }, [pastriesCategory, products]);

  const { hero, poster, cta } = pastriesHydrated ? cmsContent : PASTRIES_PAGE;

  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden bg-kado-offwhite font-sans">
      <section className="border-b border-kado-dark/5 bg-kado-cream px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28 md:px-12">
        <div className="mx-auto w-full max-w-5xl">
          <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-2">
            <div className="order-2 text-center lg:order-1 lg:text-left">
              <p className="kado-label mb-2 text-kado-red sm:mb-3">{hero.eyebrow}</p>
              <h1 className="text-balance font-display text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
                <span style={{ color: PASTRIES_ACCENT }}>{hero.headlineTop}</span>
                <br />
                <span className="text-kado-red">{hero.headlineBottom}</span>
              </h1>
              <p className="mx-auto mt-4 max-w-lg kado-body text-kado-dark/70 sm:mt-5 lg:mx-0">{hero.subhead}</p>
              <div className="mt-5 inline-flex w-full max-w-sm flex-col items-center gap-1 sm:mt-6 lg:max-w-none lg:items-start">
                <span
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg sm:w-auto sm:px-5 sm:text-xs"
                  style={{ backgroundColor: PASTRIES_ACCENT }}
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="text-center">{hero.badge}</span>
                </span>
                <span className="kado-subtext text-center font-semibold uppercase tracking-wider text-kado-dark/45 lg:text-left">
                  {hero.badgeNote}
                </span>
              </div>
            </div>
            <div className="order-1 mx-auto w-full max-w-sm lg:order-2 lg:max-w-none">
              <img
                src={poster.primaryImage}
                alt="Kado Kohi pastries"
                className="w-full rounded-[1rem] border border-kado-dark/10 shadow-xl sm:rounded-[1.25rem]"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-12 md:px-12 md:py-16">
        <div className="mx-auto w-full max-w-5xl">
          <p className="mb-5 text-center kado-label text-kado-red sm:mb-6">{cta.title}</p>
          {!remoteLoaded ? (
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
              aria-busy="true"
              aria-label="Loading pastries"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-kado-dark/10 bg-white">
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : pastryGrid.length === 0 ? (
            <p className="text-center kado-body text-kado-dark/55">Pastries will appear here once added in Menu Manager.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {pastryGrid.map((p) => {
                const inStock = isProductInStock(p);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!inStock}
                    onClick={() => inStock && setSelected(p)}
                    className={`overflow-hidden rounded-xl border border-kado-dark/10 bg-white text-left transition-colors ${
                      inStock ? 'hover:border-kado-red/30' : 'opacity-55 cursor-not-allowed'
                    }`}
                  >
                    <div className="relative aspect-square bg-kado-dark/5">
                      <MenuProductImage
                        product={p}
                        alt={p.name}
                        pastriesCategoryId={pastriesCategory?.id}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold text-kado-dark line-clamp-2">{p.name}</p>
                      <p className="mt-1 text-xs font-semibold text-kado-dark/70">{formatPhp(p.basePrice)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mx-auto mt-10 w-full max-w-3xl rounded-[1.25rem] border border-kado-red/20 bg-kado-red px-5 py-7 text-center text-white sm:mt-12 sm:rounded-[1.5rem] sm:px-8 sm:py-8 md:px-10">
          <p className="kado-body text-white/90">{cta.body}</p>
          <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            <Link
              to="/branches"
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-kado-cream px-6 kado-label text-kado-red touch-manipulation hover:bg-kado-offwhite sm:w-auto"
            >
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              Find a branch
            </Link>
            <Link
              to="/menu"
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-white/30 px-6 kado-label text-white touch-manipulation hover:bg-white/10 sm:w-auto"
            >
              View coffee menu
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
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
