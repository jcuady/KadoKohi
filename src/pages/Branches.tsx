import { useEffect } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { useBranchStore } from '../store/branchStore';
import { branchDirectionsUrl, branchHeroImageUrl } from '../lib/branchMaps';
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
        description="Coffee near me in Marikina & Sta. Elena — J.P. Laurel corner Mt. Everest. Greenhills branch coming soon."
        polaroids={BRANCHES_HERO_POLAROIDS}
        stickers={BRANCHES_HERO_STICKERS}
      />

      <section className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
          {branches.map((b) => {
            const hero = branchHeroImageUrl(b);
            const directions = branchDirectionsUrl(b);

            return (
              <article
                key={b.id}
                className="rounded-[1.5rem] border border-kado-dark/10 bg-white overflow-hidden hover:shadow-[0_20px_40px_rgba(158,24,29,0.08)] hover:-translate-y-1 hover:border-kado-red/30 transition-all duration-400 flex flex-col group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={hero}
                    alt={b.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-kado-dark/50 via-transparent to-transparent" />
                  {b.status === 'coming_soon' ? (
                    <span className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest bg-white text-kado-dark border border-kado-dark/15 px-3 py-1.5 rounded-full shadow-sm">
                      Coming soon
                    </span>
                  ) : (
                    <span className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest bg-kado-red text-white px-3 py-1.5 rounded-full shadow-md shadow-kado-red/20">
                      Open
                    </span>
                  )}
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <h2 className="font-display text-2xl md:text-3xl font-black text-kado-dark group-hover:text-kado-red transition-colors leading-tight">
                    {b.name}
                  </h2>
                  <p className="text-sm font-bold text-kado-dark/60 mt-2 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-kado-red shrink-0 mt-0.5" />
                    {b.address}, {b.city}
                  </p>

                  {b.hours.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-kado-dark/70 mt-5 font-medium">
                      <Clock className="w-4 h-4 text-kado-red shrink-0" />
                      <span>Daily hours vary — see contact for updates.</span>
                    </div>
                  )}

                  <div className="mt-auto pt-6 border-t border-kado-dark/5 flex justify-end">
                    <a
                      href={directions}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-kado-dark text-white px-6 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-kado-red hover:shadow-lg hover:shadow-kado-red/30 transition-all"
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
