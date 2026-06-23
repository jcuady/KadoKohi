import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Briefcase,
  Camera,
  Handshake,
  Heart,
  Sparkles,
  Users,
} from 'lucide-react';
import PageSeoBlurb from '../components/seo/PageSeoBlurb';
import CareerApplyModal from '../components/careers/CareerApplyModal';
import CareerRoleCard from '../components/careers/CareerRoleCard';
import { useCareersStore } from '../store/careersStore';
import {
  CAREER_CATEGORY_LABELS,
  type CareerListing,
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

const BENEFIT_ICONS = [Sparkles, Users, Heart, Briefcase];

export default function Careers() {
  const hydrateFromRemote = useCareersStore((s) => s.hydrateFromRemote);
  const pageCopy = useCareersStore((s) => s.pageCopy);
  const listings = useCareersStore((s) => s.listings);
  const applicationForm = useCareersStore((s) => s.applicationForm);
  const [applyListing, setApplyListing] = useState<CareerListing | null>(null);
  const [activeSection, setActiveSection] = useState<CareerListingCategory>('careers');

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

  const openRolesCount = visibleByCategory.careers.length;

  const scrollToSection = (id: CareerListingCategory) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-kado-offwhite font-sans">
      <section className="relative overflow-hidden border-b border-white/10 bg-kado-red pt-28 pb-14 text-kado-cream md:pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 top-16 font-display text-[clamp(8rem,28vw,16rem)] font-black leading-none text-white/[0.06] select-none"
        >
          角
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="text-center lg:text-left">
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="kado-label mb-4 text-kado-cream/80"
              >
                {pageCopy.heroEyebrow}
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <img
                  src={LOGO.stackedWordmark}
                  alt="Kado Kohi"
                  className="mx-auto mb-6 h-12 w-auto object-contain lg:mx-0 md:h-14"
                  decoding="async"
                />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="kado-h1 uppercase tracking-tight text-kado-cream"
              >
                {pageCopy.heroTitle}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-5 max-w-xl kado-body text-kado-cream/85 lg:mx-0 mx-auto"
              >
                {pageCopy.heroDescription}
              </motion.p>
              {openRolesCount > 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-kado-cream"
                >
                  {openRolesCount} open {openRolesCount === 1 ? 'role' : 'roles'} · Marikina
                </motion.p>
              ) : null}
            </div>

            <motion.ul
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="grid grid-cols-2 gap-3"
            >
              {pageCopy.heroBenefits.map((benefit, i) => {
                const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length];
                return (
                  <li
                    key={benefit}
                    className="rounded-[1rem] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm"
                  >
                    <Icon className="mb-2 h-5 w-5 text-kado-cream/90" aria-hidden />
                    <p className="text-sm font-semibold text-kado-cream">{benefit}</p>
                  </li>
                );
              })}
            </motion.ul>
          </div>
        </div>
      </section>

      <nav
        aria-label="Careers sections"
        className="sticky top-[4.5rem] z-30 border-b border-kado-dark/10 bg-kado-cream/95 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-6 py-3">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const count = visibleByCategory[section.id].length;
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  active ? 'bg-kado-red text-white' : 'bg-white text-kado-dark/70 hover:text-kado-red'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {CAREER_CATEGORY_LABELS[section.id]}
                {count > 0 ? <span className="opacity-70">({count})</span> : null}
              </button>
            );
          })}
        </div>
      </nav>

      <section className="border-b border-kado-dark/10 bg-white px-6 py-14 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="kado-h2 uppercase tracking-tight text-kado-dark">{pageCopy.whyJoinTitle}</h2>
          <p className="mt-4 kado-body text-kado-dark/65 leading-relaxed">{pageCopy.whyJoinBody}</p>
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
            <div className="mx-auto max-w-6xl">
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
                <p className="rounded-[1.25rem] border border-kado-dark/10 bg-white/70 px-6 py-10 text-center kado-body text-kado-dark/55">
                  {pageCopy.emptyMessage}
                </p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {items.map((listing) => (
                    <div key={listing.id} className="h-full">
                      <CareerRoleCard listing={listing} onApply={() => setApplyListing(listing)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}

      <PageSeoBlurb />

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
