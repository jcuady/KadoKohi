import { ArrowUpRight, Briefcase, MapPin } from 'lucide-react';
import {
  CAREER_CATEGORY_LABELS,
  careerListingLocationLabel,
  formatCareerPostedLabel,
  type CareerListing,
} from '../../lib/careersPageContent';
import type { Branch } from '../../types/domain';
import { LOGO } from '../../lib/brandTokens';

type Props = {
  listing: CareerListing;
  branches: Branch[];
  onOpen: () => void;
  onApply: () => void;
  compact?: boolean;
};

export default function CareerJobCard({ listing, branches, onOpen, onApply, compact = false }: Props) {
  const location = careerListingLocationLabel(listing, branches);
  const posted = formatCareerPostedLabel(listing.postedAt);
  const useForm = listing.applyMode !== 'link';

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-kado-dark/10 bg-white transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-kado-red/25 hover:shadow-[0_16px_40px_rgba(158,24,29,0.08)] ${
        compact ? 'max-w-sm' : ''
      }`}
    >
      <button type="button" onClick={onOpen} className="flex flex-1 flex-col p-5 text-left md:p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-kado-dark/10 bg-kado-offwhite">
            <img src={LOGO.hybridMark} alt="" className="h-7 w-7 object-contain" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold leading-snug text-kado-dark group-hover:text-kado-red md:text-xl">
              {listing.title}
            </h3>
            <p className="mt-0.5 text-sm font-semibold text-kado-dark/55">Kado Kohi</p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-kado-red/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-kado-red">
            {CAREER_CATEGORY_LABELS[listing.category]}
          </span>
          {listing.employmentType ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-kado-offwhite px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-kado-dark/55">
              <Briefcase className="h-3 w-3" aria-hidden />
              {listing.employmentType}
            </span>
          ) : null}
        </div>

        {location ? (
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-kado-dark/50">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-kado-red/80" aria-hidden />
            {location}
          </p>
        ) : null}

        {posted ? <p className="mb-3 text-[11px] font-medium text-kado-dark/40">{posted}</p> : null}

        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-kado-dark/70">{listing.description}</p>
      </button>

      <div className="border-t border-kado-dark/5 px-5 pb-5 pt-3 md:px-6 md:pb-6">
        {useForm ? (
          <button
            type="button"
            onClick={onApply}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-kado-red/30 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-kado-red transition-colors hover:bg-kado-red hover:text-white"
          >
            Easy Apply
            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        ) : (
          <a
            href={listing.applyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-kado-red/30 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-kado-red transition-colors hover:bg-kado-red hover:text-white"
          >
            {listing.applyLabel}
            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
          </a>
        )}
      </div>
    </article>
  );
}
