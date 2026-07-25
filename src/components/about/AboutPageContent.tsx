import PageSeoBlurb from '@/components/seo/PageSeoBlurb';
import AboutHero from './AboutHero';
import AboutOrigins from './AboutOrigins';
import { AboutMarqueeBand } from './AboutEditorial';
import AboutCommitment from './AboutCommitment';
import AboutValues from './AboutValues';
import AboutTimeline from './AboutTimeline';
import AboutSpace from './AboutSpace';
import AboutExperience from './AboutExperience';
import AboutCta from './AboutCta';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';

/** Editorial About page — Hatton-inspired layout, Kado Kohi brand tokens. */
export default function AboutPageContent() {
  // Same draft/preview rules as homepage (`?preview=1` / admin preview session).
  const aboutPage = useLandingPageContent().aboutPage;

  return (
    <div className="flex w-full min-w-0 flex-col overflow-x-clip bg-kado-cream text-kado-dark">
      <AboutHero copy={aboutPage} />
      <AboutOrigins copy={aboutPage} />
      <AboutMarqueeBand />
      <AboutCommitment />
      <AboutValues />
      <AboutMarqueeBand reverse />
      <AboutTimeline />
      <AboutSpace />
      <AboutExperience />
      <AboutCta />
      <PageSeoBlurb />
    </div>
  );
}
