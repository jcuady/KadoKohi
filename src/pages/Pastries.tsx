import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Percent, ShoppingBag } from 'lucide-react';
import { useMenuStore } from '../store/menuStore';
import {
  collabPastries,
  findPastriesCategory,
  findFeaturedPastry,
  pastryHasPrice,
} from '../lib/pastriesCategory';
import { formatPhp } from '../lib/money';
import { getMenuProductImageUrl } from '../lib/menuCatalog';
import { isProductInStock } from '../lib/productStock';
import ProductDetailDrawer from '../components/ProductDetailDrawer';
import MixMatchBundlePicker from '../components/mix-match/MixMatchBundlePicker';
import type { Product } from '../types/domain';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import { PASTRIES_PAGE, MIX_MATCH_BLUE } from '../content/pastriesPage';
import Skeleton from '../components/ui/Skeleton';

export default function Pastries() {
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const remoteLoaded = useMenuStore((s) => s.remoteLoaded);
  const hydrateFromRemote = useMenuStore((s) => s.hydrateFromRemote);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

  const pastriesCategory = useMemo(() => findPastriesCategory(categories), [categories]);
  const collabs = useMemo(() => collabPastries(categories, products), [categories, products]);
  const featured = useMemo(() => findFeaturedPastry(collabs) ?? collabs[0], [collabs]);

  const { hero, poster, cta } = PASTRIES_PAGE;
  const featuredInStock = featured ? isProductInStock(featured) : false;
  const canOrderFeatured = featured && pastryHasPrice(featured) && featuredInStock;

  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden bg-kado-offwhite font-sans">
      <section className="border-b border-kado-dark/5 bg-kado-cream px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28 md:px-12">
        <div className="mx-auto w-full max-w-5xl">
          <div className="grid items-center gap-6 sm:gap-8 lg:grid-cols-2">
            <div className="order-2 text-center lg:order-1 lg:text-left">
              <p className="kado-label mb-2 text-kado-red sm:mb-3">{hero.eyebrow}</p>
              <h1 className="text-balance font-display text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
                <span style={{ color: MIX_MATCH_BLUE }}>{hero.headlineTop}</span>
                <br />
                <span className="text-kado-red">{hero.headlineBottom}</span>
              </h1>
              <p className="mx-auto mt-4 max-w-lg kado-body text-kado-dark/70 sm:mt-5 lg:mx-0">{hero.subhead}</p>
              <div className="mt-5 inline-flex w-full max-w-sm flex-col items-center gap-1 sm:mt-6 lg:max-w-none lg:items-start">
                <span
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg sm:w-auto sm:px-5 sm:text-xs"
                  style={{ backgroundColor: MIX_MATCH_BLUE }}
                >
                  <Percent className="h-4 w-4 shrink-0" aria-hidden />
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
                alt="Kukidō x Kado Kohi Mix and Match poster"
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
          ) : (
          <MixMatchBundlePicker
            categories={categories}
            products={products}
            pastriesCategoryId={pastriesCategory?.id}
          />
          )}
        </div>

        {remoteLoaded && featured ? (
          <div className="mx-auto mt-10 w-full max-w-5xl sm:mt-14">
            <h2 className="mb-4 text-center kado-label text-kado-red sm:mb-5">Takeover exclusive</h2>
            <article className="overflow-hidden rounded-[1.25rem] border border-kado-dark/10 bg-white shadow-[0_20px_60px_rgba(25,25,25,0.08)] sm:rounded-[1.5rem] lg:grid lg:grid-cols-2">
              <div className="relative aspect-[4/3] w-full bg-kado-red sm:aspect-[16/10] lg:aspect-auto lg:min-h-[300px]">
                <img
                  src={getMenuProductImageUrl(featured, { pastriesCategoryId: pastriesCategory?.id })}
                  alt={featured.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col justify-center p-5 sm:p-6 md:p-8">
                <p className="kado-label text-kado-red">Kukidō x Kado Kohi</p>
                <h3 className="mt-1 text-balance font-display text-2xl font-black uppercase tracking-tight text-kado-dark sm:text-3xl">
                  {featured.name}
                </h3>
                {featured.description ? (
                  <p className="mt-3 kado-body text-kado-dark/70">{featured.description}</p>
                ) : null}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  {pastryHasPrice(featured) ? (
                    <span className="kado-h2 text-kado-dark">{formatPhp(featured.basePrice)}</span>
                  ) : null}
                  {canOrderFeatured ? (
                    <button
                      type="button"
                      onClick={() => setSelected(featured)}
                      className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-kado-red px-6 kado-label text-kado-cream touch-manipulation hover:bg-kado-dark sm:w-auto"
                    >
                      <ShoppingBag className="h-4 w-4 shrink-0" />
                      Order {featured.name}
                    </button>
                  ) : !featuredInStock ? (
                    <span className="text-center text-xs font-bold uppercase tracking-wider text-amber-700 sm:text-left">
                      Out today
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          </div>
        ) : null}

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
