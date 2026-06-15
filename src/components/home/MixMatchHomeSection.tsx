import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Percent, ShoppingBag } from 'lucide-react';
import { useMenuStore } from '../../store/menuStore';
import type { MixMatchSectionCopy } from '../../store/landingContentStore';
import {
  collabPastries,
  findFeaturedPastry,
  findPastriesCategory,
  pastryHasPrice,
} from '../../lib/pastriesCategory';
import { formatPhp } from '../../lib/money';
import { getMenuProductImageUrl } from '../../lib/menuCatalog';
import { isProductInStock } from '../../lib/productStock';
import ProductDetailDrawer from '../ProductDetailDrawer';
import MixMatchBundlePicker from '../mix-match/MixMatchBundlePicker';
import type { Product } from '../../types/domain';
import { PASTRIES_PAGE, MIX_MATCH_BLUE } from '../../content/pastriesPage';
import CmsStyledText from '../cms/CmsStyledText';
import { cmsTextPlain } from '../../lib/cmsTypography';

interface Props {
  copy?: MixMatchSectionCopy;
}

export default function MixMatchHomeSection({ copy }: Props) {
  const categories = useMenuStore((s) => s.categories);
  const products = useMenuStore((s) => s.products);
  const hydrateFromRemote = useMenuStore((s) => s.hydrateFromRemote);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

  const pastriesCategory = useMemo(() => findPastriesCategory(categories), [categories]);
  const collabs = useMemo(() => collabPastries(categories, products), [categories, products]);
  const featured = useMemo(
    () => findFeaturedPastry(collabs, copy?.featuredProductId),
    [collabs, copy?.featuredProductId],
  );

  const badge = copy?.badge ?? PASTRIES_PAGE.hero.eyebrow;
  const titleTop = copy?.titleTop ?? PASTRIES_PAGE.hero.headlineTop;
  const titleBottom = copy?.titleBottom ?? PASTRIES_PAGE.hero.headlineBottom;
  const description = copy?.description ?? PASTRIES_PAGE.hero.subhead;
  const offerBadge = copy?.offerBadge ?? PASTRIES_PAGE.hero.badge;
  const offerNote = copy?.offerNote ?? PASTRIES_PAGE.hero.badgeNote;
  const posterImage = copy?.posterImageUrl?.trim() || PASTRIES_PAGE.poster.primaryImage;
  const ctaLabel = copy?.ctaLabel ?? 'View full Mix & Match menu';
  const featuredCtaLabel = copy?.featuredCtaLabel ?? 'Order Kado Kukilatte';
  const offerNotePlain = cmsTextPlain(offerNote);

  const featuredInStock = featured ? isProductInStock(featured) : false;
  const canOrderFeatured = featured && pastryHasPrice(featured) && featuredInStock;

  const titleTopColor =
    typeof titleTop === 'object' && titleTop.color && titleTop.color !== 'inherit' ? undefined : MIX_MATCH_BLUE;

  return (
    <section className="overflow-x-hidden border-y border-kado-dark/10 bg-kado-offwhite px-4 py-12 sm:px-6 sm:py-16 md:px-12 lg:px-24 lg:py-20">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="mb-8 grid items-center gap-6 sm:mb-10 sm:gap-8 lg:grid-cols-[1fr_0.85fr]">
          <div className="min-w-0 text-center lg:text-left">
            <CmsStyledText value={badge} as="p" className="kado-label mb-2 text-kado-red sm:mb-3" />
            <h2 className="text-balance font-display text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-4xl md:text-5xl">
              <CmsStyledText
                value={titleTop}
                as="span"
                style={titleTopColor ? { color: titleTopColor } : undefined}
              />
              <br />
              <CmsStyledText value={titleBottom} as="span" defaultColorClass="text-kado-red" />
            </h2>
            <CmsStyledText
              value={description}
              as="p"
              className="mx-auto mt-3 max-w-md sm:mt-4 lg:mx-0"
              defaultSizeClass="kado-body"
              defaultColorClass="text-kado-dark/70"
            />
            <span
              className="mt-4 inline-flex w-full max-w-xs flex-col items-center justify-center gap-1 rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg sm:mt-5 sm:w-auto sm:px-5 sm:text-xs"
              style={{ backgroundColor: MIX_MATCH_BLUE }}
            >
              <span className="inline-flex items-center gap-2">
                <Percent className="h-4 w-4 shrink-0" aria-hidden />
                <CmsStyledText value={offerBadge} as="span" />
              </span>
              {offerNotePlain ? (
                <CmsStyledText
                  value={offerNote}
                  as="span"
                  className="text-[9px] font-semibold normal-case tracking-normal opacity-90"
                  defaultSizeClass="kado-subtext"
                />
              ) : null}
            </span>
          </div>
          <img
            src={posterImage}
            alt="Kukidō x Kado Kohi Mix and Match"
            className="mx-auto w-full max-w-md rounded-[1rem] border border-kado-dark/10 shadow-lg sm:max-w-none sm:rounded-[1.25rem] lg:mx-0"
            loading="lazy"
            decoding="async"
          />
        </div>

        <MixMatchBundlePicker
          categories={categories}
          products={products}
          pastriesCategoryId={pastriesCategory?.id}
          bundleNote={offerNotePlain}
        />

        {featured ? (
          <article className="mt-8 flex flex-col gap-4 overflow-hidden rounded-[1.25rem] border border-kado-dark/10 bg-white p-4 shadow-lg sm:mt-10 sm:flex-row sm:items-center sm:p-5">
            <img
              src={getMenuProductImageUrl(featured, { pastriesCategoryId: pastriesCategory?.id })}
              alt={featured.name}
              className="mx-auto h-32 w-full max-w-[200px] shrink-0 rounded-xl object-cover sm:mx-0 sm:h-28 sm:w-28"
              loading="lazy"
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="kado-label text-kado-red">Takeover exclusive</p>
              <h3 className="kado-h3 text-kado-dark">{featured.name}</h3>
              {featured.description ? (
                <p className="mt-1 kado-body-sm text-kado-dark/65 line-clamp-3 sm:line-clamp-2">{featured.description}</p>
              ) : null}
            </div>
            <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
              {pastryHasPrice(featured) ? (
                <span className="kado-h3 text-center text-kado-dark sm:text-right">{formatPhp(featured.basePrice)}</span>
              ) : null}
              {canOrderFeatured ? (
                <button
                  type="button"
                  onClick={() => setSelected(featured)}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-kado-red px-5 kado-label text-kado-cream touch-manipulation hover:bg-kado-dark sm:w-auto"
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  <CmsStyledText value={featuredCtaLabel} as="span" className="truncate" />
                </button>
              ) : null}
            </div>
          </article>
        ) : null}

        <Link
          to="/pastries"
          className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-kado-dark/15 px-5 kado-label text-kado-dark touch-manipulation hover:border-kado-red hover:text-kado-red sm:mt-8 sm:inline-flex sm:w-auto"
        >
          <CmsStyledText value={ctaLabel} as="span" />
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
      </div>

      <ProductDetailDrawer
        product={selected}
        categoryName={pastriesCategory?.name ?? 'Pastries'}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
