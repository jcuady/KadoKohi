import { useRef } from 'react';
import { motion } from 'motion/react';
import ResilientImage from '@/components/ui/ResilientImage';
import { ABOUT_EDITORIAL, ABOUT_ORIGINS } from '@/content/aboutPage';
import { AboutSectionShell } from './AboutUi';
import {
  AboutEditorialGrid,
  EditorialColumns,
  EditorialHeadline,
} from './AboutEditorial';
import { useParallaxY } from './useAboutMotion';
import { useLandingContentStore, type AboutPageCopy } from '@/store/landingContentStore';
import CmsStyledText from '@/components/cms/CmsStyledText';
import { cmsTextPlain } from '@/lib/cmsTypography';

type Props = {
  /** Admin preview / draft override. Public page uses published store. */
  copy?: AboutPageCopy;
};

export default function AboutOrigins({ copy: copyProp }: Props) {
  const published = useLandingContentStore((s) => s.published.aboutPage);
  const copy = copyProp ?? published;

  const imageWrapRef = useRef<HTMLDivElement>(null);
  useParallaxY(imageWrapRef, 14);

  const imageSrc = copy.originsImageSrc?.trim() || ABOUT_ORIGINS.imageSrc;
  const imageFallback = copy.originsImageFallback?.trim() || ABOUT_ORIGINS.imageFallback;
  const imageAlt = cmsTextPlain(copy.originsImageAlt) || ABOUT_ORIGINS.imageAlt;

  return (
    <AboutSectionShell className="bg-kado-cream" innerClassName="max-w-none">
      <AboutEditorialGrid className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-0">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-8%' }}
            transition={{ duration: 0.6 }}
            className="relative lg:col-span-5 lg:pr-8"
          >
            <div
              ref={imageWrapRef}
              className="relative aspect-[4/5] max-h-[min(520px,65vh)] overflow-hidden border border-kado-dark/10 lg:max-h-none"
            >
              <ResilientImage
                src={imageSrc}
                fallbackSrc={imageFallback}
                alt={imageAlt}
                className="about-editorial-photo h-full w-full object-cover"
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-3 -right-3 hidden h-20 w-20 border-2 border-kado-red bg-kado-red/10 lg:block"
            />
          </motion.div>

          <div className="flex flex-col justify-center lg:col-span-7 lg:border-l lg:border-kado-dark/10 lg:pl-10 xl:pl-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <CmsStyledText
                value={copy.originsEyebrow}
                as="p"
                className="kado-label mb-4"
                defaultColorClass="text-kado-red"
              />
              <EditorialHeadline as="h2" lines={ABOUT_EDITORIAL.aboutLines} size="section" className="mb-6" />
              <CmsStyledText
                value={copy.originsLead}
                as="p"
                className="kado-body mb-8 font-semibold"
                defaultColorClass="text-kado-dark/90"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <EditorialColumns>
                <CmsStyledText value={copy.originsParagraph1} as="p" defaultColorClass="text-kado-dark/80" />
                <CmsStyledText value={copy.originsParagraph2} as="p" defaultColorClass="text-kado-dark/80" />
              </EditorialColumns>
            </motion.div>
          </div>
        </div>
      </AboutEditorialGrid>
    </AboutSectionShell>
  );
}
