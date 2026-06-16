import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  SEO_HOME_BODY_PARAGRAPHS,
  SEO_HOME_H1,
  SEO_INTERNAL_LINKS,
  SEO_SOCIAL,
} from '../../content/seo';
import { KADO_GOOGLE_LISTING } from '../../content/kadoGoogleReviews';
import AccentHeadline from '../ui/AccentHeadline';
import ResilientImage from '../ui/ResilientImage';
import CmsEditableImage from '../cms/CmsEditableImage';
import { drinksForMenuSeoPillar } from '../../lib/menuSeoDrinks';
import type { MenuSeoCopy } from '../../store/landingContentStore';
import { useLandingContentStore } from '../../store/landingContentStore';
import CmsStyledText from '../cms/CmsStyledText';
import { cmsTextPlain } from '../../lib/cmsTypography';
import { cmsTextProps } from '../../lib/cmsFieldBind';

const sectionPad =
  'px-[max(1rem,env(safe-area-inset-left))] sm:px-6 md:px-12 lg:px-24 py-12 sm:py-16 md:py-20 lg:py-24 [@media(orientation:landscape)_and_(max-height:30rem)]:py-8';

const pillarCard =
  'group relative flex min-h-[220px] flex-col overflow-hidden rounded-[1.25rem] border border-kado-dark/8 bg-kado-dark sm:min-h-[260px] lg:min-h-[320px] [@media(orientation:landscape)_and_(max-height:30rem)]:min-h-[180px]';

type Props = { copy: MenuSeoCopy; cmsEditMode?: boolean };

/**
 * Homepage menu SEO — editorial layout; full crawl copy in sr-only.
 */
export default function HomePageSeoSection({ copy, cmsEditMode }: Props) {
  const updateMenuSeo = useLandingContentStore((s) => s.updateMenuSeo);
  const updateMenuSeoPillar = useLandingContentStore((s) => s.updateMenuSeoPillar);
  const { rating, reviewCount } = KADO_GOOGLE_LISTING;

  return (
    <section
      aria-labelledby="home-menu-seo-heading"
      className={`customer-menu-page border-t border-kado-dark/6 bg-kado-offwhite ${sectionPad}`}
    >
      <div className="mx-auto max-w-6xl min-w-0 pr-[max(0px,env(safe-area-inset-right))]">
        <CmsStyledText
          value={copy.locationBadge}
          as="p"
          className="mb-4 sm:mb-5"
          defaultSizeClass="kado-label"
          defaultColorClass="text-kado-red"
          {...cmsTextProps(cmsEditMode, 'menu-seo.locationBadge', 'Location badge', (v) =>
            updateMenuSeo({ locationBadge: v }),
          )}
        />

        <h2 id="home-menu-seo-heading" className="max-w-4xl kado-h2 text-kado-dark">
          <AccentHeadline
            copy={copy.headline}
            cmsEditMode={cmsEditMode}
            fieldPrefix="menu-seo.headline"
            onPartChange={(key, value) => updateMenuSeo({ headline: { ...copy.headline, [key]: value } })}
          />
          <span className="sr-only">{SEO_HOME_H1}. </span>
        </h2>

        <div className="mt-6 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
          <div className="inline-flex w-full min-w-0 items-center gap-2 rounded-2xl border border-kado-dark/8 bg-white/90 px-4 py-2.5 kado-body text-kado-dark shadow-sm backdrop-blur-sm sm:w-auto">
            <Star className="h-4 w-4 shrink-0 fill-kado-red text-kado-red" aria-hidden />
            <span className="truncate">
              {rating}★ · {reviewCount} Google reviews
            </span>
          </div>
          <div className="inline-flex w-full min-w-0 items-center gap-2 rounded-2xl border border-kado-dark/8 bg-white/90 px-4 py-2.5 kado-body text-kado-dark shadow-sm backdrop-blur-sm sm:w-auto">
            <MapPin className="h-4 w-4 shrink-0 text-kado-red" aria-hidden />
            <span className="truncate">
              <CmsStyledText
                value={copy.locationChipLabel}
                as="span"
                {...cmsTextProps(cmsEditMode, 'menu-seo.locationChipLabel', 'Location chip', (v) =>
                  updateMenuSeo({ locationChipLabel: v }),
                )}
              />
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 [@media(orientation:landscape)_and_(max-height:30rem)]:grid-cols-3 [@media(orientation:landscape)_and_(max-height:30rem)]:gap-3">
          {copy.pillars.map((pillar, pi) => (
            <article key={`${cmsTextPlain(pillar.title)}-${cmsTextPlain(pillar.subtitle)}`} className={pillarCard}>
              {cmsEditMode ? (
                <CmsEditableImage
                  cmsField={`menu-seo.pillar.${pi}.image`}
                  cmsLabel={`Pillar ${pi + 1} image`}
                  src={pillar.imageUrl}
                  alt={pillar.imageAlt}
                  className="absolute inset-0 z-0 h-full w-full cursor-pointer"
                  onImageChange={(url) => updateMenuSeoPillar(pi, { imageUrl: url })}
                />
              ) : (
                <Link
                  to="/menu"
                  className="absolute inset-0 z-0 block overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2"
                  aria-label={`Browse ${cmsTextPlain(pillar.title)} on the menu`}
                >
                  <ResilientImage
                    src={pillar.imageUrl}
                    alt={pillar.imageAlt}
                    className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>
              )}
              <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-t from-kado-dark via-kado-dark/55 to-kado-dark/15" />
              <div className={cn('relative z-[2] mt-auto flex flex-col p-4 sm:p-5 lg:p-6', 'pointer-events-auto')}>
                <CmsStyledText
                  value={pillar.subtitle}
                  as="p"
                  className="kado-label"
                  defaultColorClass="text-kado-cream/65"
                  {...cmsTextProps(cmsEditMode, `menu-seo.pillar.${pi}.subtitle`, `Pillar ${pi + 1} subtitle`, (v) =>
                    updateMenuSeoPillar(pi, { subtitle: v }),
                  )}
                />
                <CmsStyledText
                  value={pillar.title}
                  as="h3"
                  className="mt-1 kado-h3"
                  defaultColorClass="text-kado-cream"
                  {...cmsTextProps(cmsEditMode, `menu-seo.pillar.${pi}.title`, `Pillar ${pi + 1} title`, (v) =>
                    updateMenuSeoPillar(pi, { title: v }),
                  )}
                />
                <ul className="mt-2 space-y-1 border-t border-white/10 pt-2 sm:mt-3 sm:space-y-1.5 sm:pt-3">
                  {drinksForMenuSeoPillar(pillar.drinkCategoryKey).map((drink) => (
                    <li key={drink.name}>
                      <Link
                        to="/menu"
                        className="inline-flex max-w-full items-center gap-1 text-xs font-medium text-kado-cream/85 transition-colors hover:text-kado-cream sm:text-sm"
                      >
                        <span className="truncate">{drink.name}</span>
                        <ArrowUpRight className="h-3 w-3 shrink-0 opacity-60 sm:h-3.5 sm:w-3.5" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 max-w-3xl space-y-4 sm:mt-10">
          {copy.bodyParagraphs.map((paragraph, pi) => (
            <div key={cmsTextPlain(paragraph).slice(0, 40)}>
              <CmsStyledText
                value={paragraph}
                as="p"
                defaultSizeClass="kado-body"
                defaultColorClass="text-kado-dark/70"
                {...cmsTextProps(cmsEditMode, `menu-seo.body.${pi}`, `Body paragraph ${pi + 1}`, (v) => {
                  const next = [...copy.bodyParagraphs] as [typeof paragraph, typeof paragraph];
                  next[pi] = v;
                  updateMenuSeo({ bodyParagraphs: next });
                })}
              />
            </div>
          ))}
        </div>

        <p className="mt-5 max-w-3xl font-sans text-sm leading-relaxed text-kado-dark/65 sm:text-[0.9375rem]">
          <Link to="/menu" className="font-semibold text-kado-red underline-offset-4 hover:underline">
            Full menu
          </Link>
          {' · '}
          <Link to="/branches" className="font-semibold text-kado-red underline-offset-4 hover:underline">
            Hours &amp; directions
          </Link>
          {' · '}
          <a
            href={KADO_GOOGLE_LISTING.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-kado-red underline-offset-4 hover:underline"
          >
            Google Maps
          </a>
        </p>

        <nav
          aria-label="Kado Coffee site sections"
          className="mt-8 border-t border-kado-dark/8 pt-6 sm:mt-10 sm:pt-8"
        >
          <CmsStyledText
            value={copy.exploreHeading}
            as="p"
            className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em]"
            defaultColorClass="text-kado-dark/40"
            {...cmsTextProps(cmsEditMode, 'menu-seo.exploreHeading', 'Explore heading', (v) =>
              updateMenuSeo({ exploreHeading: v }),
            )}
          />
          <ul className="flex flex-wrap gap-2">
            {SEO_INTERNAL_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="inline-flex min-h-[40px] max-w-full items-center rounded-full border border-kado-dark/10 bg-white px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-kado-dark transition-colors hover:border-kado-red/30 hover:text-kado-red sm:px-4"
                >
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-semibold uppercase tracking-wider text-kado-dark/35">
          <a href={SEO_SOCIAL.instagram} target="_blank" rel="noopener noreferrer me" className="hover:text-kado-red">
            @kadocoffeeph
          </a>
          <a href={SEO_SOCIAL.facebook} target="_blank" rel="noopener noreferrer me" className="hover:text-kado-red">
            KadoKohi
          </a>
          <a href={SEO_SOCIAL.tiktok} target="_blank" rel="noopener noreferrer me" className="hover:text-kado-red">
            @kadokohiph
          </a>
          <a
            href={KADO_GOOGLE_LISTING.reviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-kado-red"
          >
            Google reviews
          </a>
        </p>

        <div className="sr-only">
          {SEO_HOME_BODY_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
