import { useMemo } from 'react';
import { useEventStore } from '../store/eventStore';
import { Calendar, MapPin } from 'lucide-react';
import { useBranchStore } from '../store/branchStore';
import SectionHeader from '../components/SectionHeader';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Events() {
  const allEvents = useEventStore((s) => s.events);
  const events = useMemo(
    () =>
      [...allEvents]
        .filter((e) => e.visible)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [allEvents],
  );
  const branches = useBranchStore((s) => s.branches);
  const branchName = (id?: string | null) => branches.find((b) => b.id === id)?.name ?? 'All branches';

  return (
    <div className="flex flex-col w-full bg-white font-sans min-h-screen">
      <section className="pt-28 pb-12 px-6 border-b border-kado-dark/5 bg-[#FAF7F2]">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-kado-red mb-2 text-center">
            What's happening
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-black text-kado-dark mb-4 text-center uppercase tracking-tighter">
            Kado Booth
          </h1>
          <p className="text-kado-dark/60 text-sm md:text-base max-w-xl mx-auto leading-relaxed text-center font-medium">
            Join us for tastings, throwdowns, workshops, and special celebrations at Kado Kohi.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          {events.length === 0 ? (
            <p className="text-center text-kado-dark/55 text-sm font-medium py-12">No upcoming events right now. Check back soon!</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-[1.5rem] border border-kado-dark/10 bg-white p-8 hover:shadow-[0_20px_40px_rgba(158,24,29,0.08)] hover:-translate-y-1 hover:border-kado-red/30 transition-all duration-400 group"
                >
                  {evt.highlight && (
                    <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-kado-red text-white px-3 py-1.5 rounded-full mb-5 shadow-md shadow-kado-red/20">
                      Featured
                    </span>
                  )}
                  <h3 className="font-display text-xl md:text-2xl font-black text-kado-dark mb-3 group-hover:text-kado-red transition-colors leading-tight">
                    {evt.title}
                  </h3>
                  <p className="text-sm font-medium text-kado-dark/60 leading-relaxed mb-6">
                    {evt.description}
                  </p>
                  <div className="flex flex-col gap-2.5 text-xs text-kado-dark/60 font-bold mb-8">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-kado-red" />
                      {formatDate(evt.startsAt)}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-kado-red" />
                      {branchName(evt.branchId)}
                    </span>
                  </div>
                  {evt.cta && (
                    <a
                      href={evt.cta.href}
                      className="inline-flex items-center justify-center rounded-full bg-kado-dark text-white px-6 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-kado-red hover:shadow-lg hover:shadow-kado-red/30 transition-all"
                    >
                      {evt.cta.label}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
