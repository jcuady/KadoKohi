import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { ABOUT_CTA } from '@/content/aboutPage';
import { AboutSectionShell } from './AboutUi';

export default function AboutCta() {
  return (
    <AboutSectionShell
      className="about-cloud-section relative overflow-hidden border-kado-dark/10"
      innerClassName="max-w-5xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-kado-dark/10 bg-white/80 p-8 shadow-[0_24px_60px_rgba(25,25,25,0.08)] backdrop-blur-md sm:p-10"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 font-display text-[7rem] font-black text-kado-red/[0.06]"
        >
          角
        </div>
        <div className="relative flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left">
          <div className="min-w-0">
            <p className="kado-label mb-2 text-kado-red">Join our corner</p>
            <h2 className="kado-h2 text-kado-dark">{ABOUT_CTA.title}</h2>
            <p className="kado-body mt-3 max-w-md text-kado-dark/70">{ABOUT_CTA.body}</p>
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
              className="kado-label inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-kado-dark/15 bg-kado-cream/50 px-8 py-3 text-kado-dark transition-colors hover:border-kado-red/30"
            >
              {ABOUT_CTA.secondaryLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </motion.div>
    </AboutSectionShell>
  );
}
