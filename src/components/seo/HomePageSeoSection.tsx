import { Link } from 'react-router-dom';
import {
  SEO_HOME_BODY_PARAGRAPHS,
  SEO_HOME_H1,
  SEO_INTERNAL_LINKS,
  SEO_SIGNATURE_DRINKS,
  SEO_SOCIAL,
} from '../../content/seo';
import { KADO_GOOGLE_LISTING } from '../../content/kadoGoogleReviews';

const DRINK_GROUPS = [
  {
    id: 'matcha-hojicha',
    title: 'Matcha & hojicha — best matcha in Marikina',
    drinks: SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Matcha & Hojicha'),
  },
  {
    id: 'signatures',
    title: 'Signature lattes',
    drinks: SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Signatures'),
  },
  {
    id: 'classics-yuzu',
    title: 'Classics & yuzu',
    drinks: SEO_SIGNATURE_DRINKS.filter((d) => d.category === 'Classics' || d.category === 'Yuzu'),
  },
] as const;

/**
 * Crawlable homepage block: 250+ words, headings, internal + external links.
 */
export default function HomePageSeoSection() {
  return (
    <section
      aria-labelledby="home-menu-seo-heading"
      className="border-t border-kado-dark/8 bg-[#FAF7F2] px-4 py-12 sm:px-6 sm:py-16 md:px-12 lg:px-24"
    >
      <div className="mx-auto max-w-4xl">
        <h2 id="home-menu-seo-heading" className="font-display text-xl font-bold text-kado-dark sm:text-2xl">
          {SEO_HOME_H1}
        </h2>

        {SEO_HOME_BODY_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="mt-4 text-sm leading-relaxed text-kado-dark/75 sm:text-base">
            {paragraph}
          </p>
        ))}

        <p className="mt-4 text-sm leading-relaxed text-kado-dark/75 sm:text-base">
          Browse the{' '}
          <Link to="/menu" className="font-semibold text-kado-red underline-offset-2 hover:underline">
            full Kado Coffee menu
          </Link>
          , check{' '}
          <Link to="/branches" className="font-semibold text-kado-red underline-offset-2 hover:underline">
            branch hours and directions
          </Link>
          , or{' '}
          <a
            href={KADO_GOOGLE_LISTING.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-kado-red underline-offset-2 hover:underline"
          >
            open Google Maps
          </a>{' '}
          for coffee near me in Marikina.
        </p>

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {DRINK_GROUPS.map((group) => (
            <div key={group.id}>
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-kado-dark sm:text-base">
                {group.title}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-kado-dark/75">
                {group.drinks.map((drink) => (
                  <li key={drink.name}>
                    <Link to="/menu" className="font-medium text-kado-dark hover:text-kado-red">
                      {drink.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <nav aria-label="Kado Coffee site sections" className="mt-10 border-t border-kado-dark/8 pt-8">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-kado-dark/45">
            Explore Kado Coffee
          </h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-wider">
            {SEO_INTERNAL_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-kado-red hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-6 text-[10px] font-bold uppercase tracking-wider text-kado-dark/40">
          <a href={SEO_SOCIAL.instagram} target="_blank" rel="noopener noreferrer me" className="hover:text-kado-red">
            Instagram @kadocoffeeph
          </a>
          {' · '}
          <a href={SEO_SOCIAL.facebook} target="_blank" rel="noopener noreferrer me" className="hover:text-kado-red">
            Facebook KadoKohi
          </a>
          {' · '}
          <a href={SEO_SOCIAL.tiktok} target="_blank" rel="noopener noreferrer me" className="hover:text-kado-red">
            TikTok @kadokohiph
          </a>
          {' · '}
          <a
            href={KADO_GOOGLE_LISTING.reviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-kado-red"
          >
            Google reviews
          </a>
        </p>
      </div>
    </section>
  );
}
