import type { CmsText } from '../../lib/cmsTypography';
import CmsStyledText from '../cms/CmsStyledText';
import CmsEditableImage from '../cms/CmsEditableImage';
import { cmsTextPlain } from '../../lib/cmsTypography';
import { cmsTextProps } from '../../lib/cmsFieldBind';
import { useLandingContentStore } from '../../store/landingContentStore';
import { ChevronRight, ExternalLink, Quote, Star } from 'lucide-react';
import type { GoogleReviewsListing } from '../../content/kadoGoogleReviews';
import { motion, useAnimation, useInView } from 'motion/react';
import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

export interface Testimonial {
  id: number;
  name: CmsText;
  role: CmsText;
  company: CmsText;
  content: CmsText;
  rating: number;
  avatar: string;
}

export interface TrustedBrandItem {
  label: CmsText;
  imageUrl?: string;
}

export interface AnimatedTestimonialsProps {
  title?: CmsText;
  subtitle?: CmsText;
  badgeText?: CmsText;
  testimonials?: Testimonial[];
  autoRotateInterval?: number;
  trustedCompanies?: TrustedBrandItem[];
  trustedCompaniesTitle?: CmsText;
  googleListing?: GoogleReviewsListing;
  className?: string;
  cmsEditMode?: boolean;
}

function TestimonialAvatar({
  testimonial,
  index,
  cmsEditMode,
  compact,
}: {
  testimonial: Testimonial;
  index: number;
  cmsEditMode?: boolean;
  compact?: boolean;
}) {
  const updateTestimonialItem = useLandingContentStore((s) => s.updateTestimonialItem);
  const size = compact ? 'h-8 w-8' : 'h-10 w-10';

  if (testimonial.avatar?.trim()) {
    return cmsEditMode ? (
      <CmsEditableImage
        cmsField={`testimonials.item.${index}.avatar`}
        cmsLabel={`Avatar ${index + 1}`}
        src={testimonial.avatar}
        alt={cmsTextPlain(testimonial.name)}
        className={cn(size, 'rounded-full')}
        onImageChange={(url) => updateTestimonialItem(index, { avatar: url })}
      />
    ) : (
      <img
        src={testimonial.avatar}
        alt={cmsTextPlain(testimonial.name)}
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  if (cmsEditMode) {
    return (
      <CmsEditableImage
        cmsField={`testimonials.item.${index}.avatar`}
        cmsLabel={`Avatar ${index + 1}`}
        src="/logo/Logo1.png"
        alt={cmsTextPlain(testimonial.name)}
        className={cn(size, 'rounded-full')}
        onImageChange={(url) => updateTestimonialItem(index, { avatar: url })}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center font-display text-xs font-bold text-kado-red sm:text-sm">
      {cmsTextPlain(testimonial.name).charAt(0)}
    </div>
  );
}

function TestimonialCard({
  testimonial,
  index,
  cmsEditMode,
  compact,
  className,
}: {
  testimonial: Testimonial;
  index: number;
  cmsEditMode?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const updateTestimonialItem = useLandingContentStore((s) => s.updateTestimonialItem);

  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-xl border border-kado-dark/8 bg-white shadow-[0_8px_28px_rgba(25,25,25,0.06)] sm:rounded-2xl',
        compact ? 'p-3.5' : 'break-inside-avoid p-5 sm:p-6 lg:mb-5',
        index === 0 && 'border-kado-red/15 bg-gradient-to-br from-white to-kado-cream/40',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <Quote className={cn('shrink-0 text-kado-red/20', compact ? 'h-5 w-5' : 'h-7 w-7')} aria-hidden />
        <div className="flex gap-0.5" aria-hidden>
          {Array(testimonial.rating)
            .fill(0)
            .map((_, i) => (
              <Star
                key={i}
                className={cn('fill-kado-red text-kado-red', compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5')}
              />
            ))}
        </div>
      </div>

      <p
        className={cn(
          'font-medium text-kado-dark',
          compact ? 'kado-body-sm line-clamp-4 leading-snug' : 'kado-body leading-relaxed',
        )}
      >
        &ldquo;
        <CmsStyledText
          value={testimonial.content}
          as="span"
          {...cmsTextProps(cmsEditMode, `testimonials.item.${index}.content`, `Quote ${index + 1}`, (v) =>
            updateTestimonialItem(index, { content: v }),
          )}
        />
        &rdquo;
      </p>

      <div
        className={cn(
          'mt-auto flex items-center gap-2.5 border-t border-kado-dark/8',
          compact ? 'mt-3 pt-2.5' : 'mt-5 gap-3 pt-4',
        )}
      >
        <div
          className={cn(
            'shrink-0 overflow-hidden rounded-full border-2 border-kado-red/20 bg-kado-cream',
            compact ? 'h-8 w-8' : 'h-10 w-10',
          )}
        >
          <TestimonialAvatar testimonial={testimonial} index={index} cmsEditMode={cmsEditMode} compact={compact} />
        </div>
        <div className="min-w-0">
          <CmsStyledText
            value={testimonial.name}
            as="p"
            className={cn('truncate font-semibold', compact ? 'text-xs' : 'text-sm')}
            defaultColorClass="text-kado-dark"
            {...cmsTextProps(cmsEditMode, `testimonials.item.${index}.name`, `Name ${index + 1}`, (v) =>
              updateTestimonialItem(index, { name: v }),
            )}
          />
          <p className={cn('truncate text-kado-dark/50', compact ? 'text-[10px]' : 'text-xs')}>
            <CmsStyledText
              value={testimonial.role}
              as="span"
              {...cmsTextProps(cmsEditMode, `testimonials.item.${index}.role`, `Role ${index + 1}`, (v) =>
                updateTestimonialItem(index, { role: v }),
              )}
            />
          </p>
        </div>
      </div>
    </article>
  );
}

export function AnimatedTestimonials({
  title = 'Loved by the community',
  subtitle = "Don't just take our word for it. Hear from our regulars.",
  badgeText = 'Trusted by customers',
  testimonials = [],
  trustedCompanies = [],
  trustedCompaniesTitle = 'Friends of the corner',
  googleListing,
  className,
  cmsEditMode,
}: AnimatedTestimonialsProps) {
  const updateTestimonials = useLandingContentStore((s) => s.updateTestimonials);
  const updateTrustedBrand = useLandingContentStore((s) => s.updateTrustedBrand);

  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) void controls.start('visible');
  }, [isInView, controls]);

  if (testimonials.length === 0) return null;

  const visible = testimonials.slice(0, 6);
  const mobileCarouselItems = visible.slice(0, 4);

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className={cn('landing-section relative overflow-hidden bg-kado-offwhite', className)}
    >
      <div
        aria-hidden
        className="kado-kanji-watermark -left-4 top-4 text-[clamp(5rem,14vw,13rem)] text-kado-red/[0.04] md:top-8 md:text-kado-red/[0.05]"
      >
        角
      </div>

      <div className="relative mx-auto max-w-[1200px] min-w-0">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
          }}
        >
          <motion.header
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="mb-5 max-w-2xl md:mb-14"
          >
            <div className="mb-2 md:mb-4">
              {badgeText ? (
                <div className="kado-label inline-flex items-center gap-1.5 rounded-full bg-kado-red/10 px-3 py-1 text-kado-red">
                  <Star className="h-3 w-3 fill-kado-red" aria-hidden />
                  <CmsStyledText
                    value={badgeText}
                    as="span"
                    {...cmsTextProps(cmsEditMode, 'testimonials.badge', 'Badge', (v) =>
                      updateTestimonials({ badge: v }),
                    )}
                  />
                </div>
              ) : null}
            </div>

            <CmsStyledText
              value={title}
              as="h2"
              className="kado-h3 text-kado-dark sm:kado-h2"
              {...cmsTextProps(cmsEditMode, 'testimonials.title', 'Title', (v) =>
                updateTestimonials({ title: v }),
              )}
            />

            <CmsStyledText
              value={subtitle}
              as="p"
              className="mt-2 line-clamp-3 max-w-xl text-sm md:mt-4 md:line-clamp-none md:text-base"
              defaultSizeClass="kado-body-sm md:kado-body"
              defaultColorClass="text-kado-dark/60"
              {...cmsTextProps(cmsEditMode, 'testimonials.subtitle', 'Subtitle', (v) =>
                updateTestimonials({ subtitle: v }),
              )}
            />

            {googleListing ? (
              <a
                href={googleListing.reviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 text-xs font-semibold text-kado-red transition-colors hover:text-kado-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2 sm:mt-5 sm:min-h-[44px] sm:gap-2 sm:text-sm"
              >
                Read all {googleListing.reviewCount} on Google
                <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
              </a>
            ) : null}
          </motion.header>

          {/* Mobile: compact horizontal snap carousel (public site only) */}
          {!cmsEditMode ? (
            <div className="relative md:hidden">
              <div
                className="scrollbar-hide -mx-[max(1rem,env(safe-area-inset-left))] flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain scroll-smooth px-[max(1rem,env(safe-area-inset-left))] pb-1 scroll-pl-[max(1rem,env(safe-area-inset-left))] scroll-pr-8 touch-pan-x"
                aria-label="Customer reviews carousel"
              >
                {mobileCarouselItems.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.id}
                    variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                    className="w-[min(82vw,18.5rem)] shrink-0 snap-center"
                  >
                    <TestimonialCard
                      testimonial={testimonial}
                      index={index}
                      cmsEditMode={cmsEditMode}
                      compact
                      className="min-h-[11.5rem]"
                    />
                  </motion.div>
                ))}
              </div>
              {mobileCarouselItems.length > 1 ? (
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <ChevronRight className="h-3 w-3 text-kado-dark/30" aria-hidden />
                  <p className="kado-subtext text-[10px] font-semibold uppercase tracking-[0.16em] text-kado-dark/40">
                    Swipe for more
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Masonry grid — desktop public site; all breakpoints in CMS edit */}
          <div
            className={cn(
              'columns-1 gap-4 sm:columns-2 lg:gap-5',
              cmsEditMode ? 'block' : 'hidden md:block',
            )}
          >
            {visible.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                className="mb-4 lg:mb-5"
              >
                <TestimonialCard testimonial={testimonial} index={index} cmsEditMode={cmsEditMode} />
              </motion.div>
            ))}
          </div>

          {trustedCompanies.length > 0 ? (
            <motion.div
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              className="mt-8 border-t border-kado-dark/8 pt-6 text-center md:mt-16 md:pt-10"
            >
              <CmsStyledText
                value={trustedCompaniesTitle}
                as="p"
                className="mb-4 text-xs font-semibold uppercase tracking-widest md:mb-6"
                defaultColorClass="text-kado-dark/40"
                {...cmsTextProps(cmsEditMode, 'testimonials.trustedTitle', 'Trusted row title', (v) =>
                  updateTestimonials({ trustedTitle: v }),
                )}
              />
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:gap-x-8 md:gap-y-4">
                {trustedCompanies
                  .filter((c) => cmsTextPlain(c.label).trim() || c.imageUrl?.trim())
                  .map((company, bi) => (
                    <div key={`${cmsTextPlain(company.label)}-${company.imageUrl ?? 'text'}`}>
                      {company.imageUrl?.trim() ? (
                        cmsEditMode ? (
                          <CmsEditableImage
                            cmsField={`testimonials.trustedBrand.${bi}.image`}
                            cmsLabel={`Brand ${bi + 1} logo`}
                            src={company.imageUrl}
                            alt={cmsTextPlain(company.label)}
                            className="h-7 w-auto max-w-[100px] object-contain opacity-70 md:h-10 md:max-w-[120px]"
                            onImageChange={(url) => updateTrustedBrand(bi, { imageUrl: url })}
                          />
                        ) : (
                          <img
                            src={company.imageUrl}
                            alt={cmsTextPlain(company.label)}
                            className="h-7 w-auto max-w-[100px] object-contain opacity-70 md:h-10 md:max-w-[120px]"
                          />
                        )
                      ) : (
                        <CmsStyledText
                          value={company.label}
                          as="span"
                          className="font-display text-base font-bold tracking-tight opacity-60 md:text-lg"
                          defaultColorClass="text-kado-dark/30"
                          {...cmsTextProps(
                            cmsEditMode,
                            `testimonials.trustedBrand.${bi}.label`,
                            `Brand ${bi + 1}`,
                            (v) => updateTrustedBrand(bi, { label: v }),
                          )}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
