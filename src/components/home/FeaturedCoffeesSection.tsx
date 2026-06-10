import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Plus } from 'lucide-react';
import type { Variants } from 'motion/react';
import ProductDetailDrawer from '../ProductDetailDrawer';
import { TimelineContent } from '../ui/timeline-animation';
import { useMenuStore } from '../../store/menuStore';
import { useAuthStore } from '../../store/authStore';
import type { Product } from '../../types/domain';
import type { FeaturedCopy } from '../../store/landingContentStore';
import { formatPhp } from '../../lib/money';
import {
  getMenuProductImageUrl,
  listVisibleCoffeeProducts,
  pickFeaturedCoffeeProducts,
} from '../../lib/menuCatalog';

const cardReveal: Variants = {
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' as const },
  }),
  hidden: { opacity: 0, y: 28, scale: 0.98 },
};

function drinkTag(drink: Product, categoryLabel: string): string {
  if (drink.tags?.[0]) return drink.tags[0];
  if (drink.temperature === 'iced') return 'Iced';
  if (drink.temperature === 'hot') return 'Hot';
  return categoryLabel;
}

function drinkBlurb(drink: Product): string {
  if (drink.description) return drink.description;
  if (drink.temperature === 'iced') return 'Served iced — crisp and refreshing.';
  if (drink.temperature === 'both') return 'Available hot or iced.';
  return 'Hand-crafted in-house.';
}

type CardProps = {
  drink: Product;
  categoryLabel: string;
  index: number;
  hero?: boolean;
  sectionRef: RefObject<HTMLElement | null>;
  onSelect: (p: Product) => void;
  orderHint: string;
};

function DrinkCard({ drink, categoryLabel, index, hero, sectionRef, onSelect, orderHint }: CardProps) {
  const image = getMenuProductImageUrl(drink);
  const tag = drinkTag(drink, categoryLabel);

  return (
    <TimelineContent
      as="button"
      type="button"
      animationNum={index + 4}
      timelineRef={sectionRef}
      customVariants={cardReveal}
      onClick={() => onSelect(drink)}
      className={[
        'group relative w-full touch-manipulation overflow-hidden rounded-2xl text-left',
        'border border-kado-dark/10 bg-kado-dark',
        'shadow-[0_18px_48px_rgba(25,25,25,0.12)]',
        'transition-[transform,box-shadow] duration-500',
        'hover:-translate-y-1 hover:shadow-[0_28px_56px_rgba(158,24,29,0.18)]',
        'active:scale-[0.99]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2 focus-visible:ring-offset-kado-cream',
        hero
          ? 'aspect-[3/4] max-h-[26rem] lg:aspect-auto lg:max-h-none lg:min-h-full lg:row-span-2'
          : 'aspect-[4/5] max-h-[20rem] lg:aspect-auto lg:max-h-none lg:min-h-[18rem]',
      ].join(' ')}
    >
      <img
        src={image}
        alt={drink.name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-kado-dark via-kado-dark/50 to-kado-dark/15" />
      <div className="absolute inset-0 bg-gradient-to-br from-kado-red/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full border border-white/20 bg-kado-red/90 px-2.5 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-kado-cream backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3 sm:text-[10px]">
        {tag}
      </span>

      <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-5">
        <p className="mb-1 font-sans text-[9px] font-semibold uppercase tracking-[0.16em] text-kado-cream/55 sm:text-[10px]">
          {categoryLabel}
        </p>
        <div className="flex items-end justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className={[
                'font-display font-bold leading-tight text-kado-offwhite line-clamp-2',
                hero ? 'text-lg sm:text-2xl lg:text-3xl' : 'text-base sm:text-xl',
              ].join(' ')}
            >
              {drink.name}
            </h3>
            {!hero && (
              <p className="mt-1 line-clamp-2 font-sans text-[11px] font-medium leading-snug text-kado-cream/70 sm:text-xs">
                {drinkBlurb(drink)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:gap-2">
            <span className="font-display text-base font-bold text-kado-cream sm:text-xl">
              {formatPhp(drink.basePrice)}
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-kado-cream backdrop-blur-sm transition-colors group-hover:bg-kado-red group-hover:border-kado-red sm:h-9 sm:w-9">
              <Plus className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </div>
        {hero && (
          <p className="mt-2 line-clamp-3 font-sans text-xs font-medium leading-relaxed text-kado-cream/75 sm:mt-3 sm:line-clamp-none sm:text-sm">
            {drinkBlurb(drink)}
          </p>
        )}
        <p className="mt-2 font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-kado-cream/45 transition-colors group-hover:text-kado-cream/80 sm:mt-3 sm:text-[10px] sm:tracking-[0.14em]">
          {orderHint}
        </p>
      </div>
    </TimelineContent>
  );
}

type Props = { copy: FeaturedCopy };

export default function FeaturedCoffeesSection({ copy }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const products = useMenuStore((s) => s.products);
  const categories = useMenuStore((s) => s.categories);
  const menuDataSource = useMenuStore((s) => s.dataSource);
  const menuRemoteLoaded = useMenuStore((s) => s.remoteLoaded);
  const hydrateMenu = useMenuStore((s) => s.hydrateFromRemote);
  const user = useAuthStore((s) => s.user);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!menuRemoteLoaded) void hydrateMenu();
  }, [menuRemoteLoaded, hydrateMenu]);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const liveMenuCatalog = useMemo(() => {
    if (menuDataSource !== 'remote') return [];
    return listVisibleCoffeeProducts(products, categories);
  }, [menuDataSource, products, categories]);

  const showcaseDrinks = useMemo(
    () => pickFeaturedCoffeeProducts(copy.productIds, liveMenuCatalog, 3),
    [copy.productIds, liveMenuCatalog],
  );

  const menuReady = menuRemoteLoaded && menuDataSource === 'remote';
  const orderHint =
    user?.role === 'customer' ? 'Tap to order' : 'Tap to view · sign in to order';

  return (
    <section
      ref={sectionRef}
      aria-labelledby="featured-coffees-heading"
      className="relative w-full overflow-x-clip border-t border-kado-dark/10 bg-kado-cream px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20 lg:px-16 lg:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-4 top-6 select-none font-display text-[7rem] font-black leading-none text-kado-red/[0.05] sm:-right-6 sm:top-8 sm:text-[10rem] md:right-8 md:top-4 md:text-[18rem]"
      >
        角
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-kado-red to-transparent opacity-80"
      />

      <div className="relative mx-auto max-w-[1400px] min-w-0">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-14">
          <div className="min-w-0 max-w-2xl">
            <TimelineContent
              as="div"
              animationNum={0}
              timelineRef={sectionRef}
              className="mb-3 flex flex-wrap items-center gap-2.5 sm:mb-4 sm:gap-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-kado-red font-display text-base font-black text-kado-cream shadow-md sm:h-11 sm:w-11 sm:text-lg">
                角
              </span>
              <span className="max-w-full truncate rounded-full border border-kado-red/25 bg-kado-offwhite/80 px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-kado-red sm:text-[10px] sm:tracking-[0.2em]">
                {copy.badge}
              </span>
            </TimelineContent>

            <TimelineContent
              as="h2"
              id="featured-coffees-heading"
              animationNum={1}
              timelineRef={sectionRef}
              className="font-display text-[1.55rem] font-bold leading-[1.12] tracking-tight text-kado-dark sm:text-3xl sm:leading-[1.08] md:text-4xl lg:text-[3.25rem]"
            >
              {copy.title}
            </TimelineContent>

            <TimelineContent
              as="p"
              animationNum={2}
              timelineRef={sectionRef}
              className="mt-3 max-w-xl font-sans text-sm font-medium leading-relaxed text-kado-dark/70 sm:mt-4 sm:text-base"
            >
              <span className="hidden md:inline">{copy.subtitleDesktop}</span>
              <span className="md:hidden">{copy.subtitleMobile}</span>
            </TimelineContent>
          </div>

          <TimelineContent
            as="div"
            animationNum={3}
            timelineRef={sectionRef}
            className="flex w-full min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3 lg:w-auto"
          >
            <Link
              to={copy.shopCtaPath || '/menu'}
              className="inline-flex h-11 w-full min-h-[44px] items-center justify-center gap-2 rounded-full bg-kado-red px-5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-kado-cream shadow-lg shadow-kado-red/20 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:h-12 sm:w-auto sm:px-6 sm:text-xs sm:tracking-[0.14em]"
            >
              {copy.shopCtaLabel || 'View Shop'}
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
            <Link
              to="/menu"
              className="inline-flex h-11 w-full min-h-[44px] items-center justify-center gap-2 rounded-full border border-kado-dark/15 bg-kado-offwhite/90 px-5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-kado-dark transition-colors hover:border-kado-red/40 hover:text-kado-red sm:h-12 sm:w-auto sm:px-6 sm:text-xs sm:tracking-[0.14em]"
            >
              {copy.menuCtaLabel}
            </Link>
          </TimelineContent>
        </div>

        <div className="mt-8 min-w-0 md:mt-10">
          {!menuReady ? (
            <div className="flex gap-3 overflow-hidden lg:grid lg:grid-cols-12 lg:grid-rows-2 lg:gap-5">
              <div className="aspect-[3/4] w-[min(85vw,20rem)] shrink-0 animate-pulse rounded-2xl bg-kado-dark/10 lg:col-span-7 lg:row-span-2 lg:aspect-auto lg:min-h-[22rem] lg:w-auto" />
              <div className="aspect-[4/5] w-[min(72vw,17rem)] shrink-0 animate-pulse rounded-2xl bg-kado-dark/10 lg:col-span-5 lg:aspect-auto lg:min-h-[16rem] lg:w-auto" />
              <div className="hidden aspect-[4/5] w-[min(72vw,17rem)] shrink-0 animate-pulse rounded-2xl bg-kado-dark/10 sm:block lg:col-span-5 lg:aspect-auto lg:min-h-[16rem] lg:w-auto" />
            </div>
          ) : showcaseDrinks.length === 0 ? (
            <p className="rounded-2xl border border-kado-dark/10 bg-kado-offwhite/80 px-5 py-6 font-sans text-sm font-medium text-kado-dark/60 sm:px-6 sm:py-8">
              No coffee items are available on the menu yet. Add products in Admin → Menu, then select
              them in Homepage content.
            </p>
          ) : (
            <>
              {/* Phone + tablet: horizontal snap carousel with next-card peek */}
              <div className="relative lg:hidden">
                <div
                  className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-2 scroll-pl-4 scroll-pr-10 touch-pan-x"
                  aria-label="Featured drinks carousel"
                >
                  {showcaseDrinks.map((drink, i) => (
                    <div
                      key={drink.id}
                      className={[
                        'shrink-0 snap-center',
                        i === 0 ? 'w-[min(84vw,20rem)]' : 'w-[min(72vw,17rem)]',
                      ].join(' ')}
                    >
                      <DrinkCard
                        drink={drink}
                        categoryLabel={categoryById.get(drink.categoryId) ?? 'Coffee'}
                        index={i}
                        hero={i === 0}
                        sectionRef={sectionRef}
                        onSelect={setSelectedProduct}
                        orderHint={orderHint}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-kado-dark/35" aria-hidden />
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-kado-dark/40">
                    Swipe for more
                  </p>
                </div>
              </div>

              {/* Desktop: bento grid */}
              <div className="hidden lg:grid lg:grid-cols-12 lg:grid-rows-2 lg:gap-5 lg:min-h-[28rem]">
                {showcaseDrinks[0] && (
                  <div className="lg:col-span-7 lg:row-span-2">
                    <DrinkCard
                      drink={showcaseDrinks[0]}
                      categoryLabel={categoryById.get(showcaseDrinks[0].categoryId) ?? 'Coffee'}
                      index={0}
                      hero
                      sectionRef={sectionRef}
                      onSelect={setSelectedProduct}
                      orderHint={orderHint}
                    />
                  </div>
                )}
                {showcaseDrinks.slice(1).map((drink, i) => (
                  <div key={drink.id} className="lg:col-span-5">
                    <DrinkCard
                      drink={drink}
                      categoryLabel={categoryById.get(drink.categoryId) ?? 'Coffee'}
                      index={i + 1}
                      sectionRef={sectionRef}
                      onSelect={setSelectedProduct}
                      orderHint={orderHint}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <ProductDetailDrawer
        product={selectedProduct}
        categoryName={
          selectedProduct?.categoryId ? categoryById.get(selectedProduct.categoryId) ?? 'Coffee' : 'Coffee'
        }
        onClose={() => setSelectedProduct(null)}
        requireAuthToOrder
      />
    </section>
  );
}
