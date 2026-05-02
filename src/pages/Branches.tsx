import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { useBranchStore } from '../store/branchStore';
import SectionHeader from '../components/SectionHeader';

export default function Branches() {
  const branches = useBranchStore((s) => s.branches);

  return (
    <div className="flex flex-col w-full bg-white font-sans min-h-screen">
      <section className="pt-28 pb-12 px-6 border-b border-kado-dark/5 bg-[#FAF7F2]">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-kado-red mb-2 text-center">
            Locations
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-black text-kado-dark mb-4 text-center uppercase tracking-tighter">
            Branches
          </h1>
          <p className="text-kado-dark/60 text-sm md:text-base max-w-xl mx-auto leading-relaxed text-center font-medium">
            Marikina today. Greenhills soon. Every corner is built for the same Kado community.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
          {branches.map((b) => (
            <article
              key={b.id}
              className="rounded-[1.5rem] border border-kado-dark/10 bg-white p-8 hover:shadow-[0_20px_40px_rgba(158,24,29,0.08)] hover:-translate-y-1 hover:border-kado-red/30 transition-all duration-400 flex flex-col group"
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-black text-kado-dark group-hover:text-kado-red transition-colors leading-tight">
                    {b.name}
                  </h2>
                  <p className="text-sm font-bold text-kado-dark/60 mt-2 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-kado-red shrink-0 mt-0.5" />
                    {b.address}, {b.city}
                  </p>
                </div>
                {b.status === 'coming_soon' ? (
                  <span className="shrink-0 text-[9px] font-black uppercase tracking-widest bg-white text-kado-dark border border-kado-dark/15 px-3 py-1.5 rounded-full shadow-sm">
                    Coming soon
                  </span>
                ) : (
                  <span className="shrink-0 text-[9px] font-black uppercase tracking-widest bg-kado-red text-white px-3 py-1.5 rounded-full shadow-md shadow-kado-red/20">
                    Open
                  </span>
                )}
              </div>

              {b.hours.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-kado-dark/70 mb-8 font-medium">
                  <Clock className="w-4 h-4 text-kado-red shrink-0" />
                  <span>Daily hours vary — see contact for updates.</span>
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-kado-dark/5 flex justify-end">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-full bg-kado-dark text-white px-6 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-kado-red hover:shadow-lg hover:shadow-kado-red/30 transition-all"
                >
                  Get directions
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
