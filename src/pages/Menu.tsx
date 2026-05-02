import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Coffee, Leaf, IceCreamCone, Star } from 'lucide-react';
import { useMenuStore } from '../store/menuStore';
import { formatPhp } from '../lib/money';
import ProductDetailDrawer from '../components/ProductDetailDrawer';
import type { Product } from '../types/domain';

const FALLBACK_IMAGE_BY_CATEGORY: Record<string, string> = {
  cat_classics:
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop',
  cat_signatures:
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?q=80&w=400&auto=format&fit=crop',
  cat_matcha:
    'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=400&auto=format&fit=crop',
  cat_yuzu:
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=400&auto=format&fit=crop',
};

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400&auto=format&fit=crop';

function categoryIcon(categoryId: string): React.ReactNode {
  if (categoryId === 'cat_matcha') return <Leaf className="w-4 h-4" />;
  if (categoryId === 'cat_yuzu') return <IceCreamCone className="w-4 h-4" />;
  return <Coffee className="w-4 h-4" />;
}

export default function Menu() {
  const categories = useMenuStore((s) => s.categories);
  const productsByCategory = useMenuStore((s) => s.productsByCategory);

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

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const activeCategory = useMemo(
    () => sortedCategories.find((c) => c.id === activeCategoryId),
    [sortedCategories, activeCategoryId],
  );

  const items = activeCategoryId ? productsByCategory(activeCategoryId) : [];

  return (
    <div className="flex flex-col md:flex-row w-full bg-white font-sans min-h-screen relative">
      {/* Left red sidebar mimicking the flyer */}
      <div className="hidden md:flex w-28 lg:w-40 bg-kado-red shrink-0 items-center justify-center overflow-hidden sticky top-0 h-screen shadow-[10px_0_30px_rgba(158,24,29,0.15)] z-20">
        <h1 className="font-display font-black text-white text-[10rem] lg:text-[13rem] leading-none -rotate-90 tracking-tighter whitespace-nowrap select-none opacity-95">
          MENU
        </h1>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header (Red block) */}
        <div className="md:hidden bg-kado-red pt-10 pb-8 px-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <h1 className="font-display font-black text-white text-[8rem] leading-none -mt-4">
              MENU
            </h1>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70 mb-2 relative z-10">
            Daily Rituals
          </p>
          <h1 className="font-display text-5xl font-black text-white mb-2 tracking-tighter uppercase relative z-10">
            Our Menu
          </h1>
          <p className="text-white/80 text-sm max-w-sm leading-relaxed relative z-10">
            Carefully sourced beans, masterful techniques, and a touch of Japanese minimalism.
          </p>
        </div>

        {/* Desktop Header */}
        <section className="hidden md:block pt-16 pb-8 px-8 lg:px-16">
          <div className="max-w-6xl mx-auto">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-kado-red mb-3">
              Daily Rituals
            </p>
            <h1 className="font-display text-5xl lg:text-6xl font-black text-kado-dark mb-4 tracking-tighter uppercase">
              Our Menu
            </h1>
            <p className="text-kado-dark/60 text-base max-w-lg leading-relaxed">
              Carefully sourced beans, masterful techniques, and a touch of Japanese minimalism.
            </p>
          </div>
        </section>

        {/* Category tabs */}
        <section className="px-6 md:px-8 lg:px-16 pb-8 pt-6 md:pt-0 sticky top-0 md:top-0 bg-white/95 backdrop-blur-md z-10 border-b border-kado-dark/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-nowrap md:flex-wrap items-center gap-3 overflow-x-auto pb-4 md:pb-0 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
              {sortedCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                    activeCategoryId === cat.id
                      ? 'bg-kado-red text-white shadow-lg shadow-kado-red/30'
                      : 'bg-white border border-kado-dark/15 text-kado-dark/70 hover:border-kado-red/50 hover:text-kado-red'
                  }`}
                >
                  {categoryIcon(cat.id)}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Product grid */}
        <section className="px-6 md:px-8 lg:px-16 py-12">
          <div className="max-w-6xl mx-auto">
            <motion.div
              key={activeCategoryId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
            >
              {items.map((product, i) => {
                const image =
                  product.image ?? FALLBACK_IMAGE_BY_CATEGORY[product.categoryId] ?? DEFAULT_IMAGE;
                const tag = product.tags?.[0];
                const desc =
                  product.description ??
                  (product.temperature === 'iced'
                    ? 'Served iced — crisp and refreshing.'
                    : product.temperature === 'both'
                      ? 'Available hot or iced.'
                      : 'Crafted in-house with care.');

                return (
                  <motion.button
                    key={product.id}
                    type="button"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, ease: 'easeOut' }}
                    onClick={() => setSelectedProduct(product)}
                    className="group text-left bg-white border border-kado-dark/10 rounded-[1.5rem] overflow-hidden hover:shadow-[0_20px_40px_rgba(158,24,29,0.08)] hover:-translate-y-1.5 hover:border-kado-red/30 transition-all duration-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red flex flex-col h-full"
                  >
                    {/* Image */}
                    <div className="relative aspect-[5/4] overflow-hidden bg-kado-dark/5 shrink-0">
                      <img
                        src={image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {tag && (
                        <span className="absolute top-3 left-3 text-[9px] font-black uppercase tracking-widest bg-kado-dark text-white px-3 py-1 rounded-full shadow">
                          {tag}
                        </span>
                      )}

                      {/* Quick-add hint on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="bg-kado-red/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full shadow-lg">
                          View details
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-display font-black text-[1.1rem] leading-tight text-kado-dark group-hover:text-kado-red transition-colors">
                          {product.name}
                        </h3>
                        <span className="font-sans font-black text-lg text-kado-dark shrink-0">
                          {formatPhp(product.basePrice)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-kado-dark/60 leading-relaxed line-clamp-2 mt-auto pt-2">
                        {desc}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Loyalty card */}
        <section className="px-6 md:px-8 lg:px-16 pb-24 mt-auto">
          <div className="max-w-6xl mx-auto border-t border-kado-dark/10 pt-16">
            <LoyaltyCard />
          </div>
        </section>
      </div>

      {/* Product detail drawer */}
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
          <Coffee className="w-64 h-64 text-white" />
        </div>

        <div className="flex flex-col text-center md:text-left z-10 max-w-sm">
          <p className="text-kado-red font-bold tracking-[0.2em] uppercase text-[10px] mb-3 flex items-center justify-center md:justify-start gap-2">
            <Star className="w-3.5 h-3.5 fill-current" /> Member Rewards
          </p>
          <h3 className="font-display text-3xl md:text-4xl text-kado-cream font-bold mb-4 leading-tight">
            Earn Your <br className="hidden md:block" />
            Free Cup.
          </h3>
          <p className="text-[#A09A90] text-sm md:text-base font-medium leading-relaxed">
            Every coffee brings you closer to your next reward. Buy 9, get your 10th completely on
            us.
          </p>
        </div>

        <div className="relative bg-white/5 p-6 md:p-8 rounded-3xl border border-white/5 z-10 w-full md:w-auto backdrop-blur-sm">
          <div className="grid grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="relative flex items-center justify-center">
                <div
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center transition-all ${
                    i < 3
                      ? 'border-kado-red bg-kado-red/10 text-kado-red shadow-[0_0_15px_rgba(155,43,44,0.25)]'
                      : 'border-white/10 bg-transparent text-white/20 border-dashed'
                  }`}
                >
                  {i === 9 ? (
                    <Star className={`w-5 h-5 md:w-6 md:h-6 ${i < 3 ? 'fill-current' : ''}`} />
                  ) : (
                    <Coffee className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                </div>
                {i < 3 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.12, type: 'spring', stiffness: 220 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 border-[3px] border-kado-red rounded-full opacity-40 flex items-center justify-center">
                      <span className="text-[7px] font-bold text-kado-red uppercase tracking-widest rotate-12">
                        Kado
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
