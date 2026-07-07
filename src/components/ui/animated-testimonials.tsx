import type { CmsText } from '../../lib/cmsTypography';
import CmsStyledText from '../cms/CmsStyledText';
import CmsEditableImage from '../cms/CmsEditableImage';
import { cmsTextPlain } from '../../lib/cmsTypography';
import { cmsTextProps } from '../../lib/cmsFieldBind';
import { useLandingContentStore } from '../../store/landingContentStore';
import { ExternalLink, Quote, Star } from 'lucide-react';
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
  const updateTestimonialItem = useLandingContentStore((s) => s.updateTestimonialItem);
  const updateTrustedBrand = useLandingContentStore((s) => s.updateTrustedBrand);

  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) void controls.start('visible');
  }, [isInView, controls]);

  if (testimonials.length === 0) return null;

  const visible = testimonials.slice(0, 6);

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className={cn('landing-section relative overflow-hidden bg-kado-offwhite', className)}
    >
      <div
        aria-hidden
        className="kado-kanji-watermark -left-4 top-8 text-[clamp(7rem,18vw,13rem)] text-kado-red/[0.05]"
      >
        角
      </div>

      <div className="relative mx-auto max-w-[1200px] min-w-0 px-4 sm:px-6 md:px-8">
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
            className="mb-10 max-w-2xl md:mb-14"
          >
            {badgeText ? (
              <div className="kado-label mb-4 inline-flex items-center gap-1.5 rounded-full bg-kado-red/10 px-3 py-1 text-kado-red">
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

            <CmsStyledText
              value={title}
              as="h2"
              className="kado-h2 text-kado-dark"
              {...cmsTextProps(cmsEditMode, 'testimonials.title', 'Title', (v) =>
                updateTestimonials({ title: v }),
              )}
            />

            <CmsStyledText
              value={subtitle}
              as="p"
              className="mt-4 max-w-xl md:text-base"
              defaultSizeClass="kado-body"
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
                className="mt-5 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-kado-red transition-colors hover:text-kado-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2"
              >
                Read all {googleListing.reviewCount} reviews on Google
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
          </motion.header>

          <div className="columns-1 gap-4 sm:columns-2 lg:gap-5">
            {visible.map((testimonial, index) => (
              <motion.article
                key={testimonial.id}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                className={cn(
                  'mb-4 break-inside-avoid rounded-2xl border border-kado-dark/8 bg-white p-5 shadow-[0_12px_40px_rgba(25,25,25,0.06)] sm:p-6 lg:mb-5',
                  index === 0 && 'border-kado-red/15 bg-gradient-to-br from-white to-kado-cream/40',
                )}
              >
                <Quote className="mb-3 h-8 w-8 text-kado-red/20" aria-hidden />
                <div className="mb-4 flex gap-0.5" aria-hidden>
                  {Array(testimonial.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-kado-red text-kado-red" />
                    ))}
                </div>
                <p className="text-base font-medium leading-relaxed text-kado-dark">
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
                <div className="mt-5 flex items-center gap-3 border-t border-kado-dark/8 pt-4">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-kado-red/20 bg-kado-cream">
                    {testimonial.avatar?.trim() ? (
                      cmsEditMode ? (
                        <CmsEditableImage
                          cmsField={`testimonials.item.${index}.avatar`}
                          cmsLabel={`Avatar ${index + 1}`}
                          src={testimonial.avatar}
                          alt={cmsTextPlain(testimonial.name)}
                          className="h-10 w-10 rounded-full"
                          onImageChange={(url) => updateTestimonialItem(index, { avatar: url })}
                        />
                      ) : (
                        <img
                          src={testimonial.avatar}
                          alt={cmsTextPlain(testimonial.name)}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )
                    ) : cmsEditMode ? (
                      <CmsEditableImage
                        cmsField={`testimonials.item.${index}.avatar`}
                        cmsLabel={`Avatar ${index + 1}`}
                        src="/logo/Logo1.png"
                        alt={cmsTextPlain(testimonial.name)}
                        className="h-10 w-10 rounded-full"
                        onImageChange={(url) => updateTestimonialItem(index, { avatar: url })}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-sm font-bold text-kado-red">
                        {cmsTextPlain(testimonial.name).charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <CmsStyledText
                      value={testimonial.name}
                      as="p"
                      className="truncate text-sm font-semibold"
                      defaultColorClass="text-kado-dark"
                      {...cmsTextProps(cmsEditMode, `testimonials.item.${index}.name`, `Name ${index + 1}`, (v) =>
                        updateTestimonialItem(index, { name: v }),
                      )}
                    />
                    <p className="truncate text-xs text-kado-dark/50">
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
              </motion.article>
            ))}
          </div>

          {trustedCompanies.length > 0 ? (
            <motion.div
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              className="mt-14 border-t border-kado-dark/8 pt-10 text-center md:mt-16"
            >
              <CmsStyledText
                value={trustedCompaniesTitle}
                as="p"
                className="mb-6 text-xs font-semibold uppercase tracking-widest"
                defaultColorClass="text-kado-dark/40"
                {...cmsTextProps(cmsEditMode, 'testimonials.trustedTitle', 'Trusted row title', (v) =>
                  updateTestimonials({ trustedTitle: v }),
                )}
              />
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
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
                            className="h-8 w-auto max-w-[120px] object-contain opacity-70 md:h-10"
                            onImageChange={(url) => updateTrustedBrand(bi, { imageUrl: url })}
                          />
                        ) : (
                          <img
                            src={company.imageUrl}
                            alt={cmsTextPlain(company.label)}
                            className="h-8 w-auto max-w-[120px] object-contain opacity-70 md:h-10"
                          />
                        )
                      ) : (
                        <CmsStyledText
                          value={company.label}
                          as="span"
                          className="font-display text-lg font-bold tracking-tight opacity-60"
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
