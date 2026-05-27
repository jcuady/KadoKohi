import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Tag, Star } from 'lucide-react';
import type { MerchProduct } from '../types/domain';
import { useMerchStore } from '../store/merchStore';
import { useCartStore } from '../store/cartStore';
import { useCartToggle } from '../hooks/useCartToggle';
import { formatPhp } from '../lib/money';
import ProductDetailDrawer from '../components/ProductDetailDrawer';
import ProductGridPagination, { PRODUCT_GRID_PAGE_SIZE } from '../components/ProductGridPagination';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=400&auto=format&fit=crop';

function categoryIcon(): React.ReactNode {
  return <Tag className="w-4 h-4" />;
}

export default function Merch() {
  const categories = useMerchStore((s) => s.categories);
  const productsByCategory = useMerchStore((s) => s.productsByCategory);
  const cartItems = useCartStore((s) => s.items);
  const { tryOpenCart, orderHours } = useCartToggle();

  const sortedCategories = useMemo(
    () => [...categories].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  );

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    () => sortedCategories[0]?.id ?? '',
  );

  useEffect(() => {
    if (!sortedCategories.length) return;
    if (!sortedCategories.some((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(sortedCategories[0].id);
    }
  }, [sortedCategories, activeCategoryId]);

  const [selectedProduct, setSelectedProduct] = useState<MerchProduct | null>(null);
  const [page, setPage] = useState(1);

  const activeCategory = useMemo(
    () => sortedCategories.find((c) => c.id === activeCategoryId),
    [sortedCategories, activeCategoryId],
  );

  const list = activeCategoryId ? productsByCategory(activeCategoryId) : [];
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    setPage(1);
  }, [activeCategoryId]);

  const totalPages = list.length === 0 ? 1 : Math.ceil(list.length / PRODUCT_GRID_PAGE_SIZE);
  const safePage = list.length === 0 ? 1 : Math.min(Math.max(1, page), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * PRODUCT_GRID_PAGE_SIZE;
    return list.slice(start, start + PRODUCT_GRID_PAGE_SIZE);
  }, [list, safePage]);

  return (
    <div className="relative w-full bg-white font-sans min-h-screen">
      {/* Full-viewport ribbon: fixed below navbar */}
      <div
        className="hidden md:block pointer-events-none fixed left-0 top-16 bottom-0 z-[30] w-28 lg:w-40 bg-kado-red shadow-[10px_0_30px_rgba(158,24,29,0.15)] overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="font-display font-black text-white text-[10rem] lg:text-[13rem] leading-none -rotate-90 tracking-tighter whitespace-nowrap select-none opacity-95">
            MERCH
          </h1>
        </div>
      </div>

      <div className="flex flex-col md:pl-28 lg:pl-40 min-w-0">
        {/* Mobile Header (Red block) */}
        <div className="md:hidden bg-kado-red pt-10 pb-8 px-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <h1 className="font-display font-black text-white text-[8rem] leading-none -mt-4">
              MERCH
            </h1>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70 mb-2 relative z-10">
            Shop
          </p>
          <h1 className="font-display text-5xl font-black text-white mb-2 tracking-tighter uppercase relative z-10">
            Kado Merch
          </h1>
          <p className="text-white/80 text-sm max-w-sm leading-relaxed relative z-10">
            Premium merchandise from your favorite café.
          </p>
        </div>

        {/* Desktop Header */}
        <section className="hidden md:block pt-10 pb-6 px-8 lg:px-16">
          <div className="max-w-6xl mx-auto">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-kado-red mb-3">
              Shop
            </p>
            <h1 className="font-display text-4xl lg:text-5xl font-black text-kado-dark mb-3 tracking-tighter uppercase">
              Kado Merch
            </h1>
            <p className="text-kado-dark/60 text-base max-w-lg leading-relaxed">
              Premium merchandise from your favorite café.
            </p>
          </div>
        </section>

        {/* Category tabs */}
        <section className="px-6 md:px-8 lg:px-16 pb-5 pt-6 md:pt-0 sticky top-0 z-[35] bg-white/95 backdrop-blur-md border-b border-kado-dark/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-nowrap md:flex-wrap items-center gap-3 overflow-x-auto pb-4 md:pb-0 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
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
                  {categoryIcon()}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Product grid */}
        <section className="px-6 md:px-8 lg:px-16 py-8 md:py-10">
          <div className="max-w-6xl mx-auto">
            <motion.div
              key={`${activeCategoryId}-${safePage}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
            >
              {paginatedItems.map((product, i) => {
                const image = product.image ?? DEFAULT_IMAGE;
                const tag = product.tags?.[0];
                const desc = product.description ?? 'Premium Kado Kohi merchandise.';

                return (
                  <motion.button
                    key={product.id}
                    type="button"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, ease: 'easeOut' }}
                    onClick={() => setSelectedProduct(product)}
                    className="group text-left bg-white border border-kado-dark/10 rounded-xl md:rounded-[1.25rem] overflow-hidden hover:shadow-[0_12px_28px_rgba(158,24,29,0.08)] hover:-translate-y-0.5 hover:border-kado-red/30 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red flex flex-col h-full"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-kado-dark/5 shrink-0">
                      <img
                        src={image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {tag && (
                        <span className="absolute top-2 left-2 text-[8px] font-black uppercase tracking-widest bg-kado-dark text-white px-2 py-0.5 rounded-full shadow">
                          {tag}
                        </span>
                      )}

                      <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="bg-kado-red/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-full shadow-lg">
                          View details
                        </span>
                      </div>
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
                        {desc}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>

            <ProductGridPagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </section>

        <section className="px-6 md:px-8 lg:px-16 pb-24 mt-auto">
          <div className="max-w-6xl mx-auto border-t border-kado-dark/10 pt-16">
            <LoyaltyCard />
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={tryOpenCart}
        className={`fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
          orderHours.isOpen
            ? 'bg-kado-red text-white shadow-kado-red/25 hover:bg-kado-dark'
            : 'bg-kado-dark/80 text-white/90 hover:bg-kado-dark'
        }`}
        aria-label={orderHours.isOpen ? 'Open cart' : 'View cart hours — ordering closed'}
      >
        <ShoppingBag className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-kado-dark text-kado-cream text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {cartCount}
          </span>
        )}
      </button>

      <ProductDetailDrawer
        product={selectedProduct}
        categoryName={activeCategory?.name}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

function LoyaltyCard() {
  return (
    <div className="w-full max-w-4xl mx-auto relative">
      <div className="absolute inset-0 bg-kado-red/10 translate-x-3 translate-y-3 rounded-[2.5rem]" />

      <div className="relative bg-kado-dark border border-[#4A423C] p-8 md:p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden shadow-2xl">
        <div className="absolute -right-16 -bottom-16 opacity-[0.04] pointer-events-none">
          <ShoppingBag className="w-64 h-64 text-white" />
        </div>

        <div className="flex flex-col text-center md:text-left z-10 max-w-sm">
          <p className="text-kado-red font-bold tracking-[0.2em] uppercase text-[10px] mb-3 flex items-center justify-center md:justify-start gap-2">
            <Star className="w-3.5 h-3.5 fill-current" /> Member Rewards
          </p>
          <h3 className="font-display text-3xl md:text-4xl text-kado-cream font-bold mb-4 leading-tight">
            Exclusive <br className="hidden md:block" />
            Merch Perks.
          </h3>
          <p className="text-[#A09A90] text-sm md:text-base font-medium leading-relaxed">
            Get rewarded when you shop. Sign up to start earning stamps toward free drinks and exclusive discounts.
          </p>
        </div>
      </div>
    </div>
  );
}
