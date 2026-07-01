import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { MixMatchSectionCopy } from '../../store/landingContentStore';
import { useLandingContentStore } from '../../store/landingContentStore';
import CmsStyledText from '../cms/CmsStyledText';
import CmsEditableImage from '../cms/CmsEditableImage';
import { cmsTextProps } from '../../lib/cmsFieldBind';
import ResilientImage from '../ui/ResilientImage';

type Props = {
  copy: MixMatchSectionCopy;
  cmsEditMode?: boolean;
};

export default function MixMatchHomeSection({ copy, cmsEditMode }: Props) {
  const updateSchedule = useLandingContentStore((s) => s.updateSchedule);

  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-12 lg:px-24 w-full bg-[#1e4d8c] text-kado-cream">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
      >
        <div>
          <span className="inline-flex items-center gap-2 kado-label text-kado-cream/90 bg-white/10 px-3 py-2 rounded-full border border-white/15 mb-6">
            <CmsStyledText
              value={copy.badge}
              as="span"
              {...cmsTextProps(cmsEditMode, 'mix-match.badge', 'Badge', (v) => updateSchedule({ badge: v }))}
            />
          </span>
          <h2 className="kado-h2 leading-[1.05] mb-5">
            <CmsStyledText
              value={copy.titleTop}
              as="span"
              {...cmsTextProps(cmsEditMode, 'mix-match.titleTop', 'Title top', (v) => updateSchedule({ titleTop: v }))}
            />{' '}
            <CmsStyledText
              value={copy.titleBottom}
              as="span"
              defaultColorClass="text-kado-red"
              {...cmsTextProps(cmsEditMode, 'mix-match.titleBottom', 'Title bottom', (v) =>
                updateSchedule({ titleBottom: v }),
              )}
            />
          </h2>
          <CmsStyledText
            value={copy.description}
            as="p"
            className="kado-body md:text-base max-w-xl mb-6"
            defaultColorClass="text-kado-cream/85"
            {...cmsTextProps(cmsEditMode, 'mix-match.description', 'Description', (v) =>
              updateSchedule({ description: v }),
            )}
          />
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span className="inline-flex rounded-full bg-kado-red text-kado-cream px-4 py-2 text-xs font-black uppercase tracking-wider">
              <CmsStyledText
                value={copy.offerBadge}
                as="span"
                {...cmsTextProps(cmsEditMode, 'mix-match.offerBadge', 'Offer badge', (v) =>
                  updateSchedule({ offerBadge: v }),
                )}
              />
            </span>
            <CmsStyledText
              value={copy.offerNote}
              as="span"
              className="text-sm"
              defaultColorClass="text-kado-cream/70"
              {...cmsTextProps(cmsEditMode, 'mix-match.offerNote', 'Offer note', (v) => updateSchedule({ offerNote: v }))}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/pastries"
              className="inline-flex items-center gap-2 rounded-full bg-kado-cream text-kado-dark px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
            >
              <CmsStyledText
                value={copy.ctaLabel}
                as="span"
                {...cmsTextProps(cmsEditMode, 'mix-match.ctaLabel', 'CTA label', (v) => updateSchedule({ ctaLabel: v }))}
              />
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
            >
              <CmsStyledText
                value={copy.featuredCtaLabel}
                as="span"
                {...cmsTextProps(cmsEditMode, 'mix-match.featuredCtaLabel', 'Featured CTA', (v) =>
                  updateSchedule({ featuredCtaLabel: v }),
                )}
              />
            </Link>
          </div>
        </div>

        <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl aspect-[4/5] max-h-[min(70vh,560px)] mx-auto w-full max-w-md lg:max-w-none">
          {cmsEditMode ? (
            <CmsEditableImage
              cmsField="mix-match.poster"
              cmsLabel="Mix & Match poster"
              src={copy.posterImageUrl}
              alt="Mix & Match promotion"
              className="absolute inset-0 h-full w-full"
              onImageChange={(url) => updateSchedule({ posterImageUrl: url })}
            />
          ) : (
            <ResilientImage
              src={copy.posterImageUrl}
              alt="Mix & Match promotion"
              className="h-full w-full object-cover"
            />
          )}
        </div>
      </motion.div>
    </section>
  );
}
