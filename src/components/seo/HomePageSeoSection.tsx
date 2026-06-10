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
      className="bg-white px-6 py-20 sm:py-28 md:py-32 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        
        {/* Editorial Header with Image */}
        <div className="relative mb-20 sm:mb-32">
          <div className="aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-kado-dark/5">
            <img 
              src="/images/hero-interior.png" 
              alt="Kado Kohi Cafe Interior" 
              className="w-full h-full object-cover brightness-[0.85] contrast-125"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center pointer-events-none">
            <h2 
              id="home-seo-heading" 
              className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-black leading-[0.95] tracking-tighter text-white drop-shadow-2xl"
            >
              Not a Café.<br />A Headquarters.
            </h2>
          </div>
        </div>

        {/* SEO Copy in Editorial Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 lg:gap-24 mb-24">
          <div className="space-y-6">
            <p className="font-display text-2xl sm:text-3xl font-bold leading-snug text-kado-dark">
              {SEO_HOME_BODY_PARAGRAPHS[0]}
            </p>
            <p className="font-sans text-sm sm:text-base leading-relaxed text-kado-dark/70">
              {SEO_HOME_BODY_PARAGRAPHS[1]}
            </p>
            <p className="font-sans text-sm sm:text-base leading-relaxed text-kado-dark/70">
              {SEO_HOME_BODY_PARAGRAPHS[2]}
            </p>
          </div>
          <div className="space-y-6 md:pt-2">
            <p className="font-sans text-sm sm:text-base leading-relaxed text-kado-dark/70">
              {SEO_HOME_BODY_PARAGRAPHS[3]}
            </p>
            <p className="font-sans text-sm sm:text-base leading-relaxed text-kado-dark/70">
              {SEO_HOME_BODY_PARAGRAPHS[4]}
            </p>
            <p className="font-sans text-sm sm:text-base leading-relaxed text-kado-dark/70">
              {SEO_HOME_BODY_PARAGRAPHS[5]}
            </p>
          </div>
        </div>

        {/* Signature Drinks Grid */}
        <div className="mb-24">
          <div className="flex items-center gap-4 mb-12">
            <h3 className="font-display text-3xl sm:text-4xl font-black tracking-tighter text-[#8A1519]">
              The Lineup
            </h3>
            <div className="h-px flex-1 bg-[#8A1519]/20" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8">
            {DRINK_GROUPS.map((group) => (
              <div key={group.id} className="relative">
                <h4 className="font-display text-lg font-bold uppercase tracking-widest text-kado-dark mb-6">
                  {group.title}
                </h4>
                <ul className="space-y-4">
                  {group.drinks.map((drink) => (
                    <li key={drink.name}>
                      <Link 
                        to="/menu" 
                        className="group flex items-baseline justify-between gap-4"
                      >
                        <span className="font-sans text-sm font-semibold text-kado-dark/80 group-hover:text-[#8A1519] transition-colors">
                          {drink.name}
                        </span>
                        <span className="flex-1 border-b border-dotted border-kado-dark/20 group-hover:border-[#8A1519]/40 transition-colors" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Internal Links Footer */}
        <nav aria-label="Kado Coffee site sections" className="border-t border-kado-dark/10 pt-12">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {SEO_INTERNAL_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link 
                  to={to} 
                  className="font-display text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-kado-dark/50 hover:text-[#8A1519] transition-colors"
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
