import { Link } from 'react-router-dom';
import { SEO_SOCIAL } from '../../content/seo';
import { KADO_GOOGLE_LISTING } from '../../content/kadoGoogleReviews';

/**
 * Crawlable homepage copy: Kado Coffee (search brand) + Kado Kohi (site name),
 * Marikina / Sta. Elena / near-me local intent.
 */
export default function HomeSeoIntro() {
  const { rating, reviewCount, mapsUrl } = KADO_GOOGLE_LISTING;

  return (
    <section
      aria-labelledby="home-seo-intro-heading"
      className="border-t border-kado-dark/8 bg-white px-4 py-10 sm:px-6 md:px-12 lg:px-24"
    >
      <div className="mx-auto max-w-[1400px]">
        <h2
          id="home-seo-intro-heading"
          className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-kado-dark mb-4"
        >
          Kado Coffee — best coffee in Marikina &amp; Sta. Elena
        </h2>
        <div className="max-w-3xl space-y-4 text-sm sm:text-base text-kado-dark/70 leading-relaxed font-medium">
          <p>
            Looking for <strong className="text-kado-dark font-bold">best coffee in Marikina</strong>,{' '}
            <strong className="text-kado-dark font-bold">marikina coffee near me</strong>, or{' '}
            <strong className="text-kado-dark font-bold">Sta. Elena coffee</strong>?{' '}
            <strong className="text-kado-dark font-bold">Kado Coffee</strong> (also{' '}
            <strong className="text-kado-dark font-bold">Kado Kohi</strong>) is a specialty coffee shop and tambayan on
            J.P. Laurel corner Mt. Everest — serving Sta. Elena, Marikina City, and guests across Metro Manila.
          </p>
          <p>
            Browse our{' '}
            <Link to="/menu" className="text-kado-red font-bold hover:underline">
              Kado Coffee menu
            </Link>
            , join{' '}
            <Link to="/events" className="text-kado-red font-bold hover:underline">
              events &amp; tambayan nights
            </Link>
            , or{' '}
            <Link to="/book/booth" className="text-kado-red font-bold hover:underline">
              book booth &amp; event coffee
            </Link>{' '}
            for celebrations. Rated {rating}★ on Google ({reviewCount} reviews).
          </p>
          <p className="text-xs sm:text-sm text-kado-dark/55">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-kado-red font-bold hover:underline">
              Directions on Google Maps
            </a>
            {' · '}
            <Link to="/branches" className="text-kado-red font-bold hover:underline">
              Hours &amp; location
            </Link>
          </p>
          <nav aria-label="Kado Coffee social media" className="flex flex-wrap gap-3 pt-1">
            <a
              href={SEO_SOCIAL.facebook}
              target="_blank"
              rel="noopener noreferrer me"
              className="text-[10px] font-bold uppercase tracking-wider text-kado-dark/55 hover:text-kado-red transition-colors"
            >
              Facebook
            </a>
            <a
              href={SEO_SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer me"
              className="text-[10px] font-bold uppercase tracking-wider text-kado-dark/55 hover:text-kado-red transition-colors"
            >
              Instagram @kadocoffeeph
            </a>
            <a
              href={SEO_SOCIAL.tiktok}
              target="_blank"
              rel="noopener noreferrer me"
              className="text-[10px] font-bold uppercase tracking-wider text-kado-dark/55 hover:text-kado-red transition-colors"
            >
              TikTok @kadokohiph
            </a>
          </nav>
        </div>
      </div>
    </section>
  );
}
