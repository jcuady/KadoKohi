import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Package } from 'lucide-react';
import type { MerchProduct } from '../types/domain';
import { useMerchStore } from '../store/merchStore';
import { formatPhp } from '../lib/money';
import ProductDetailDrawer from '../components/ProductDetailDrawer';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import ProductGridPagination, { PRODUCT_GRID_PAGE_SIZE } from '../components/ProductGridPagination';
import CatalogPageSkeleton from '../components/catalog/CatalogPageSkeleton';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=600&auto=format&fit=crop';

export default function Merch() {
  const categories = useMerchStore((s) => s.categories);
  const products = useMerchStore((s) => s.products);
  const remoteLoaded = useMerchStore((s) => s.remoteLoaded);
  const catalogLoading = !remoteLoaded;

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );
  const [activeCategoryId, setActiveCategoryId] = useState<string>(sortedCategories[0]?.id ?? '');
  const [selectedProduct, setSelectedProduct] = useState<MerchProduct | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!sortedCategories.length) return;
    if (!sortedCategories.some((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(sortedCategories[0].id);
    }
  }, [sortedCategories, activeCategoryId]);

  const activeCategory = useMemo(
    () => sortedCategories.find((c) => c.id === activeCategoryId),
    [sortedCategories, activeCategoryId],
  );

  const items = useMemo(
    () =>
      products
        .filter((p) => p.categoryId === activeCategoryId && p.visible)
        .sort((a, b) => a.order - b.order),
    [products, activeCategoryId],
  );

  useEffect(() => {
    setPage(1);
  }, [activeCategoryId]);

  const totalPages = items.length === 0 ? 1 : Math.ceil(items.length / PRODUCT_GRID_PAGE_SIZE);
  const safePage = items.length === 0 ? 1 : Math.min(Math.max(1, page), totalPages);
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * PRODUCT_GRID_PAGE_SIZE;
    return items.slice(start, start + PRODUCT_GRID_PAGE_SIZE);
  }, [items, safePage]);

  return (
    <div className="relative w-full bg-white font-sans min-h-screen">
      <div className="hidden md:block pointer-events-none fixed left-0 top-16 bottom-0 z-[30] w-28 lg:w-40 bg-kado-red shadow-[10px_0_30px_rgba(158,24,29,0.15)] overflow-hidden" aria-hidden>
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="font-display font-black text-white text-[8rem] lg:text-[10rem] leading-none -rotate-90 tracking-tighter whitespace-nowrap select-none">
            MERCH
          </h1>
        </div>
      </div>

      <div className="flex flex-col md:pl-28 lg:pl-40 min-w-0">
        <div className="md:hidden bg-kado-red pt-10 pb-8 px-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <h1 className="font-display font-black text-white text-[8rem] leading-none -mt-4">MERCH</h1>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70 mb-2 relative z-10">
            Kado Essentials
          </p>
          <h1 className="font-display text-5xl font-black text-white mb-2 tracking-tighter uppercase relative z-10">
            Shop Merch
          </h1>
          <p className="text-white/80 text-sm max-w-sm leading-relaxed relative z-10">
            Order online, pay via GCash, and claim at your selected branch.
          </p>
        </div>

        <section className="hidden md:block pt-10 pb-6 px-8 lg:px-16">
          <div className="max-w-6xl mx-auto">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-kado-red mb-3">
              Kado Essentials
            </p>
            <h1 className="font-display text-4xl lg:text-5xl font-black text-kado-dark mb-3 tracking-tighter uppercase">
              Shop Merch
            </h1>
            <p className="text-kado-dark/60 text-base max-w-lg leading-relaxed">
              Premium Kado Kohi apparel and accessories. Add to cart, checkout with GCash, then claim in-store.
            </p>
          </div>
        </section>

        {catalogLoading ? (
          <CatalogPageSkeleton variant="merch" />
        ) : (
          <>
        <section className="px-6 md:px-8 lg:px-16 pb-5 pt-4 md:pt-6 sticky top-14 md:top-[3.75rem] z-[35] bg-white/95 backdrop-blur-md border-b border-kado-dark/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-nowrap md:flex-wrap items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
              {sortedCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-2.5 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                    activeCategoryId === cat.id
                      ? 'bg-kado-red text-white shadow-lg shadow-kado-red/30'
                      : 'bg-white border border-kado-dark/15 text-kado-dark/70 hover:border-kado-red/50 hover:text-kado-red'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 md:px-8 lg:px-16 py-8 md:py-10">
          <div className="max-w-6xl mx-auto">
            {paginatedItems.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-kado-dark/10 bg-[#FAF7F2] p-12 text-center">
                <p className="text-sm font-semibold text-kado-dark/50">No merch items in this category yet.</p>
              </div>
            ) : (
              <motion.div
                key={`${activeCategoryId}-${safePage}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
              >
                {paginatedItems.map((product, i) => (
                  <motion.button
                    key={product.id}
                    type="button"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, ease: 'easeOut' }}
                    onClick={() => setSelectedProduct(product)}
                    className="group text-left bg-white border border-kado-dark/10 rounded-xl md:rounded-[1.25rem] overflow-hidden hover:shadow-[0_12px_28px_rgba(158,24,29,0.08)] hover:-translate-y-0.5 hover:border-kado-red/30 transition-all duration-300"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-kado-dark/5 shrink-0">
                      <img
                        src={product.image ?? DEFAULT_IMAGE}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.src !== DEFAULT_IMAGE) img.src = DEFAULT_IMAGE;
                        }}
                      />
                    </div>
                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-display font-black text-sm sm:text-[0.95rem] leading-snug text-kado-dark group-hover:text-kado-red transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <span className="font-sans font-black text-sm sm:text-base text-kado-dark shrink-0">
                          {formatPhp(product.basePrice)}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs font-medium text-kado-dark/60 leading-relaxed line-clamp-2 mt-auto pt-1">
                        {product.description ?? 'Premium Kado Kohi merchandise.'}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}

            <ProductGridPagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </section>
          </>
        )}
      </div>

      <PageSeoBlurb />

      <ProductDetailDrawer
        product={selectedProduct}
        categoryName={activeCategory?.name}
        onClose={() => setSelectedProduct(null)}
        requireAuthToOrder
      />
    </div>
  );
}
