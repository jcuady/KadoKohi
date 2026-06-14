import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { Separator } from "./separator"
import { ExternalLink, Quote, Star } from "lucide-react"
import type { GoogleReviewsListing } from "../../content/kadoGoogleReviews"
import { motion, useAnimation, useInView } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { cn } from "../../lib/utils"

export interface Testimonial {
  id: number
  name: string
  role: string
  company: string
  content: string
  rating: number
  avatar: string
}

export interface TrustedBrandItem {
  label: string
  imageUrl?: string
}

export interface AnimatedTestimonialsProps {
  title?: string
  subtitle?: string
  badgeText?: string
  testimonials?: Testimonial[]
  autoRotateInterval?: number
  trustedCompanies?: TrustedBrandItem[]
  trustedCompaniesTitle?: string
  googleListing?: GoogleReviewsListing
  className?: string
}

function formatReviewText(text: string) {
  return text.replace(/\s+/g, " ").replace(/…+/g, "…").trim()
}

export function AnimatedTestimonials({
  title = "Loved by the community",
  subtitle = "Don't just take our word for it. Hear from our regulars.",
  badgeText = "Trusted by customers",
  testimonials = [],
  autoRotateInterval = 6000,
  trustedCompanies = [],
  trustedCompaniesTitle = "Uses trusted brands worldwide",
  googleListing,
  className,
}: AnimatedTestimonialsProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })
  const controls = useAnimation()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: "easeOut" },
    },
  }

  useEffect(() => {
    if (isInView) controls.start("visible")
  }, [isInView, controls])

  useEffect(() => {
    if (autoRotateInterval <= 0 || testimonials.length <= 1) return
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length)
    }, autoRotateInterval)
    return () => clearInterval(interval)
  }, [autoRotateInterval, testimonials.length])

  if (testimonials.length === 0) return null

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className={cn("py-14 sm:py-20 md:py-24 overflow-hidden bg-kado-offwhite", className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 min-w-0">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="grid grid-cols-1 gap-16 w-full md:grid-cols-2 lg:gap-24"
        >
          {/* Left: heading & navigation dots */}
          <motion.div variants={itemVariants} className="flex flex-col justify-center">
            <div className="space-y-6">
              {badgeText && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full kado-label bg-kado-red/10 text-kado-red">
                  <Star className="h-3 w-3 fill-kado-red" />
                  <span>{badgeText}</span>
                </div>
              )}

              <h2 className="kado-h2 text-kado-dark">
                {title}
              </h2>

              <p className="max-w-[520px] kado-body md:text-base text-kado-dark/60">
                {subtitle}
              </p>

              {googleListing ? (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-kado-dark/5 px-3 py-1.5 text-sm font-semibold text-kado-dark">
                    <Star className="h-4 w-4 fill-kado-red text-kado-red" />
                    <span>
                      {googleListing.rating} on Google
                      <span className="font-normal text-kado-dark/55">
                        {" "}
                        · {googleListing.reviewCount} reviews
                      </span>
                    </span>
                  </div>
                  <a
                    href={googleListing.reviewsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-kado-red hover:underline"
                  >
                    Read on Google
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </div>
              ) : null}

              {/* Navigation dots */}
              <div className="flex items-center gap-2.5 pt-4">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      "min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full transition-all duration-300 -m-2 p-2",
                      activeIndex === index
                        ? "bg-kado-red/15"
                        : "hover:bg-kado-dark/5"
                    )}
                    aria-label={`View testimonial ${index + 1}`}
                    aria-current={activeIndex === index ? "true" : undefined}
                  >
                    <span
                      className={cn(
                        "h-2 rounded-full transition-all duration-300 block",
                        activeIndex === index ? "w-8 bg-kado-red" : "w-2 bg-kado-dark/20",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: animated testimonial cards */}
          <motion.div
            variants={itemVariants}
            className="relative h-full min-h-[320px] md:min-h-[420px]"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                className="absolute inset-0"
                initial={{ opacity: 0, x: 80 }}
                animate={{
                  opacity: activeIndex === index ? 1 : 0,
                  x: activeIndex === index ? 0 : 80,
                  scale: activeIndex === index ? 1 : 0.95,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{ zIndex: activeIndex === index ? 10 : 0 }}
              >
                <div className="bg-white border border-kado-dark/8 shadow-lg rounded-xl sm:rounded-none p-5 sm:p-8 h-full flex flex-col">
                  {/* Stars */}
                  <div className="mb-5 flex gap-1">
                    {Array(testimonial.rating)
                      .fill(0)
                      .map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-kado-red text-kado-red" />
                      ))}
                  </div>

                  {/* Quote body */}
                  <div className="relative mb-6 flex-1">
                    <Quote className="absolute -top-1 -left-1 h-7 w-7 text-kado-red/15 rotate-180" />
                    <p className="relative z-10 text-kado-dark text-base leading-relaxed font-medium">
                      &ldquo;{formatReviewText(testimonial.content)}&rdquo;
                    </p>
                  </div>

                  <Separator className="my-4 bg-kado-dark/8" />

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border border-kado-dark/10">
                      {testimonial.avatar?.trim() ? (
                        <AvatarImage
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback delayMs={testimonial.avatar?.trim() ? 600 : 0}>
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-kado-dark text-sm">{testimonial.name}</p>
                      <p className="text-xs text-kado-dark/50">
                        {testimonial.role}
                        {testimonial.company ? ` · ${testimonial.company}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Decorative brand accents */}
            <div className="absolute -bottom-4 -left-4 h-20 w-20 bg-kado-red/6 rounded-none pointer-events-none" />
            <div className="absolute -top-4 -right-4 h-20 w-20 bg-kado-cream/60 rounded-none pointer-events-none" />
          </motion.div>
        </motion.div>

        {/* Trusted brands logo cloud */}
        {trustedCompanies.length > 0 && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={controls}
            className="mt-20 text-center"
          >
            <p className="text-xs font-semibold tracking-widest uppercase text-kado-dark/40 mb-8">
              {trustedCompaniesTitle}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-6">
              {trustedCompanies
                .filter((c) => c.label.trim() || c.imageUrl?.trim())
                .map((company) => (
                  <div
                    key={`${company.label}-${company.imageUrl ?? 'text'}`}
                    className="flex items-center justify-center min-h-[2.5rem]"
                  >
                    {company.imageUrl?.trim() ? (
                      <img
                        src={company.imageUrl}
                        alt={company.label}
                        className="h-8 md:h-10 w-auto max-w-[120px] object-contain opacity-70 hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <span className="font-display text-lg font-bold text-kado-dark/25 tracking-tight hover:text-kado-dark/50 transition-colors duration-200">
                        {company.label}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
