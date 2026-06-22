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

/** Editorial About page — Hatton-inspired layout, Kado Kohi brand tokens. */
export default function AboutPageContent() {
  return (
    <div className="flex w-full min-w-0 flex-col overflow-x-clip bg-kado-cream text-kado-dark">
      <AboutHero />
      <AboutOrigins />
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
