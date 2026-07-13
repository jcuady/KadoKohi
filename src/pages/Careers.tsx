import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import PublicPageBanner from '../components/seo/PublicPageBanner';
import CareerApplyModal from '../components/careers/CareerApplyModal';
import CareerJobCard from '../components/careers/CareerJobCard';
import CareerJobDetailPanel from '../components/careers/CareerJobDetailPanel';
import CareersToolbar from '../components/careers/CareersToolbar';
import { useCareersStore } from '../store/careersStore';
import { useBranchStore } from '../store/branchStore';
import {
  DEFAULT_CAREER_CATALOG_FILTERS,
  filterCareerListings,
  parseCareerCatalogFilters,
  uniqueEmploymentTypes,
  writeCareerCatalogFilters,
} from '../lib/careerCatalogFilters';
import type { CareerListing } from '../lib/careersPageContent';

export default function Careers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const hydrateFromRemote = useCareersStore((s) => s.hydrateFromRemote);
  const pageCopy = useCareersStore((s) => s.pageCopy);
  const listings = useCareersStore((s) => s.listings);
  const applicationForm = useCareersStore((s) => s.applicationForm);
  const branches = useBranchStore((s) => s.branches);
  const hydrateBranches = useBranchStore((s) => s.hydrateFromRemote);

  const [applyListing, setApplyListing] = useState<CareerListing | null>(null);
  const [detailListing, setDetailListing] = useState<CareerListing | null>(null);

  const filters = useMemo(() => parseCareerCatalogFilters(searchParams), [searchParams]);

  useEffect(() => {
    void hydrateFromRemote();
    void hydrateBranches();
  }, [hydrateFromRemote, hydrateBranches]);

  const employmentTypes = useMemo(() => uniqueEmploymentTypes(listings.filter((l) => l.visible)), [listings]);

  const filtered = useMemo(
    () => filterCareerListings(listings, filters, branches),
    [listings, filters, branches],
  );

  const openRolesCount = useMemo(() => listings.filter((l) => l.visible).length, [listings]);

  useEffect(() => {
    const jobId = searchParams.get('job');
    if (!jobId) {
      setDetailListing(null);
      return;
    }
    const match = listings.find((l) => l.id === jobId && l.visible);
    setDetailListing(match ?? null);
  }, [searchParams, listings]);

  const patchFilters = (patch: Partial<typeof filters>) => {
    const next = { ...filters, ...patch };
    setSearchParams(writeCareerCatalogFilters(searchParams, next), { replace: true });
  };

  const clearFilters = () => {
    setSearchParams(writeCareerCatalogFilters(searchParams, DEFAULT_CAREER_CATALOG_FILTERS), { replace: true });
  };

  const openDetail = (listing: CareerListing) => {
    const next = new URLSearchParams(searchParams);
    next.set('job', listing.id);
    setSearchParams(next, { replace: true });
    setDetailListing(listing);
  };

  const closeDetail = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('job');
    setSearchParams(next, { replace: true });
    setDetailListing(null);
  };

  const openApply = (listing: CareerListing) => {
    closeDetail();
    setApplyListing(listing);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-kado-offwhite font-sans">
      <PublicPageBanner
        align="start"
        wide
        eyebrow={pageCopy.heroEyebrow}
        title={pageCopy.heroTitle}
        description={pageCopy.heroDescription}
      >
        {openRolesCount > 0 ? (
          <p className="inline-flex rounded-full border border-kado-dark/10 bg-kado-offwhite px-4 py-2 text-[10px] font-black uppercase tracking-wider text-kado-dark/70">
            {openRolesCount} open {openRolesCount === 1 ? 'role' : 'roles'}
          </p>
        ) : null}
      </PublicPageBanner>

      <div className="sticky top-[4.5rem] z-30">
        <div className="mx-auto max-w-6xl px-6">
          <CareersToolbar
            filters={filters}
            resultCount={filtered.length}
            branches={branches}
            employmentTypes={employmentTypes}
            onChange={patchFilters}
            onClear={clearFilters}
          />
        </div>
      </div>

      <section className="px-6 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-kado-dark/10 bg-white px-6 py-14 text-center">
              <p className="kado-body text-kado-dark/60">{pageCopy.emptyMessage}</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-bold text-kado-red hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((listing) => (
                <div key={listing.id}>
                  <CareerJobCard
                    listing={listing}
                    branches={branches}
                    onOpen={() => openDetail(listing)}
                    onApply={() => openApply(listing)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-kado-dark/8 bg-kado-cream px-6 py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="kado-h2 uppercase tracking-tight text-kado-dark">{pageCopy.whyJoinTitle}</h2>
          <p className="mt-4 kado-body leading-relaxed text-kado-dark/65">{pageCopy.whyJoinBody}</p>
          {pageCopy.heroBenefits.length > 0 ? (
            <ul className="mt-8 flex flex-wrap justify-center gap-2">
              {pageCopy.heroBenefits.map((benefit) => (
                <li
                  key={benefit}
                  className="rounded-full border border-kado-dark/10 bg-white px-4 py-2 text-xs font-semibold text-kado-dark/70"
                >
                  {benefit}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <PageSeoBlurb />

      {detailListing ? (
        <CareerJobDetailPanel
          listing={detailListing}
          branches={branches}
          onClose={closeDetail}
          onApply={() => openApply(detailListing)}
        />
      ) : null}

      {applyListing ? (
        <CareerApplyModal
          listing={applyListing}
          formConfig={applicationForm}
          onClose={() => setApplyListing(null)}
        />
      ) : null}
    </div>
  );
}
