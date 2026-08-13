import { useEffect } from 'react';
import { MapPin, Clock, Phone } from 'lucide-react';
import { useBranchStore } from '../store/branchStore';
import {
  branchDirectionsUrl,
  branchHeroImageUrl,
  branchTelHref,
  formatBranchPhoneDisplay,
  resolveBranchPhone,
} from '../lib/branchMaps';
import { formatBranchHoursSummary } from '../lib/branchHours';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import CollagePageHero from '../components/seo/CollagePageHero';
import {
  BRANCHES_HERO_POLAROIDS,
  BRANCHES_HERO_STICKERS,
} from '../data/collageHeroMedia';

export default function Branches() {
  const branches = useBranchStore((s) => s.branches);
  const hydrateBranches = useBranchStore((s) => s.hydrateFromRemote);

  useEffect(() => {
    void hydrateBranches();
  }, [hydrateBranches]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-white font-sans">
      <CollagePageHero
        titleId="branches-page-title"
        eyebrow="Locations"
        title="Kado Coffee Branches"
        description="Marikina and Promenade Greenhills — hours, directions, and coffee near you."
        polaroids={BRANCHES_HERO_POLAROIDS}
        stickers={BRANCHES_HERO_STICKERS}
      />

      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {branches.map((b) => {
            const hero = branchHeroImageUrl(b);
            const directions = branchDirectionsUrl(b);
            const hoursLabel = formatBranchHoursSummary(b.hours);
            const phone = resolveBranchPhone(b);

            return (
              <article
                key={b.id}
                className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-kado-dark/10 bg-white transition-all duration-400 hover:-translate-y-1 hover:border-kado-red/30 hover:shadow-[0_20px_40px_rgba(158,24,29,0.08)]"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={hero}
                    alt={b.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-kado-dark/50 via-transparent to-transparent" />
                  {b.status === 'coming_soon' ? (
                    <span className="absolute right-4 top-4 rounded-full border border-kado-dark/15 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-kado-dark shadow-sm">
                      Coming soon
                    </span>
                  ) : (
                    <span className="absolute right-4 top-4 rounded-full bg-kado-red px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-md shadow-kado-red/20">
                      Open
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-8">
                  <h2 className="font-display text-2xl font-black leading-tight text-kado-dark transition-colors group-hover:text-kado-red md:text-3xl">
                    {b.name}
                  </h2>
                  <p className="mt-2 flex items-start gap-2 text-sm font-bold text-kado-dark/60">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-kado-red" />
                    {[b.address, b.city].filter(Boolean).join(', ')}
                  </p>

                  {hoursLabel ? (
                    <div className="mt-5 flex items-start gap-2 text-sm font-medium text-kado-dark/70">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-kado-red" />
                      <span>{hoursLabel}</span>
                    </div>
                  ) : null}

                  {phone ? (
                    <a
                      href={branchTelHref(phone)}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-kado-dark/80 hover:text-kado-red"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-kado-red" />
                      {formatBranchPhoneDisplay(phone)}
                    </a>
                  ) : null}

                  <div className="mt-auto flex justify-end border-t border-kado-dark/5 pt-6">
                    <a
                      href={directions}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-kado-dark px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-kado-red hover:shadow-lg hover:shadow-kado-red/30"
                    >
                      Get directions
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <PageSeoBlurb />
    </div>
  );
}
