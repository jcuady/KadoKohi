import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Star } from 'lucide-react';
import {
  SEO_HOME_BODY_PARAGRAPHS,
  SEO_HOME_BODY_VISIBLE,
  SEO_HOME_H1,
  SEO_INTERNAL_LINKS,
  SEO_SIGNATURE_DRINKS,
  SEO_SOCIAL,
} from '../../content/seo';
import { KADO_GOOGLE_LISTING } from '../../content/kadoGoogleReviews';

const MENU_PILLARS = [
  {
    id: 'matcha-hojicha',
    title: 'Matcha & hojicha',
    subtitle: 'Best matcha in Marikina',
    image: '/social/matcha-series.png',
    imageAlt: 'Kado Coffee matcha and hojicha drinks in Marikina',
    drinks: SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Matcha & Hojicha'),
  },
  {
    id: 'signatures',
    title: 'Signature lattes',
    subtitle: 'Torched muscovado & more',
    image: '/social/coffee-series.png',
    imageAlt: 'Kado Coffee signature lattes including KADO Latte',
    drinks: SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Signatures'),
  },
  {
    id: 'classics-yuzu',
    title: 'Classics & yuzu',
    subtitle: 'Hot, iced, or oat milk',
    image: '/social/cafe-latte.png',
    imageAlt: 'Classic lattes and yuzu sodas at Kado Kohi',
    drinks: SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Classics' || d.category === 'Yuzu'),
  },
] as const;

const accent = 'text-kado-red';

const sectionPad =
  'px-[max(1rem,env(safe-area-inset-left))] sm:px-6 md:px-12 lg:px-24 py-12 sm:py-16 md:py-20 lg:py-24 [@media(orientation:landscape)_and_(max-height:30rem)]:py-8';

const pillarCard =
  'group relative flex min-h-[240px] flex-col overflow-hidden rounded-[1.25rem] border border-kado-dark/8 bg-kado-dark sm:min-h-[280px] lg:min-h-[340px] [@media(orientation:landscape)_and_(max-height:30rem)]:min-h-[200px]';

/**
 * Homepage menu SEO — editorial layout; full crawl copy in sr-only.
 */
export default function HomePageSeoSection() {
  const { rating, reviewCount } = KADO_GOOGLE_LISTING;

  return (
    <section
      aria-labelledby="home-menu-seo-heading"
      className={`customer-menu-page border-t border-kado-dark/6 bg-kado-offwhite ${sectionPad}`}
    >
      <div className="mx-auto max-w-6xl min-w-0 pr-[max(0px,env(safe-area-inset-right))]">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-kado-red sm:mb-5">
          Sta. Elena · Marikina
        </p>

        <h2
          id="home-menu-seo-heading"
          className="max-w-4xl font-display text-[clamp(1.5rem,4.5vw,2.75rem)] font-bold leading-[1.16] tracking-tight text-kado-dark [@media(orientation:landscape)_and_(max-height:30rem)]:text-[clamp(1.35rem,4vw,2rem)]"
        >
          the cup <span className={accent}>behind every</span> corner —{' '}
          <span className="sr-only">{SEO_HOME_H1}. </span>
          best matcha in Marikina, crafted <span className={accent}>with care</span>, brewed by heart.
        </h2>

        <div className="mt-6 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
          <div className="inline-flex w-full min-w-0 items-center gap-2 rounded-2xl border border-kado-dark/8 bg-white/90 px-4 py-2.5 text-sm font-medium text-kado-dark shadow-sm backdrop-blur-sm sm:w-auto">
            <Star className="h-4 w-4 shrink-0 fill-kado-red text-kado-red" aria-hidden />
            <span className="truncate">{rating}★ · {reviewCount} Google reviews</span>
          </div>
          <div className="inline-flex w-full min-w-0 items-center gap-2 rounded-2xl border border-kado-dark/8 bg-white/90 px-4 py-2.5 text-sm font-medium text-kado-dark shadow-sm backdrop-blur-sm sm:w-auto">
            <MapPin className="h-4 w-4 shrink-0 text-kado-red" aria-hidden />
            <span className="truncate">Coffee near me · Sta. Elena</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 [@media(orientation:landscape)_and_(max-height:30rem)]:grid-cols-3 [@media(orientation:landscape)_and_(max-height:30rem)]:gap-3">
          {MENU_PILLARS.map((pillar) => (
            <article key={pillar.id} className={pillarCard}>
              <img
                src={pillar.image}
                alt={pillar.imageAlt}
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-kado-dark via-kado-dark/55 to-kado-dark/15" />
              <div className="relative mt-auto flex flex-col p-4 sm:p-5 lg:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-kado-cream/65">
                  {pillar.subtitle}
                </p>
                <h3 className="mt-1 font-display text-lg font-bold text-kado-cream sm:text-xl lg:text-2xl">
                  {pillar.title}
                </h3>
                <ul className="mt-2 space-y-1 border-t border-white/10 pt-2 sm:mt-3 sm:space-y-1.5 sm:pt-3">
                  {pillar.drinks.map((drink) => (
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
          {SEO_HOME_BODY_VISIBLE.map((paragraph) => (
            <p
              key={paragraph.slice(0, 40)}
              className="font-sans text-[0.9375rem] leading-[1.7] text-kado-dark/70 sm:text-base sm:leading-[1.75]"
            >
              {paragraph}
            </p>
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
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-kado-dark/40">Explore</p>
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

        {/* Full SEO copy for crawlers — not shown visually */}
        <div className="sr-only">
          {SEO_HOME_BODY_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
