import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { ABOUT_CTA } from '@/content/aboutPage';
import { AboutSectionShell } from './AboutUi';

export default function AboutCta() {
  return (
    <AboutSectionShell
      className="relative overflow-hidden border-kado-dark/10 bg-kado-dark text-kado-cream"
      innerClassName="max-w-5xl"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(158,24,29,0.35),transparent_50%)]"
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left"
      >
        <div className="min-w-0">
          <h2 className="kado-h2 mb-2 text-kado-cream">{ABOUT_CTA.title}</h2>
          <p className="kado-body max-w-md text-kado-cream/75">{ABOUT_CTA.body}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            to={ABOUT_CTA.primaryTo}
            className="kado-label inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-kado-red px-8 py-3 text-kado-cream transition-colors hover:bg-kado-red-hover"
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {ABOUT_CTA.primaryLabel}
          </Link>
          <Link
            to={ABOUT_CTA.secondaryTo}
            className="kado-label inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-kado-cream/35 px-8 py-3 text-kado-cream transition-colors hover:bg-kado-cream/10"
          >
            {ABOUT_CTA.secondaryLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </motion.div>
    </AboutSectionShell>
  );
}
