import { Link } from 'react-router-dom';
import {
  SEO_HOME_BODY_PARAGRAPHS,
  SEO_INTERNAL_LINKS,
  SEO_SIGNATURE_DRINKS,
} from '../../content/seo';

const DRINK_GROUPS = [
  {
    id: 'matcha-hojicha',
    title: 'Matcha & Hojicha',
    drinks: SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Matcha & Hojicha'),
  },
  {
    id: 'signatures',
    title: 'Signature Lattes',
    drinks: SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Signatures'),
  },
  {
    id: 'classics-yuzu',
    title: 'Classics & Yuzu',
    drinks: SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Classics' || d.category === 'Yuzu'),
  },
] as const;

export default function HomePageSeoSection() {
  return (
    <section
      aria-labelledby="home-seo-heading"
      className="border-t border-kado-dark/8 bg-kado-offwhite px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        {/* Hero band — readable on all breakpoints */}
        <div className="relative mb-12 overflow-hidden rounded-2xl sm:mb-16 sm:rounded-[2rem] md:mb-20">
          <div className="aspect-[4/3] w-full bg-kado-dark/5 sm:aspect-[21/9] md:aspect-[24/9]">
            <img
              src="/images/hero-interior.png"
              alt="Kado Kohi cafe interior in Sta. Elena, Marikina"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div
            className="absolute inset-0 bg-gradient-to-t from-kado-dark/75 via-kado-dark/25 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 md:p-10">
            <p className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-kado-cream/70">
              Sta. Elena · Marikina
            </p>
            <h2
              id="home-seo-heading"
              className="max-w-[12ch] font-display text-[clamp(1.75rem,5.5vw,3.75rem)] font-black leading-[0.95] tracking-tighter text-kado-cream"
            >
              Not a Café.
              <br />
              A Headquarters.
            </h2>
          </div>
        </div>

        {/* Editorial columns */}
        <div className="mb-14 grid grid-cols-1 gap-8 sm:mb-16 md:grid-cols-2 md:gap-10 lg:gap-14 xl:gap-16">
          <div className="space-y-5">
            <p className="font-display text-lg font-bold leading-snug text-kado-dark sm:text-xl md:text-2xl">
              {SEO_HOME_BODY_PARAGRAPHS[0]}
            </p>
            {SEO_HOME_BODY_PARAGRAPHS.slice(1, 3).map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className="font-sans text-sm leading-[1.7] text-kado-dark/65 sm:text-base"
              >
                {paragraph}
              </p>
            ))}
          </div>
          <div className="space-y-5 md:pt-1">
            {SEO_HOME_BODY_PARAGRAPHS.slice(3).map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className="font-sans text-sm leading-[1.7] text-kado-dark/65 sm:text-base"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Drink lineup */}
        <div className="mb-14 sm:mb-16">
          <div className="mb-8 flex items-center gap-4 sm:mb-10">
            <h3 className="shrink-0 font-display text-2xl font-black tracking-tighter text-kado-red sm:text-3xl">
              The Lineup
            </h3>
            <div className="h-px flex-1 bg-kado-red/15" />
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {DRINK_GROUPS.map((group) => (
              <div key={group.id}>
                <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-kado-dark sm:text-sm">
                  {group.title}
                </h4>
                <ul className="space-y-3">
                  {group.drinks.map((drink) => (
                    <li key={drink.name}>
                      <Link
                        to="/menu"
                        className="group flex min-h-[44px] items-center gap-3 touch-manipulation"
                      >
                        <span className="shrink-0 font-sans text-sm font-medium text-kado-dark/80 transition-colors group-hover:text-kado-red">
                          {drink.name}
                        </span>
                        <span className="h-px flex-1 border-b border-dotted border-kado-dark/15 transition-colors group-hover:border-kado-red/35" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Site links */}
        <nav
          aria-label="Kado Coffee site sections"
          className="border-t border-kado-dark/10 pt-8 sm:pt-10"
        >
          <p className="mb-4 text-center font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-kado-dark/40 sm:mb-5">
            Explore Kado Coffee
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-8">
            {SEO_INTERNAL_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-kado-dark/50 transition-colors hover:text-kado-red sm:text-xs sm:tracking-[0.2em]"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
