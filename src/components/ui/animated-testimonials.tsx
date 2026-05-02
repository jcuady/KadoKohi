import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { Separator } from "./separator"
import { Quote, Star } from "lucide-react"
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

export interface AnimatedTestimonialsProps {
  title?: string
  subtitle?: string
  badgeText?: string
  testimonials?: Testimonial[]
  autoRotateInterval?: number
  trustedCompanies?: string[]
  trustedCompaniesTitle?: string
  className?: string
}

export function AnimatedTestimonials({
  title = "Loved by the community",
  subtitle = "Don't just take our word for it. Hear from our regulars.",
  badgeText = "Trusted by customers",
  testimonials = [],
  autoRotateInterval = 6000,
  trustedCompanies = [],
  trustedCompaniesTitle = "Uses trusted brands worldwide",
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
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-kado-red/10 text-kado-red">
                  <Star className="h-3 w-3 fill-kado-red" />
                  <span>{badgeText}</span>
                </div>
              )}

              <h2 className="font-display text-[clamp(1.625rem,5vw,3rem)] sm:text-4xl md:text-5xl font-bold tracking-tight text-kado-dark leading-tight">
                {title}
              </h2>

              <p className="max-w-[520px] text-kado-dark/60 text-base md:text-lg leading-relaxed">
                {subtitle}
              </p>

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
                      "{testimonial.content}"
                    </p>
                  </div>

                  <Separator className="my-4 bg-kado-dark/8" />

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border border-kado-dark/10">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-kado-dark text-sm">{testimonial.name}</p>
                      <p className="text-xs text-kado-dark/50">
                        {testimonial.role} · {testimonial.company}
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
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-5">
              {trustedCompanies.map((company) => (
                <span
                  key={company}
                  className="font-display text-lg font-bold text-kado-dark/25 tracking-tight hover:text-kado-dark/50 transition-colors duration-200"
                >
                  {company}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
