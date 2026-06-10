import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Facebook, Instagram } from 'lucide-react';
import type { Variants } from 'motion/react';
import { TimelineContent } from '@/components/ui/timeline-animation';
import { SEO_SOCIAL } from '@/content/seo';
import { KADO_GOOGLE_LISTING } from '@/content/kadoGoogleReviews';
import TikTokIcon from '@/components/icons/TikTokIcon';

const revealVariants: Variants = {
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { delay: i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  }),
  hidden: { filter: 'blur(10px)', y: 40, opacity: 0 },
};

const imageVariants: Variants = {
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: { delay: i * 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] },
  }),
  hidden: { scale: 0.9, opacity: 0 },
};

const SOCIAL_LINKS = [
  {
    key: 'instagram',
    href: SEO_SOCIAL.instagram,
    label: 'Instagram',
    Icon: Instagram,
  },
  {
    key: 'tiktok',
    href: SEO_SOCIAL.tiktok,
    label: 'TikTok',
    Icon: TikTokIcon,
  },
  {
    key: 'facebook',
    href: SEO_SOCIAL.facebook,
    label: 'Facebook',
    Icon: Facebook,
  },
] as const;

export default function AboutSection2() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { rating, reviewCount, mapsUrl } = KADO_GOOGLE_LISTING;

  return (
    <section
      aria-labelledby="home-brand-story-heading"
      className="relative overflow-hidden bg-[#FAF7F2] px-6 py-20 sm:py-28 md:py-32 lg:px-16"
      ref={containerRef}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-center">
          
          {/* Left Column: Typography & Images */}
          <div className="lg:col-span-6 relative">
            <TimelineContent
              as="h2"
              id="home-brand-story-heading"
              animationNum={0}
              timelineRef={containerRef}
              customVariants={revealVariants}
              className="font-display text-[clamp(3rem,8vw,6rem)] font-black leading-[0.9] tracking-tighter text-[#8A1519] relative z-10 mix-blend-multiply"
            >
              Our Coffee,<br />Our Rules.
            </TimelineContent>

            {/* Decorative Oval Image 1 */}
            <TimelineContent
              as="div"
              animationNum={1}
              timelineRef={containerRef}
              customVariants={imageVariants}
              className="absolute -bottom-12 -left-8 sm:-bottom-20 sm:left-12 w-40 h-40 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-[#FAF7F2] shadow-2xl z-20"
            >
              <img 
                src="/featuredmarikina/kadom1.jpg" 
                alt="Kado Kohi Barista" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </TimelineContent>

            {/* Decorative Oval Image 2 */}
            <TimelineContent
              as="div"
              animationNum={2}
              timelineRef={containerRef}
              customVariants={imageVariants}
              className="hidden sm:block absolute -top-16 right-4 lg:-right-12 w-48 h-64 rounded-[100px] overflow-hidden border-4 border-[#FAF7F2] shadow-2xl z-0"
            >
              <img 
                src="/featuredmarikina/kadom2.jpg" 
                alt="Kado Kohi Pour Over" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </TimelineContent>
          </div>

          {/* Right Column: Editorial Copy */}
          <div className="lg:col-span-5 lg:col-start-8 flex flex-col justify-center pt-16 sm:pt-24 lg:pt-0">
            <TimelineContent
              as="p"
              animationNum={3}
              timelineRef={containerRef}
              customVariants={revealVariants}
              className="font-sans text-base sm:text-lg md:text-xl leading-relaxed text-[#8A1519] font-medium mb-8"
            >
              We're not a franchise. We're not chasing trends. We roast, grind, and brew for the ones who crave real coffee — not a lifestyle accessory. Beans from local farmers, roasted fresh, crafted by hands that don't shake.
            </TimelineContent>

            <TimelineContent
              as="p"
              animationNum={4}
              timelineRef={containerRef}
              customVariants={revealVariants}
              className="font-sans text-sm sm:text-base leading-relaxed text-kado-dark/70 mb-8"
            >
              Kado Coffee is a Japanese-inspired specialty cafe in Sta. Elena, Marikina. Whether you're searching for the <strong className="font-semibold text-kado-dark">best matcha in Marikina</strong>, a <strong className="font-semibold text-kado-dark">hojicha oat latte</strong>, or just <strong className="font-semibold text-kado-dark">coffee near me</strong>, you'll find us rated {rating}★ on Google ({reviewCount} reviews).
            </TimelineContent>

            <TimelineContent
              as="div"
              animationNum={5}
              timelineRef={containerRef}
              customVariants={revealVariants}
              className="flex flex-wrap items-center gap-6"
            >
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 font-display text-sm sm:text-base font-bold uppercase tracking-widest text-[#8A1519] hover:text-kado-dark transition-colors border-b-2 border-[#8A1519]/30 hover:border-kado-dark pb-1"
              >
                Explore Menu
              </Link>
              
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-display text-sm sm:text-base font-bold uppercase tracking-widest text-kado-dark/60 hover:text-kado-dark transition-colors border-b-2 border-transparent hover:border-kado-dark/30 pb-1"
              >
                Find Us
              </a>
            </TimelineContent>

            {/* Social Links */}
            <TimelineContent
              as="div"
              animationNum={6}
              timelineRef={containerRef}
              customVariants={revealVariants}
              className="mt-12 pt-8 border-t border-kado-dark/10 flex items-center gap-4"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-kado-dark/40">Follow Us</span>
              <div className="flex gap-3">
                {SOCIAL_LINKS.map(({ key, href, label, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="w-8 h-8 rounded-full border border-kado-dark/10 flex items-center justify-center text-kado-dark/60 hover:bg-[#8A1519] hover:text-white hover:border-[#8A1519] transition-all"
                    aria-label={label}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </TimelineContent>
          </div>
        </div>
      </div>
    </section>
  );
}
