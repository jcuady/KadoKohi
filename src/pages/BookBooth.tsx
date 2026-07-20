import { useEffect, useMemo, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import BookingSteps from '../components/booking/BookingSteps';
import BookingShowcaseSection from '../components/booking/BookingShowcaseSection';
import BookingWizard, { type BookingWizardStage } from '../components/booking/BookingWizard';
import CollagePageHero from '../components/seo/CollagePageHero';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import { useBoothShowcaseStore } from '../store/boothShowcaseStore';
import { useMatchaShowcaseStore } from '../store/matchaShowcaseStore';
import { useBoothCatalogStore } from '../store/boothCatalogStore';
import { boothChipKey } from '../lib/boothPageContent';
import { cmsTextPlain } from '../lib/cmsTypography';
import { BOOKING_PAGE_LABELS, type BookingPageKind } from '../lib/bookingPageKinds';
import {
  COFFEE_CART_HERO_POLAROIDS,
  COFFEE_CART_HERO_STICKERS,
  MATCHA_BAR_HERO_POLAROIDS,
  MATCHA_BAR_HERO_STICKERS,
} from '../data/collageHeroMedia';

type Props = { kind?: BookingPageKind };

export default function BookBoothPage({ kind = 'coffee-cart' }: Props) {
  const isMatcha = kind === 'matcha-bar';
  const coffeeMedia = useBoothShowcaseStore((s) => s.media);
  const coffeePageCopy = useBoothShowcaseStore((s) => s.pageCopy);
  const hydrateCoffee = useBoothShowcaseStore((s) => s.hydrateFromRemote);
  const matchaMedia = useMatchaShowcaseStore((s) => s.media);
  const matchaPageCopy = useMatchaShowcaseStore((s) => s.pageCopy);
  const hydrateMatcha = useMatchaShowcaseStore((s) => s.hydrateFromRemote);
  const hydrateCatalog = useBoothCatalogStore((s) => s.hydrateFromRemote);
  const [, setWizardStage] = useState<BookingWizardStage>('form');

  const pageCopy = isMatcha ? matchaPageCopy : coffeePageCopy;
  const showcaseMediaRaw = isMatcha ? matchaMedia : coffeeMedia;

  useEffect(() => {
    void hydrateCatalog();
    if (isMatcha) void hydrateMatcha();
    else void hydrateCoffee();
  }, [hydrateCatalog, hydrateCoffee, hydrateMatcha, isMatcha]);

  const showcaseMedia = useMemo(
    () =>
      [...showcaseMediaRaw]
        .filter((item) => item.visible)
        .sort((a, b) => a.order - b.order),
    [showcaseMediaRaw],
  );

  const eyebrow = cmsTextPlain(pageCopy.heroEyebrow);
  const title = [cmsTextPlain(pageCopy.heroTitleLine1), cmsTextPlain(pageCopy.heroTitleLine2)]
    .filter(Boolean)
    .join(' ');
  const description = cmsTextPlain(pageCopy.heroDescription);
  const ctaLabel = cmsTextPlain(pageCopy.heroCtaLabel) || 'Submit a proposal';

  return (
    <div className="w-full min-h-screen bg-kado-cream">
      {isMatcha ? <p className="sr-only">{BOOKING_PAGE_LABELS[kind]}</p> : null}

      <CollagePageHero
        titleId={isMatcha ? 'matcha-bar-page-title' : 'coffee-cart-page-title'}
        eyebrow={eyebrow || (isMatcha ? 'Matcha Bar Experiences' : 'Events & Celebrations')}
        title={title || (isMatcha ? 'Premium Matcha, Your Event.' : 'Your Moment, Our Space.')}
        description={description}
        polaroids={isMatcha ? MATCHA_BAR_HERO_POLAROIDS : COFFEE_CART_HERO_POLAROIDS}
        stickers={isMatcha ? MATCHA_BAR_HERO_STICKERS : COFFEE_CART_HERO_STICKERS}
      >
        <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
          {pageCopy.chips.map((label, i) => {
            const plain = cmsTextPlain(label);
            if (!plain) return null;
            return (
              <span
                key={boothChipKey(label, i)}
                className="inline-flex items-center rounded-full border border-kado-red/20 bg-kado-offwhite px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-kado-red sm:text-xs"
              >
                {plain}
              </span>
            );
          })}
        </div>
        <a
          href="#booking-form"
          className="inline-flex min-h-[52px] items-center gap-2.5 rounded-sm bg-kado-red px-8 text-xs font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-kado-red-hover"
        >
          {ctaLabel} <ArrowDown className="h-4 w-4 shrink-0" aria-hidden />
        </a>
      </CollagePageHero>

      <BookingShowcaseSection kind={kind} media={showcaseMedia} />

      <BookingSteps
        eyebrow={pageCopy.howItWorksEyebrow}
        title={pageCopy.howItWorksTitle}
        steps={pageCopy.howItWorksSteps}
      />
      <BookingWizard onStageChange={setWizardStage} bookingKind={kind} />
      <PageSeoBlurb />
    </div>
  );
}
