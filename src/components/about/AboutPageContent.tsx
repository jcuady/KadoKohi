import PageSeoBlurb from '@/components/seo/PageSeoBlurb';
import AboutHero from './AboutHero';
import AboutPhilosophy from './AboutPhilosophy';
import AboutSignatureGallery from './AboutSignatureGallery';
import AboutCommitment from './AboutCommitment';
import AboutWisdom from './AboutWisdom';
import AboutGallery from './AboutGallery';
import AboutTimeline from './AboutTimeline';
import AboutVoices from './AboutVoices';
import AboutCta from './AboutCta';

/**
 * Museum-gallery About page — editorial arches, parallax, 3D cup, Kado brand tokens.
 * Layout inspired by modern specialty-coffee editorial sites; content is Kado Kohi.
 */
export default function AboutPageContent() {
  return (
    <div className="flex w-full min-w-0 flex-col bg-kado-cream text-kado-dark">
      <AboutHero />
      <AboutPhilosophy />
      <AboutSignatureGallery />
      <AboutCommitment />
      <AboutWisdom />
      <AboutGallery />
      <AboutTimeline />
      <AboutVoices />
      <AboutCta />
      <PageSeoBlurb />
    </div>
  );
}
