import PageSeoBlurb from '@/components/seo/PageSeoBlurb';
import AboutHero from './AboutHero';
import AboutStats from './AboutStats';
import AboutOrigins from './AboutOrigins';
import AboutCommitment from './AboutCommitment';
import AboutValues from './AboutValues';
import AboutTimeline from './AboutTimeline';
import AboutSpace from './AboutSpace';
import AboutExperience from './AboutExperience';
import AboutCta from './AboutCta';

/** Immersive About page — Motion + GSAP scroll + Three.js hero accent. */
export default function AboutPageContent() {
  return (
    <div className="flex w-full min-w-0 flex-col bg-kado-cream text-kado-dark">
      <AboutHero />
      <AboutStats />
      <AboutOrigins />
      <AboutCommitment />
      <AboutValues />
      <AboutTimeline />
      <AboutSpace />
      <AboutExperience />
      <AboutCta />
      <PageSeoBlurb />
    </div>
  );
}
