import { motion } from 'motion/react';
import { AnimatedTestimonials } from '../ui/animated-testimonials';
import { KadoOrderingCarousel } from '../ui/animated-feature-carousel';
import KadoCircleCTA from '../ui/cta-with-text-marquee';
import HomeFaqSection from './HomeFaqSection';
import HomeHeroSlider from '../ui/home-hero-slider';
import HomeSeoIntro from './HomeSeoIntro';
import HomePageSeoSection from '../seo/HomePageSeoSection';
import FeaturedCoffeesSection from './FeaturedCoffeesSection';
import EventsSection from './EventsSection';
import BranchesStrip from './BranchesStrip';
import { KADO_GOOGLE_LISTING } from '../../content/kadoGoogleReviews';
import type { LandingContentState } from '../../store/landingContentStore';
import type { LandingTabId } from '../../lib/landingCmsTabs';

type Props = {
  landing: LandingContentState;
  previewBanner?: boolean;
  sectionOnly?: LandingTabId;
  cmsEditMode?: boolean;
};

function showSection(id: LandingTabId, sectionOnly?: LandingTabId) {
  return !sectionOnly || sectionOnly === id;
}

/**
 * Homepage section order — conversion funnel first (UiUX.md 11 elements),
 * SEO crawl blocks (story + menu-seo) after final CTA.
 */
export default function HomePageContent({ landing, previewBanner, sectionOnly, cmsEditMode }: Props) {
  return (
    <motion.div
      initial={false}
      className="flex w-full min-w-0 flex-col gap-0 overflow-x-hidden bg-kado-cream font-sans text-kado-dark"
    >
      {previewBanner ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-[100] bg-amber-500 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-kado-dark shadow-md"
        >
          Preview mode — unpublished changes only
        </motion.div>
      ) : null}

      {showSection('hero', sectionOnly) ? (
        <HomeHeroSlider slides={landing.heroSlides} chrome={landing.heroChrome} cmsEditMode={cmsEditMode} />
      ) : null}

      {showSection('featured', sectionOnly) ? (
        <div id="landing-featured">
          <FeaturedCoffeesSection copy={landing.featured} cmsEditMode={cmsEditMode} />
        </div>
      ) : null}

      {showSection('ordering', sectionOnly) ? (
        <div id="landing-ordering">
          <KadoOrderingCarousel copy={landing.ordering} cmsEditMode={cmsEditMode} />
        </div>
      ) : null}

      {showSection('testimonials', sectionOnly) ? (
        <div id="landing-testimonials">
          <AnimatedTestimonials
            badgeText={landing.testimonials.badge}
            title={landing.testimonials.title}
            subtitle={landing.testimonials.subtitle}
            trustedCompaniesTitle={landing.testimonials.trustedTitle}
            trustedCompanies={landing.trustedBrands}
            testimonials={landing.testimonialItems}
            googleListing={KADO_GOOGLE_LISTING}
            cmsEditMode={cmsEditMode}
          />
        </div>
      ) : null}

      {showSection('events', sectionOnly) ? (
        <div id="landing-events">
          <EventsSection copy={landing.events} cmsEditMode={cmsEditMode} />
        </div>
      ) : null}

      {showSection('branches', sectionOnly) ? (
        <div id="landing-branches">
          <BranchesStrip copy={landing.branchesStrip} cmsEditMode={cmsEditMode} />
        </div>
      ) : null}

      {showSection('faq', sectionOnly) ? (
        <HomeFaqSection copy={landing.faq} cmsEditMode={cmsEditMode} />
      ) : null}

      {showSection('kado-circle', sectionOnly) ? (
        <div id="landing-kado-circle">
          <KadoCircleCTA copy={landing.kadoCircle} cmsEditMode={cmsEditMode} />
        </div>
      ) : null}

      {showSection('story', sectionOnly) ? (
        <div id="landing-story">
          <HomeSeoIntro copy={landing.storySeo} cmsEditMode={cmsEditMode} />
        </div>
      ) : null}

      {showSection('menu-seo', sectionOnly) ? (
        <div id="landing-menu-seo">
          <HomePageSeoSection copy={landing.menuSeo} cmsEditMode={cmsEditMode} />
        </div>
      ) : null}
    </motion.div>
  );
}
