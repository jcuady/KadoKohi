import { useEffect, useRef } from 'react';
import { ArrowUpRight, Briefcase, MapPin, X } from 'lucide-react';
import {
  CAREER_CATEGORY_LABELS,
  careerListingLocationLabel,
  formatCareerPostedLabel,
  type CareerListing,
} from '../../lib/careersPageContent';
import type { Branch } from '../../types/domain';
import { LOGO } from '../../lib/brandTokens';
import { OVERLAY_CLOSE, OVERLAY_CTA, OVERLAY_SCRIM } from '../../lib/overlayTheme';

type Props = {
  listing: CareerListing;
  branches: Branch[];
  onClose: () => void;
  onApply: () => void;
};

export default function CareerJobDetailPanel({ listing, branches, onClose, onApply }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const location = careerListingLocationLabel(listing, branches);
  const posted = formatCareerPostedLabel(listing.postedAt);
  const useForm = listing.applyMode !== 'link';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={`fixed inset-0 z-50 flex justify-end p-0 sm:p-4 ${OVERLAY_SCRIM}`} role="presentation">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close job details" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="career-job-detail-title"
        className="relative flex h-full w-full max-w-lg flex-col overflow-hidden bg-white border border-kado-dark/10 sm:border-kado-red/10 shadow-[0_30px_60px_rgba(158,24,29,0.15)] sm:max-h-[92vh] sm:rounded-[2rem]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-kado-dark/10 px-5 py-4 md:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-kado-dark/10 bg-kado-offwhite">
              <img src={LOGO.hybridMark} alt="" className="h-8 w-8 object-contain" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="career-job-detail-title" className="font-display text-xl font-bold text-kado-dark md:text-2xl">
                {listing.title}
              </h2>
              <p className="text-sm font-semibold text-kado-dark/55">Kado Kohi</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className={OVERLAY_CLOSE} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          <div className="mb-4 flex flex-wrap gap-2">
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
            <p className="mb-1 inline-flex items-center gap-1.5 text-sm font-semibold text-kado-dark/60">
              <MapPin className="h-4 w-4 shrink-0 text-kado-red" aria-hidden />
              {location}
            </p>
          ) : null}
          {posted ? <p className="mb-5 text-xs text-kado-dark/45">{posted}</p> : null}

          <div className="whitespace-pre-wrap text-sm leading-relaxed text-kado-dark/75">{listing.description}</div>
        </div>

        <div className="border-t border-kado-dark/5 bg-gray-50/50 p-5 backdrop-blur-md md:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {useForm ? (
            <button type="button" onClick={onApply} className={OVERLAY_CTA}>
              {listing.applyLabel}
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
            </button>
          ) : (
            <a href={listing.applyHref} target="_blank" rel="noopener noreferrer" className={OVERLAY_CTA}>
              {listing.applyLabel}
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
