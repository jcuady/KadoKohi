import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { ABOUT_CTA } from '@/content/aboutPage';
import { AboutSectionShell } from './AboutUi';
import { AboutEditorialGrid, EditorialHeadline } from './AboutEditorial';

export default function AboutCta() {
  return (
    <AboutSectionShell
      className="relative overflow-hidden border-kado-cream/10 bg-kado-red text-kado-cream"
      innerClassName="max-w-5xl"
    >
      <AboutEditorialGrid dark className="absolute inset-0" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between"
      >
        <div className="min-w-0">
          <EditorialHeadline
            as="h2"
            dark
            lines={[
              [{ text: 'Find Your', accent: false }],
              [{ text: 'Corner', accent: true }],
            ]}
            size="section"
            className="mb-3 !text-kado-cream [&_span.text-kado-red]:text-kado-cream"
          />
          <p className="kado-body max-w-md text-kado-cream/85">{ABOUT_CTA.body}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            to={ABOUT_CTA.primaryTo}
            className="kado-label inline-flex min-h-[48px] items-center justify-center gap-2 border border-kado-cream bg-kado-cream px-8 py-3 text-kado-dark transition-colors hover:bg-kado-cream-light"
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {ABOUT_CTA.primaryLabel}
          </Link>
          <Link
            to={ABOUT_CTA.secondaryTo}
            className="kado-label inline-flex min-h-[48px] items-center justify-center gap-2 border border-kado-cream/40 px-8 py-3 text-kado-cream transition-colors hover:bg-kado-cream/10"
          >
            {ABOUT_CTA.secondaryLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </motion.div>
    </AboutSectionShell>
  );
}
