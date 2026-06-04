import { Link } from 'react-router-dom';
import { KADO_GOOGLE_LISTING } from '../../content/kadoGoogleReviews';

/**
 * Crawlable homepage copy targeting branded + local search queries
 * (Kado Coffee, best coffee in Marikina, tambayan, event/booth coffee).
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
          Kado Coffee in Marikina — specialty coffee, tambayan &amp; events
        </h2>
        <div className="max-w-3xl space-y-4 text-sm sm:text-base text-kado-dark/70 leading-relaxed font-medium">
          <p>
            <strong className="text-kado-dark font-bold">Kado Kohi</strong> is the same beloved cafe guests rate as{' '}
            <strong className="text-kado-dark font-bold">Kado Coffee</strong> on Google Maps — a specialty coffee shop
            and <strong className="text-kado-dark font-bold">tambayan</strong> on J.P. Laurel, Marikina City. Whether
            you&apos;re hunting for the <strong className="text-kado-dark font-bold">best coffee in Marikina</strong>,
            a cozy hangout, or <strong className="text-kado-dark font-bold">event coffee</strong> for your celebration,
            Kado is built for the community.
          </p>
          <p>
            Order signature drinks from our{' '}
            <Link to="/menu" className="text-kado-red font-bold hover:underline">
              live menu
            </Link>
            , see what&apos;s brewing on{' '}
            <Link to="/events" className="text-kado-red font-bold hover:underline">
              events &amp; tambayan nights
            </Link>
            , or{' '}
            <Link to="/book/booth" className="text-kado-red font-bold hover:underline">
              book our mobile coffee booth
            </Link>{' '}
            for weddings, parties, and corporate gatherings across Metro Manila.
          </p>
          <p className="text-xs sm:text-sm text-kado-dark/55">
            Rated {rating}★ from {reviewCount} Google reviews ·{' '}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-kado-red font-bold hover:underline"
            >
              Find Kado Coffee on Google Maps
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
