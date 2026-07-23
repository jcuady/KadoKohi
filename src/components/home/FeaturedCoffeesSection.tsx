/**
 * Signature Sips — homepage section 2.
 * Layout mirrors Figma strictly: cream stage, thick red frame, red price bar.
 */
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import type { Variants } from 'motion/react';
import ProductDetailDrawer from '../ProductDetailDrawer';
import { TimelineContent } from '../ui/timeline-animation';
import { useMenuStore } from '../../store/menuStore';
import type { Product } from '../../types/domain';
import type { FeaturedCopy } from '../../store/landingContentStore';
import CmsStyledText from '../cms/CmsStyledText';
import CmsEditableImage from '../cms/CmsEditableImage';
import { formatPhp } from '../../lib/money';
import { cmsTextProps } from '../../lib/cmsFieldBind';
import { useLandingContentStore } from '../../store/landingContentStore';
import ResilientImage from '../ui/ResilientImage';
import BrandHybridMark from '../BrandHybridMark';
import { discountedBasePrice, productPromoTag } from '../../lib/productPricing';
import {
  getMenuProductImageUrl,
  listVisibleCoffeeProducts,
  pickFeaturedCoffeeProducts,
} from '../../lib/menuCatalog';

const cardReveal: Variants = {
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
  hidden: { opacity: 0, y: 24 },
};

/** Figma cards always lead with iced presentation; promo still wins when on sale. */
function cardBadge(drink: Product): string {
  const promo = productPromoTag(drink);
  if (promo) return promo.toUpperCase();
  return 'ICED-ONLY';
}

function drinkBlurb(drink: Product): string {
  if (drink.description?.trim()) return drink.description;
  return 'Served iced — crisp and refreshing.';
}

/** Local cutout fallbacks for Signature Sips — matches Figma product cards. */
const FEATURED_CUTOUT_BY_ID: Partial<Record<string, string>> = {
  prod_matcha_straw: '/featured/matcha-strawberry.webp',
  prod_dirty_matcha: '/featured/dirty-matcha-oat.webp',
  prod_matcha_oat: '/featured/matcha-oat.webp',
};

function featuredDrinkImage(drink: Product, override?: string, cmsEditMode?: boolean): string {
  const localCutout = FEATURED_CUTOUT_BY_ID[drink.id];
  const fromOverride = override?.trim();
  // Public homepage: always prefer local WebP cutouts (PSI: avoid 1200px Supabase JPGs).
  if (!cmsEditMode && localCutout) return localCutout;
  if (fromOverride) return fromOverride;
  if (localCutout) return localCutout;
  return getMenuProductImageUrl(drink);
}

/** Display name shortened to match Figma labels where DB uses the long oat title. */
function displayName(drink: Product): string {
  if (drink.id === 'prod_matcha_straw') return 'Matcha Strawberry Latte';
  return drink.name;
}

type CardProps = {
  drink: Product;
  index: number;
  imageOverride?: string;
  cmsEditMode?: boolean;
  cardIndex?: number;
  onImageOverride?: (url: string) => void;
  sectionRef: RefObject<HTMLElement | null>;
  onSelect: (p: Product) => void;
};

function DrinkCard({
  drink,
  index,
  imageOverride,
  cmsEditMode,
  cardIndex,
  onImageOverride,
  sectionRef,
  onSelect,
}: CardProps) {
  const image = featuredDrinkImage(drink, imageOverride, cmsEditMode);
  const promo = productPromoTag(drink);
  const name = displayName(drink);
  const price = formatPhp(discountedBasePrice(drink));

  const imageClassName =
    'h-full w-full max-w-none object-contain object-bottom drop-shadow-[0_20px_28px_rgba(25,25,25,0.28)] transition-transform duration-500 ease-out group-hover:scale-[1.04]';

  return (
    <TimelineContent
      as="button"
      type="button"
      animationNum={index + 4}
      timelineRef={sectionRef}
      customVariants={cardReveal}
      onClick={() => onSelect(drink)}
      aria-label={`${name}, ${price}. Add to cart`}
      className={[
        'group flex w-full touch-manipulation flex-col overflow-hidden text-left',
        'rounded-[1.75rem] border-[7px] border-kado-red bg-kado-cream',
        'transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.99]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2 focus-visible:ring-offset-kado-cream',
      ].join(' ')}
    >
      {/* Cream product stage — drink fills frame (Figma reference) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-kado-cream">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-2 top-[15%] z-[1] select-none text-center font-display text-[clamp(1.65rem,6.8vw,2.75rem)] font-black uppercase leading-none tracking-[0.08em] text-kado-dark/[0.08]"
        >
          KADO KŌHĪ
        </span>

        <div className="absolute inset-x-0 bottom-[19%] top-[6%] z-[2] flex items-end justify-center px-1 sm:px-2">
          {cmsEditMode && cardIndex !== undefined && onImageOverride ? (
            <CmsEditableImage
              cmsField={`featured.card.${cardIndex}.image`}
              cmsLabel={`Featured card ${cardIndex + 1} image`}
              src={image}
              alt={name}
              className={imageClassName}
              onImageChange={onImageOverride}
            />
          ) : (
            <ResilientImage
              src={image}
              fallbackSrc={FEATURED_CUTOUT_BY_ID[drink.id]}
              alt={name}
              className={imageClassName}
              loading="lazy"
              width={528}
              height={704}
              sizes="(max-width: 640px) 85vw, (max-width: 1024px) 40vw, 280px"
              displayWidth={560}
            />
          )}
        </div>

        <span className="absolute left-3.5 top-3.5 z-20 rounded-full bg-kado-red px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.16em] text-kado-cream sm:left-4 sm:top-4 sm:text-[10px]">
          {cardBadge(drink)}
        </span>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[46%] bg-gradient-to-t from-kado-dark/92 via-kado-dark/50 to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 z-[4] px-4 pb-4 sm:px-5 sm:pb-5">
          <h3 className="font-display text-[1.05rem] font-bold leading-tight tracking-tight text-white sm:text-[1.2rem]">
            {name}
          </h3>
          <p className="mt-1 line-clamp-2 font-sans text-[0.78rem] leading-snug text-white/88 sm:text-[0.85rem]">
            {drinkBlurb(drink)}
          </p>
        </div>
      </div>

      {/* Solid red price bar — Figma frame footer */}
      <div className="flex items-center justify-between gap-2.5 bg-kado-red px-4 py-3.5 sm:gap-3 sm:px-5 sm:py-4">
        <span className="flex flex-col leading-none">
          {promo ? (
            <span className="mb-1 text-[10px] font-semibold text-kado-cream/55 line-through">
              {formatPhp(drink.basePrice).replace('₱', '₱ ')}
            </span>
          ) : null}
          <span className="font-display text-[1.35rem] font-bold tracking-tight text-white sm:text-[1.55rem]">
            {price.replace('₱', '₱ ')}
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-kado-cream px-3 py-2.5 font-sans text-[9px] font-bold uppercase tracking-[0.1em] text-kado-red transition-colors group-hover:bg-kado-offwhite sm:px-4 sm:py-3 sm:text-[10px]">
          <Plus className="h-3.5 w-3.5 shrink-0 stroke-[3]" aria-hidden />
          Add to cart
        </span>
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

  return (
    <section
      ref={sectionRef}
      aria-labelledby="featured-coffees-heading"
      className="landing-section relative w-full overflow-x-clip bg-kado-cream"
    >
      {/* Faint tan kanji — matching Figma atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-2 top-4 select-none font-display text-[clamp(8rem,22vw,17rem)] font-black leading-none text-[#CDB892]/35 sm:right-4 sm:top-2"
      >
        角
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-4 bottom-6 select-none font-display text-[clamp(6rem,16vw,13rem)] font-black leading-none text-[#CDB892]/28 sm:left-0 sm:bottom-10"
      >
        角
      </div>

      <div className="relative mx-auto max-w-[1400px] min-w-0 px-[max(0px,env(safe-area-inset-left))] pr-[max(0px,env(safe-area-inset-right))]">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="min-w-0 max-w-2xl">
            <TimelineContent
              as="div"
              animationNum={0}
              timelineRef={sectionRef}
              className="mb-3 flex flex-wrap items-center gap-2.5 sm:mb-4 sm:gap-3"
            >
              <BrandHybridMark size="md" className="h-9 w-9 sm:h-10 sm:w-10" />
              <CmsStyledText
                value={copy.badge}
                as="span"
                className="max-w-full truncate rounded-full border border-kado-red bg-transparent px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.16em]"
                defaultColorClass="text-kado-red"
                {...cmsTextProps(cmsEditMode, 'featured.badge', 'Badge', (v) => updateFeatured({ badge: v }))}
              />
            </TimelineContent>

            <TimelineContent
              as="h2"
              id="featured-coffees-heading"
              animationNum={1}
              timelineRef={sectionRef}
              className="font-sans text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-kado-dark"
            >
              <CmsStyledText
                value={copy.title}
                as="span"
                className="font-sans text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-kado-dark"
                {...cmsTextProps(cmsEditMode, 'featured.title', 'Title', (v) => updateFeatured({ title: v }))}
              />
            </TimelineContent>

            <TimelineContent
              as="p"
              animationNum={2}
              timelineRef={sectionRef}
              className="mt-3 max-w-xl font-sans text-[0.95rem] leading-relaxed text-kado-dark/75 sm:mt-3.5 sm:text-base"
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
            className="flex w-full min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3 lg:w-auto lg:shrink-0"
          >
            <Link
              to={copy.shopCtaPath || '/menu'}
              className="inline-flex h-11 w-full min-h-[44px] items-center justify-center rounded-full bg-kado-red px-6 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-kado-cream transition-transform hover:scale-[1.02] active:scale-[0.98] sm:h-12 sm:w-auto"
            >
              <CmsStyledText
                value={copy.shopCtaLabel || 'View Shop'}
                as="span"
                {...cmsTextProps(cmsEditMode, 'featured.shopCtaLabel', 'Shop CTA', (v) =>
                  updateFeatured({ shopCtaLabel: v }),
                )}
              />
            </Link>
            <Link
              to="/menu"
              className="inline-flex h-11 w-full min-h-[44px] items-center justify-center rounded-full border border-kado-dark bg-white px-6 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-kado-dark transition-colors hover:border-kado-red hover:text-kado-red sm:h-12 sm:w-auto"
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

        <div className="mt-9 min-w-0 md:mt-11">
          <div className="relative lg:hidden">
            {!menuReady ? (
              <div className="flex gap-3 overflow-hidden">
                <div className="aspect-[3/4] w-[min(78vw,18rem)] shrink-0 animate-pulse rounded-[1.75rem] border-[7px] border-kado-red/35 bg-kado-cream" />
                <div className="aspect-[3/4] w-[min(72vw,16rem)] shrink-0 animate-pulse rounded-[1.75rem] border-[7px] border-kado-red/35 bg-kado-cream" />
              </div>
            ) : showcaseDrinks.length === 0 ? (
              <p className="rounded-2xl border border-kado-dark/10 bg-kado-offwhite/80 px-5 py-6 font-sans text-kado-dark/60 sm:px-6 sm:py-8">
                No coffee items are available on the menu yet. Add products in Admin → Menu, then select
                them in Homepage content.
              </p>
            ) : (
              <div
                className="scrollbar-hide -mx-[max(1rem,env(safe-area-inset-left))] flex snap-x snap-mandatory gap-3.5 overflow-x-auto overscroll-x-contain scroll-smooth px-[max(1rem,env(safe-area-inset-left))] pb-2 scroll-pl-[max(1rem,env(safe-area-inset-left))] scroll-pr-10 touch-pan-x"
                aria-label="Featured drinks carousel"
              >
                {showcaseDrinks.map((drink, i) => (
                  <div key={drink.id} className="w-[min(78vw,18rem)] shrink-0 snap-center">
                    <DrinkCard
                      drink={drink}
                      index={i}
                      imageOverride={copy.cardImageOverrides[i]}
                      cmsEditMode={cmsEditMode}
                      cardIndex={i}
                      onImageOverride={(url) => setCardImage(i, url)}
                      sectionRef={sectionRef}
                      onSelect={setSelectedProduct}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex h-5 items-center justify-center gap-1.5" aria-hidden={showcaseDrinks.length <= 1}>
              {menuReady && showcaseDrinks.length > 1 ? (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-kado-dark/35" aria-hidden />
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-kado-dark/70">
                    Swipe for more
                  </p>
                </>
              ) : null}
            </div>
          </div>

          {!menuReady ? (
            <div className="hidden gap-5 lg:grid lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-[1.75rem] border-[7px] border-kado-red/35 bg-kado-cream"
                />
              ))}
            </div>
          ) : showcaseDrinks.length === 0 ? (
            <p className="hidden rounded-2xl border border-kado-dark/10 bg-kado-offwhite/80 px-5 py-6 font-sans text-kado-dark/60 lg:block sm:px-6 sm:py-8">
              No coffee items are available on the menu yet. Add products in Admin → Menu, then select
              them in Homepage content.
            </p>
          ) : (
            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-5 xl:gap-6">
              {showcaseDrinks.map((drink, i) => (
                <div key={drink.id}>
                  <DrinkCard
                    drink={drink}
                    index={i}
                    imageOverride={copy.cardImageOverrides[i]}
                    cmsEditMode={cmsEditMode}
                    cardIndex={i}
                    onImageOverride={(url) => setCardImage(i, url)}
                    sectionRef={sectionRef}
                    onSelect={setSelectedProduct}
                  />
                </div>
              ))}
            </div>
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
