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
import CmsStyledText from '../cms/CmsStyledText';
import CmsEditableImage from '../cms/CmsEditableImage';
import { formatPhp } from '../../lib/money';
import { cmsTextProps } from '../../lib/cmsFieldBind';
import { useLandingContentStore } from '../../store/landingContentStore';
import ResilientImage from '../ui/ResilientImage';
import BrandHybridMark from '../BrandHybridMark';
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
  imageOverride?: string;
  cmsEditMode?: boolean;
  cardIndex?: number;
  onImageOverride?: (url: string) => void;
  sectionRef: RefObject<HTMLElement | null>;
  onSelect: (p: Product) => void;
  orderHint: string;
};

function DrinkCard({
  drink,
  categoryLabel,
  index,
  hero,
  imageOverride,
  cmsEditMode,
  cardIndex,
  onImageOverride,
  sectionRef,
  onSelect,
  orderHint,
}: CardProps) {
  const menuImage = getMenuProductImageUrl(drink);
  const image = imageOverride?.trim() || menuImage;
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
      {cmsEditMode && cardIndex !== undefined && onImageOverride ? (
        <CmsEditableImage
          cmsField={`featured.card.${cardIndex}.image`}
          cmsLabel={`Featured card ${cardIndex + 1} image`}
          src={image}
          alt={drink.name}
          className="absolute inset-0 h-full w-full"
          onImageChange={onImageOverride}
        />
      ) : (
        <ResilientImage
          src={image}
          fallbackSrc={image !== menuImage ? menuImage : undefined}
          alt={drink.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-kado-dark via-kado-dark/50 to-kado-dark/15" />
      <div className="absolute inset-0 bg-gradient-to-br from-kado-red/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full border border-white/20 bg-kado-red/90 px-2.5 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-kado-cream backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3 sm:text-[10px]">
        {tag}
      </span>

      <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-5">
        <p className="mb-1 kado-label text-kado-cream/55">
          {categoryLabel}
        </p>
        <div className="flex items-end justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="kado-h3 text-kado-offwhite line-clamp-2">
              {drink.name}
            </h3>
            {!hero && (
              <p className="mt-1 line-clamp-2 kado-body-sm text-kado-cream/70">
                {drinkBlurb(drink)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:gap-2">
            <span className="kado-h3 text-kado-cream">
              {formatPhp(drink.basePrice)}
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-kado-cream backdrop-blur-sm transition-colors group-hover:bg-kado-red group-hover:border-kado-red sm:h-9 sm:w-9">
              <Plus className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </div>
        {hero && (
          <p className="mt-2 line-clamp-3 kado-body-sm text-kado-cream/75 sm:mt-3 sm:line-clamp-none">
            {drinkBlurb(drink)}
          </p>
        )}
        <p className="mt-2 kado-subtext font-semibold uppercase tracking-[0.12em] text-kado-cream/45 transition-colors group-hover:text-kado-cream/80 sm:mt-3">
          {orderHint}
        </p>
      </div>
    </TimelineContent>
  );
}

type Props = { copy: FeaturedCopy; cmsEditMode?: boolean };

export default function FeaturedCoffeesSection({ copy, cmsEditMode }: Props) {
  const updateFeatured = useLandingContentStore((s) => s.updateFeatured);
  const setCardImage = (index: number, url: string) => {
    const next = [...copy.cardImageOverrides] as [string, string, string];
    next[index] = url;
    updateFeatured({ cardImageOverrides: next });
  };
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
      className="landing-section relative w-full overflow-x-clip bg-kado-cream"
    >
      <div
        aria-hidden
        className="kado-kanji-watermark -right-4 top-6 text-[clamp(7rem,20vw,18rem)] text-kado-red/[0.05] sm:-right-6 sm:top-8 md:right-8 md:top-4"
      >
        角
      </div>

      <div className="relative mx-auto max-w-[1400px] min-w-0 pr-[max(0px,env(safe-area-inset-right))]">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-14">
          <div className="min-w-0 max-w-2xl">
            <TimelineContent
              as="div"
              animationNum={0}
              timelineRef={sectionRef}
              className="mb-3 flex flex-wrap items-center gap-2.5 sm:mb-4 sm:gap-3"
            >
              <BrandHybridMark size="md" className="h-9 w-9 shadow-md sm:h-11 sm:w-11" />
              <CmsStyledText
                value={copy.badge}
                as="span"
                className="max-w-full truncate rounded-full border border-kado-red/25 bg-kado-offwhite/80 px-3 py-1 kado-label"
                defaultColorClass="text-kado-red"
                {...cmsTextProps(cmsEditMode, 'featured.badge', 'Badge', (v) => updateFeatured({ badge: v }))}
              />
            </TimelineContent>

            <TimelineContent
              as="h2"
              id="featured-coffees-heading"
              animationNum={1}
              timelineRef={sectionRef}
              className="kado-h2 text-kado-dark"
            >
              <CmsStyledText
                value={copy.title}
                as="span"
                className="kado-h2 text-kado-dark"
                {...cmsTextProps(cmsEditMode, 'featured.title', 'Title', (v) => updateFeatured({ title: v }))}
              />
            </TimelineContent>

            <TimelineContent
              as="p"
              animationNum={2}
              timelineRef={sectionRef}
              className="mt-3 max-w-xl kado-body text-kado-dark/70 sm:mt-4"
            >
              <span className="hidden md:inline">
                <CmsStyledText
                  value={copy.subtitleDesktop}
                  as="span"
                  {...cmsTextProps(cmsEditMode, 'featured.subtitleDesktop', 'Subtitle (desktop)', (v) =>
                    updateFeatured({ subtitleDesktop: v }),
                  )}
                />
              </span>
              <span className="md:hidden">
                <CmsStyledText
                  value={copy.subtitleMobile}
                  as="span"
                  {...cmsTextProps(cmsEditMode, 'featured.subtitleMobile', 'Subtitle (mobile)', (v) =>
                    updateFeatured({ subtitleMobile: v }),
                  )}
                />
              </span>
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
              <CmsStyledText
                value={copy.shopCtaLabel || 'View Shop'}
                as="span"
                {...cmsTextProps(cmsEditMode, 'featured.shopCtaLabel', 'Shop CTA', (v) =>
                  updateFeatured({ shopCtaLabel: v }),
                )}
              />
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
            <Link
              to="/menu"
              className="inline-flex h-11 w-full min-h-[44px] items-center justify-center gap-2 rounded-full border border-kado-dark/15 bg-kado-offwhite/90 px-5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-kado-dark transition-colors hover:border-kado-red/40 hover:text-kado-red sm:h-12 sm:w-auto sm:px-6 sm:text-xs sm:tracking-[0.14em]"
            >
              <CmsStyledText
                value={copy.menuCtaLabel}
                as="span"
                {...cmsTextProps(cmsEditMode, 'featured.menuCtaLabel', 'Menu CTA', (v) =>
                  updateFeatured({ menuCtaLabel: v }),
                )}
              />
            </Link>
          </TimelineContent>
        </div>

        <div className="mt-8 min-w-0 md:mt-10">
          <div className="relative lg:hidden">
            {!menuReady ? (
              <div className="flex gap-3 overflow-hidden">
                <div className="aspect-[3/4] w-[min(85vw,20rem)] shrink-0 animate-pulse rounded-2xl bg-kado-dark/10" />
                <div className="aspect-[4/5] w-[min(72vw,17rem)] shrink-0 animate-pulse rounded-2xl bg-kado-dark/10" />
              </div>
            ) : showcaseDrinks.length === 0 ? (
              <p className="rounded-2xl border border-kado-dark/10 bg-kado-offwhite/80 px-5 py-6 kado-body text-kado-dark/60 sm:px-6 sm:py-8">
                No coffee items are available on the menu yet. Add products in Admin → Menu, then select
                them in Homepage content.
              </p>
            ) : (
              <div
                className="scrollbar-hide -mx-[max(1rem,env(safe-area-inset-left))] flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-[max(1rem,env(safe-area-inset-left))] pb-2 scroll-pl-[max(1rem,env(safe-area-inset-left))] scroll-pr-10 touch-pan-x"
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
                      imageOverride={copy.cardImageOverrides[i]}
                      cmsEditMode={cmsEditMode}
                      cardIndex={i}
                      onImageOverride={(url) => setCardImage(i, url)}
                      sectionRef={sectionRef}
                      onSelect={setSelectedProduct}
                      orderHint={orderHint}
                    />
                  </div>
                ))}
              </div>
            )}
            {/* Reserved row — prevents CLS 0.29 when “Swipe for more” mounts after menu hydrate */}
            <div className="mt-4 flex h-5 items-center justify-center gap-1.5" aria-hidden={showcaseDrinks.length <= 1}>
              {menuReady && showcaseDrinks.length > 1 ? (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-kado-dark/35" aria-hidden />
                  <p className="kado-subtext font-semibold uppercase tracking-[0.18em] text-kado-dark/55">
                    Swipe for more
                  </p>
                </>
              ) : null}
            </div>
          </div>

          {!menuReady ? (
            <div className="hidden lg:grid lg:grid-cols-12 lg:grid-rows-2 lg:gap-5">
              <div className="aspect-[3/4] w-[min(85vw,20rem)] shrink-0 animate-pulse rounded-2xl bg-kado-dark/10 lg:col-span-7 lg:row-span-2 lg:aspect-auto lg:min-h-[22rem] lg:w-auto" />
              <div className="aspect-[4/5] w-[min(72vw,17rem)] shrink-0 animate-pulse rounded-2xl bg-kado-dark/10 lg:col-span-5 lg:aspect-auto lg:min-h-[16rem] lg:w-auto" />
              <div className="hidden aspect-[4/5] w-[min(72vw,17rem)] shrink-0 animate-pulse rounded-2xl bg-kado-dark/10 sm:block lg:col-span-5 lg:aspect-auto lg:min-h-[16rem] lg:w-auto" />
            </div>
          ) : showcaseDrinks.length === 0 ? (
            <p className="hidden rounded-2xl border border-kado-dark/10 bg-kado-offwhite/80 px-5 py-6 kado-body text-kado-dark/60 lg:block sm:px-6 sm:py-8">
              No coffee items are available on the menu yet. Add products in Admin → Menu, then select
              them in Homepage content.
            </p>
          ) : (
            <>
              {/* Desktop: bento grid */}
              <div className="hidden lg:grid lg:grid-cols-12 lg:grid-rows-2 lg:gap-5 lg:min-h-[28rem]">
                {showcaseDrinks[0] && (
                  <div className="lg:col-span-7 lg:row-span-2">
                    <DrinkCard
                      drink={showcaseDrinks[0]}
                      categoryLabel={categoryById.get(showcaseDrinks[0].categoryId) ?? 'Coffee'}
                      index={0}
                      hero
                      imageOverride={copy.cardImageOverrides[0]}
                      cmsEditMode={cmsEditMode}
                      cardIndex={0}
                      onImageOverride={(url) => setCardImage(0, url)}
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
                      imageOverride={copy.cardImageOverrides[i + 1]}
                      cmsEditMode={cmsEditMode}
                      cardIndex={i + 1}
                      onImageOverride={(url) => setCardImage(i + 1, url)}
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
