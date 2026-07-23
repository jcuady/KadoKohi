import { motion } from 'motion/react';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BranchesStripCopy } from '../../store/landingContentStore';
import CmsStyledText from '../cms/CmsStyledText';
import { cmsTextProps } from '../../lib/cmsFieldBind';
import { useLandingContentStore } from '../../store/landingContentStore';
import { useBranchStore } from '../../store/branchStore';
import ResilientImage from '../ui/ResilientImage';

const BRANCH_FALLBACK_IMAGES: Record<string, string> = {
  branch_marikina: '/featuredmarikina/kadom1.webp',
  branch_greenhills: '/featuredmarikina/kadom2.webp',
};

type Props = { copy: BranchesStripCopy; cmsEditMode?: boolean };

export default function BranchesStrip({ copy, cmsEditMode }: Props) {
  const updateBranchesStrip = useLandingContentStore((s) => s.updateBranchesStrip);
  const branches = useBranchStore((s) => s.branches);

  const fmt = (hours: { day: string; open: string; close: string }[]) => {
    if (!hours.length) return null;
    const mon = hours.find((h) => h.day === 'mon');
    return mon ? `${mon.open} – ${mon.close}` : null;
  };

  return (
    <section className="landing-section relative w-full overflow-hidden border-t border-white/5 bg-kado-dark">
      <div
        aria-hidden
        className="kado-kanji-watermark -right-4 bottom-0 text-[clamp(9rem,24vw,16rem)] text-white/[0.04]"
      >
        角
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-[1400px]"
      >
        <div className="mb-6 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between md:gap-6">
          <div>
            <CmsStyledText
              value={copy.badge}
              as="span"
              className="kado-label mb-3 inline-flex rounded-full border border-kado-red/25 bg-kado-red/10 px-3 py-1.5"
              defaultColorClass="text-kado-red"
              {...cmsTextProps(cmsEditMode, 'branches.badge', 'Badge', (v) => updateBranchesStrip({ badge: v }))}
            />
            <CmsStyledText
              value={copy.title}
              as="h2"
              className="kado-h2"
              defaultColorClass="text-kado-cream"
              {...cmsTextProps(cmsEditMode, 'branches.title', 'Title', (v) => updateBranchesStrip({ title: v }))}
            />
          </div>
          <Link
            to="/branches"
            className="kado-label inline-flex min-h-[44px] items-center gap-1 text-kado-cream/60 transition-colors hover:text-kado-cream"
          >
            <CmsStyledText
              value={copy.ctaLabel}
              as="span"
              {...cmsTextProps(cmsEditMode, 'branches.ctaLabel', 'CTA label', (v) =>
                updateBranchesStrip({ ctaLabel: v }),
              )}
            />{' '}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <motion.div
          className="grid gap-5 sm:grid-cols-2 sm:gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
        >
          {branches.map((branch, i) => {
            const hours = fmt(branch.hours);
            const isActive = branch.status === 'active';
            const photo = branch.heroImage?.trim() || BRANCH_FALLBACK_IMAGES[branch.id] || '/images/hero-interior.png';

            return (
              <motion.div
                key={branch.id}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
                }}
                className={i === 0 && branches.length > 1 ? 'sm:row-span-1' : ''}
              >
                <Link
                  to="/branches"
                  className="group relative block min-h-[240px] overflow-hidden rounded-2xl border border-white/10 sm:min-h-[320px] sm:rounded-[2rem]"
                >
                  <ResilientImage
                    src={photo}
                    alt={`${branch.name} — ${branch.city}`}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    width={800}
                    height={600}
                    sizes="(max-width: 640px) 100vw, 50vw"
                    srcSet={
                      photo.includes('kadom1')
                        ? '/featuredmarikina/kadom1-sm.webp 480w, /featuredmarikina/kadom1.webp 800w'
                        : photo.includes('kadom2')
                          ? '/featuredmarikina/kadom2-sm.webp 480w, /featuredmarikina/kadom2.webp 800w'
                          : undefined
                    }
                    displayWidth={800}
                    fallbackSrc={BRANCH_FALLBACK_IMAGES[branch.id]}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-kado-dark via-kado-dark/55 to-kado-dark/20" />
                  <div className="absolute inset-0 bg-gradient-to-br from-kado-red/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative flex h-full min-h-[240px] flex-col justify-between p-5 sm:min-h-[320px] sm:p-8">
                    <div>
                      <span
                        className={`kado-label inline-flex items-center rounded-full border px-3 py-1 ${
                          isActive
                            ? 'border-kado-cream/30 bg-kado-cream/15 text-kado-cream'
                            : 'border-kado-red/40 bg-kado-red/20 text-kado-cream'
                        }`}
                      >
                        {isActive ? 'Open now' : 'Coming soon'}
                      </span>
                    </div>

                    <div>
                      <h3 className="kado-h3 mb-2 text-kado-offwhite transition-colors group-hover:text-kado-cream">
                        {branch.name}
                      </h3>
                      <p className="flex items-start gap-1.5 kado-body-sm text-kado-cream/75">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-kado-red" aria-hidden />
                        <span className="line-clamp-2">
                          {branch.address}, {branch.city}
                        </span>
                      </p>
                      {hours && (
                        <p className="kado-subtext mt-2 flex items-center gap-1.5 text-kado-cream/55">
                          <Clock className="h-3 w-3 shrink-0" aria-hidden />
                          {hours} daily
                        </p>
                      )}
                      <p className="kado-label mt-3 inline-flex items-center gap-2 text-kado-red transition-transform group-hover:translate-x-1 sm:mt-4">
                        View branch <ArrowRight className="h-3.5 w-3.5" />
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}
