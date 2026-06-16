import AboutSection2 from '../ui/about-section-2';
import type { BrandStoryCopy } from '../../store/landingContentStore';

type Props = { copy: BrandStoryCopy; cmsEditMode?: boolean };

/** Homepage brand story block — see `about-section-2`. */
export default function HomeSeoIntro({ copy, cmsEditMode }: Props) {
  return <AboutSection2 copy={copy} cmsEditMode={cmsEditMode} />;
}
