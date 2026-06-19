import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Briefcase, Camera, Handshake, MapPin } from 'lucide-react';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import { useCareersStore } from '../store/careersStore';
import {
  CAREER_CATEGORY_LABELS,
  type CareerListingCategory,
} from '../lib/careersPageContent';
import { LOGO } from '../lib/brandTokens';

const SECTIONS: Array<{
  id: CareerListingCategory;
  icon: typeof Briefcase;
  titleKey: 'careersSectionTitle' | 'creatorsSectionTitle' | 'collabsSectionTitle';
  introKey: 'careersSectionIntro' | 'creatorsSectionIntro' | 'collabsSectionIntro';
}> = [
  { id: 'careers', icon: Briefcase, titleKey: 'careersSectionTitle', introKey: 'careersSectionIntro' },
  { id: 'content-creators', icon: Camera, titleKey: 'creatorsSectionTitle', introKey: 'creatorsSectionIntro' },
  { id: 'collaborations', icon: Handshake, titleKey: 'collabsSectionTitle', introKey: 'collabsSectionIntro' },
];

export default function Careers() {
  const hydrateFromRemote = useCareersStore((s) => s.hydrateFromRemote);
  const pageCopy = useCareersStore((s) => s.pageCopy);
  const listings = useCareersStore((s) => s.listings);

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

  const visibleByCategory = useMemo(() => {
    const visible = listings.filter((item) => item.visible).sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      careers: visible.filter((item) => item.category === 'careers'),
      'content-creators': visible.filter((item) => item.category === 'content-creators'),
      collaborations: visible.filter((item) => item.category === 'collaborations'),
    };
  }, [listings]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-kado-offwhite font-sans">
      <section className="relative overflow-hidden border-b border-white/10 bg-kado-red pt-28 pb-16 text-kado-cream md:pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 top-16 font-display text-[clamp(8rem,28vw,16rem)] font-black leading-none text-white/[0.06] select-none"
        >
          角
        </div>
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="kado-label mb-5 text-kado-cream/80"
          >
            {pageCopy.heroEyebrow}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
            <img src={LOGO.stackedWordmark} alt="Kado Kohi" className="mx-auto mb-6 h-14 w-auto object-contain md:h-16" decoding="async" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="kado-h1 kado-h1-hero uppercase tracking-tight text-kado-cream"
          >
            {pageCopy.heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="mx-auto mt-5 max-w-2xl kado-body text-kado-cream/85"
          >
            {pageCopy.heroDescription}
          </motion.p>
        </div>
      </section>

      {SECTIONS.map((section, sectionIndex) => {
        const Icon = section.icon;
        const items = visibleByCategory[section.id];
        return (
          <section
            key={section.id}
            id={section.id}
            className={sectionIndex % 2 === 0 ? 'bg-kado-offwhite px-6 py-16 md:py-20' : 'bg-kado-cream px-6 py-16 md:py-20'}
          >
            <div className="mx-auto max-w-5xl">
              <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <p className="kado-label mb-3 inline-flex items-center gap-2 text-kado-red">
                    <Icon className="h-4 w-4" aria-hidden />
                    {CAREER_CATEGORY_LABELS[section.id]}
                  </p>
                  <h2 className="kado-h2 uppercase tracking-tight text-kado-dark">{pageCopy[section.titleKey]}</h2>
                  <p className="mt-4 kado-body text-kado-dark/65">{pageCopy[section.introKey]}</p>
                </div>
              </div>

              {items.length === 0 ? (
                <p className="rounded-[1.25rem] border border-kado-dark/10 bg-white/70 px-6 py-8 text-center kado-body text-kado-dark/55">
                  {pageCopy.emptyMessage}
                </p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {items.map((listing) => (
                    <article
                      key={listing.id}
                      className="flex h-full flex-col rounded-[1.25rem] border border-kado-dark/10 bg-white p-6 shadow-[0_12px_32px_rgba(25,25,25,0.06)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(158,24,29,0.1)]"
                    >
                      <p className="kado-label mb-2 text-kado-red">{CAREER_CATEGORY_LABELS[listing.category]}</p>
                      <h3 className="font-display text-xl font-bold text-kado-dark">{listing.title}</h3>
                      {(listing.location || listing.employmentType) && (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 kado-subtext font-semibold uppercase tracking-wider text-kado-dark/45">
                          {listing.location ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" aria-hidden />
                              {listing.location}
                            </span>
                          ) : null}
                          {listing.employmentType ? <span>{listing.employmentType}</span> : null}
                        </div>
                      )}
                      <p className="mt-4 flex-1 kado-body text-kado-dark/70">{listing.description}</p>
                      <a
                        href={listing.applyHref}
                        className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-sm bg-kado-red px-5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-kado-dark"
                      >
                        {listing.applyLabel}
                        <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                      </a>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}

      <PageSeoBlurb />
    </div>
  );
}
