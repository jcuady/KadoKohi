import { ArrowUpRight, MapPin } from 'lucide-react';
import { CAREER_CATEGORY_LABELS, type CareerListing } from '../../lib/careersPageContent';

type Props = {
  listing: CareerListing;
  onApply: () => void;
};

export default function CareerRoleCard({ listing, onApply }: Props) {
  const useForm = listing.applyMode !== 'link';

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-kado-dark/10 bg-white shadow-[0_12px_32px_rgba(25,25,25,0.06)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(158,24,29,0.1)]">
      <div className="h-1.5 bg-gradient-to-r from-kado-red to-kado-dark/80" aria-hidden />
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-kado-red/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-kado-red">
            {CAREER_CATEGORY_LABELS[listing.category]}
          </span>
          {listing.employmentType ? (
            <span className="rounded-full bg-kado-offwhite px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-kado-dark/55">
              {listing.employmentType}
            </span>
          ) : null}
        </div>
        <h3 className="font-display text-2xl font-bold text-kado-dark">{listing.title}</h3>
        {listing.location ? (
          <p className="mt-2 inline-flex items-center gap-1.5 kado-subtext font-semibold uppercase tracking-wider text-kado-dark/45">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {listing.location}
          </p>
        ) : null}
        <p className="mt-4 flex-1 kado-body text-kado-dark/70 leading-relaxed">{listing.description}</p>
        {useForm ? (
          <button
            type="button"
            onClick={onApply}
            className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-sm bg-kado-red px-5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-kado-dark"
          >
            {listing.applyLabel}
            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        ) : (
          <a
            href={listing.applyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-sm bg-kado-red px-5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-kado-dark"
          >
            {listing.applyLabel}
            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
          </a>
        )}
      </div>
    </article>
  );
}
