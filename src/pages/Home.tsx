import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MapPin, CalendarDays, ArrowUpRight, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CustomSectionRenderer from '../components/CustomSectionRenderer';
import { AnimatedTestimonials } from '../components/ui/animated-testimonials';
import { CinematicAppHero } from '../components/ui/cinematic-landing-hero';
import { KadoOrderingCarousel } from '../components/ui/animated-feature-carousel';
import KadoCircleCTA from '../components/ui/cta-with-text-marquee';
import { useBranchStore } from '../store/branchStore';
import { useEventStore } from '../store/eventStore';
import { useMenuStore } from '../store/menuStore';
import { formatPhp } from '../lib/money';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const heroDayVideoRef = useRef<HTMLVideoElement>(null);
  const heroNightVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videos = [heroDayVideoRef.current, heroNightVideoRef.current].filter(Boolean) as HTMLVideoElement[];
    videos.forEach((video) => {
      video.muted = true;
      video.playsInline = true;
      video.playbackRate = 0.95;
      void video.play().catch(() => {
        // Autoplay can be blocked on some environments until user interaction.
      });
    });
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      const setup = (isMobile: boolean) => {
        gsap.set('.hero-video-day', { scale: 1.48, yPercent: -8.5, filter: 'brightness(0.95)' });
        gsap.set('.hero-video-night', { opacity: 0, scale: 1.54, yPercent: -8.5, filter: 'brightness(0.72)' });
        gsap.set('.hero-overlay-night', { opacity: 0 });
        gsap.set('.hero-night-content', { autoAlpha: 0, x: isMobile ? -16 : -30 });
        gsap.set('.hero-day-content', { autoAlpha: 1, x: 0 });
        gsap.set('.hero-pill-day', { opacity: 1 });
        gsap.set('.hero-pill-night', { opacity: 0.35 });
        gsap.set('.hero-progress', { scaleX: 0 });

        gsap.from('.hero-enter', {
          y: isMobile ? 20 : 30,
          opacity: 0,
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.1,
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: isMobile ? '+=125%' : '+=200%',
            pin: true,
            pinSpacing: true,
            pinReparent: true,
            scrub: isMobile ? 0.55 : 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        tl.to('.hero-video-day', { scale: 1.52, yPercent: -9.5, filter: 'brightness(0.78)', duration: 1 }, 0);
        tl.to('.hero-video-night', { opacity: 1, scale: 1.48, yPercent: -8.5, filter: 'brightness(0.92)', duration: 1 }, 0);
        tl.to('.hero-overlay-night', { opacity: 1, duration: 1 }, 0);
        tl.to('.hero-day-content', { autoAlpha: 0, x: isMobile ? 16 : 30, duration: 1 }, 0);
        tl.to('.hero-night-content', { autoAlpha: 1, x: 0, duration: 1 }, 0);
        tl.to('.hero-pill-day', { opacity: 0.35, duration: 1 }, 0);
        tl.to('.hero-pill-night', { opacity: 1, duration: 1 }, 0);
        tl.to('.hero-progress', { scaleX: 1, duration: 1 }, 0);
      };

      mm.add('(max-width: 767px)', () => {
        setup(true);
      });

      mm.add('(min-width: 768px)', () => {
        setup(false);
      });

      return () => mm.revert();
    },
    { scope: heroRef },
  );

  return (
    <div className="flex flex-col w-full max-w-[100vw] min-w-0 overflow-x-hidden bg-kado-cream font-sans">

      {/* ═══════════════════════════════════════════
          HERO — Fullscreen immersive, day/night pin
          ═══════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative w-full h-svh min-h-svh flex items-end overflow-hidden"
        style={{ zIndex: 90 }}
      >
        {/*
          The source exports include a brand-manual header in the top band.
          Scale up and move the frame upward so that text is cropped outside
          the viewport on first paint, independent of scroll state.
        */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Day video */}
          <video
            ref={heroDayVideoRef}
            className="hero-video-day absolute inset-0 w-full h-full object-cover"
            style={{ transform: "scale(1.48) translateY(-8.5%)", transformOrigin: "center center", willChange: "transform, opacity" }}
            autoPlay muted loop playsInline preload="auto"
            aria-label="Kado Kohi daytime atmosphere"
          >
            <source src="/videos/Day.mp4" type="video/mp4" />
          </video>
          {/* Night video */}
          <video
            ref={heroNightVideoRef}
            className="hero-video-night absolute inset-0 w-full h-full object-cover opacity-0"
            style={{ transform: "scale(1.48) translateY(-8.5%)", transformOrigin: "center center", willChange: "transform, opacity" }}
            autoPlay muted loop playsInline preload="auto"
            aria-label="Kado Kohi nighttime atmosphere"
          >
            <source src="/videos/Night.mp4" type="video/mp4" />
          </video>

          {/* Scrims: no heavy top block, so the hero starts immediately under the navbar. */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#191919] via-[#191919]/66 to-[#191919]/18" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#191919]/35 to-transparent" />
          {/* Night overlay — fades in on scroll */}
          <div className="hero-overlay-night absolute inset-0 opacity-0" style={{ background: "linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.82) 45%, rgba(10,10,10,0.5) 100%)" }} />
        </div>

        {/* ── Content Grid — flush left (Day) & flush right (Night), bottom-anchored ── */}
        <div className="relative z-10 w-full px-4 sm:px-6 md:px-14 lg:px-20 pb-[max(3.5rem,env(safe-area-inset-bottom,0px)+0.75rem)] sm:pb-18 md:pb-22 pt-[max(5.25rem,env(safe-area-inset-top,0px)+4.5rem)] grid grid-cols-1 grid-rows-1">
          
          {/* DAY CONTENT (Left) */}
          <div className="hero-day-content hero-enter col-start-1 row-start-1 max-w-3xl w-full justify-self-start will-change-transform">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mb-5">
              <MapPin className="w-3 h-3 text-kado-red" aria-hidden />
              Marikina City
            </p>
            <h1 className="font-display font-bold text-white leading-[0.9] tracking-[-0.03em] mb-5 sm:mb-7 text-[clamp(2.125rem,min(12vw,4.5rem),8rem)]">
              Not Your<br />Quiet Cafe.
            </h1>
            <p className="text-[0.9375rem] sm:text-base md:text-lg text-white/68 font-medium leading-relaxed max-w-sm mb-8 sm:mb-10">
              Slow mornings, vinyl-adjacent energy, room to breathe.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto max-w-md">
              <Link
                to="/menu"
                className="bg-kado-red text-white min-h-[48px] px-6 sm:px-8 py-3.5 sm:py-4 font-bold uppercase tracking-[0.12em] text-xs flex items-center justify-center gap-2 hover:bg-[#7d1115] transition-colors active:opacity-95 rounded-sm"
              >
                Explore Menu <ArrowRight className="w-4 h-4 shrink-0" aria-hidden />
              </Link>
              <a
                href="#kado-circle"
                className="border border-white/25 text-white/90 hover:text-white hover:border-white/60 min-h-[48px] px-6 sm:px-8 py-3.5 sm:py-4 font-bold uppercase tracking-[0.12em] text-xs flex items-center justify-center gap-2 transition-colors active:opacity-95 rounded-sm"
              >
                Join Kado Circle
              </a>
            </div>
          </div>

          {/* NIGHT CONTENT (Right) */}
          <div className="hero-night-content hero-enter col-start-1 row-start-1 max-w-3xl w-full justify-self-end text-right flex flex-col items-end will-change-transform opacity-0 pointer-events-none">
            <p className="flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mb-5">
              <MapPin className="w-3 h-3 text-kado-red" aria-hidden />
              Marikina City
            </p>
            <h1 className="font-display font-bold text-white leading-[0.9] tracking-[-0.03em] mb-5 sm:mb-7 text-[clamp(2.125rem,min(12vw,4.5rem),8rem)]">
              Not Your<br />Quiet Cafe.
            </h1>
            <p className="text-[0.9375rem] sm:text-base md:text-lg text-white/88 font-medium leading-relaxed max-w-sm mb-8 sm:mb-10">
              Bass-forward nights where strangers become regulars.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full sm:w-auto max-w-md ml-auto pointer-events-auto">
              <Link
                to="/menu"
                className="bg-kado-red text-white min-h-[48px] px-6 sm:px-8 py-3.5 sm:py-4 font-bold uppercase tracking-[0.12em] text-xs flex items-center justify-center gap-2 hover:bg-[#7d1115] transition-colors active:opacity-95 rounded-sm"
              >
                Explore Menu <ArrowRight className="w-4 h-4 shrink-0" aria-hidden />
              </Link>
              <a
                href="#kado-circle"
                className="border border-white/25 text-white/90 hover:text-white hover:border-white/60 min-h-[48px] px-6 sm:px-8 py-3.5 sm:py-4 font-bold uppercase tracking-[0.12em] text-xs flex items-center justify-center gap-2 transition-colors active:opacity-95 rounded-sm"
              >
                Join Kado Circle
              </a>
            </div>
          </div>

          {/* Mode indicator — bottom-right */}
          <div className="hero-enter absolute bottom-[max(1rem,env(safe-area-inset-bottom,0px))] sm:bottom-14 md:bottom-20 right-4 sm:right-6 md:right-14 lg:right-20 flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.28em]">
              <span className="hero-pill-day text-white">Day</span>
              <span className="text-white/20">/</span>
              <span className="hero-pill-night text-white/35">Night</span>
            </div>
            <div className="w-16 h-[2px] bg-white/15 rounded-full overflow-hidden">
              <div className="hero-progress h-full w-full bg-kado-red rounded-full origin-left scale-x-0" />
            </div>
          </div>
        </div>

        {/* ── Japanese kanji watermark ── */}
        <div
          className="absolute top-1/2 right-8 md:right-16 -translate-y-1/2 text-[20vw] md:text-[14vw] font-display font-bold text-white/[0.03] select-none pointer-events-none leading-none"
          aria-hidden
        >
          角
        </div>
      </section>

      {/* =========================================
          2. KADO KOHI APP PREVIEW (Cinematic Scroll)
          ========================================= */}
      <CinematicAppHero />

      {/* =========================================
          3. HOW TO ORDER (Carousel)
          ========================================= */}
      <KadoOrderingCarousel />

      {/* =========================================
          4. SIGNATURE SIPS PREVIEW
          ========================================= */}
      <SignatureSipsSection />

      {/* =========================================
          4. SOCIAL HUB & EVENTS (Instagram Style)
          ========================================= */}
      <EventsSection />

      {/* =========================================
          5. CUSTOMER TESTIMONIALS
          ========================================= */}
      <AnimatedTestimonials
        badgeText="Customers"
        title="Loved by our community"
        subtitle="Don't just take our word for it. Here's what regulars have to say about their Kado Kohi experience."
        trustedCompaniesTitle="Uses trusted brands like"
        trustedCompanies={["Oatside", "Emborg", "Aiya Matcha", "Marigold", "Arla"]}
        testimonials={[
          {
            id: 1,
            name: "Rina Santos",
            role: "Regular",
            company: "Marikina",
            content:
              "The oat latte here is unreal. Oatside milk makes such a difference — perfectly steamed, not too sweet, and the ambiance just pulls you in. I'm here every weekend without fail.",
            rating: 5,
            avatar: "https://randomuser.me/api/portraits/women/68.jpg",
          },
          {
            id: 2,
            name: "Marco Dela Cruz",
            role: "Freelancer",
            company: "Pasig",
            content:
              "Best work-from-cafe spot in the area. The music is always right, the matcha (Aiya grade A!) is excellent, and the staff actually know your order by your third visit.",
            rating: 5,
            avatar: "https://randomuser.me/api/portraits/men/54.jpg",
          },
          {
            id: 3,
            name: "Jess Buenaventura",
            role: "Creative",
            company: "QC",
            content:
              "I love that they're intentional about what goes into their drinks — Emborg dairy, quality matcha. You taste the difference. The night vibe on weekends is also *chef's kiss*.",
            rating: 5,
            avatar: "https://randomuser.me/api/portraits/women/33.jpg",
          },
          {
            id: 4,
            name: "Luis Tomas",
            role: "Student",
            company: "Marikina",
            content:
              "Kado is my corner. No pretension, just good coffee, good music, and people who feel like community. It's rare to find a place this intentional about craft and vibe.",
            rating: 5,
            avatar: "https://randomuser.me/api/portraits/men/22.jpg",
          },
        ]}
      />

      {/* =========================================
          6. BRANCHES STRIP
          ========================================= */}
      <BranchesStrip />

      {/* =========================================
          6. KADO CIRCLE (Newsletter/Loyalty)
          ========================================= */}
      <KadoCircleCTA />

      {/* =========================================
          7. ADMIN-DEFINED CUSTOM SECTIONS
          ========================================= */}
      <CustomSectionRenderer />

    </div>
  );
}


// =========================================
// Signature Sips — data-driven from useMenuStore
// =========================================
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=400&auto=format&fit=crop',
];

function SignatureSipsSection() {
  const products = useMenuStore((s) => s.products);
  const categories = useMenuStore((s) => s.categories);

  const sigCat = categories.find((c) => c.name.toLowerCase().includes('signature'));
  const showcaseDrinks = useMemo(() => {
    const src = sigCat
      ? products.filter((p) => p.categoryId === sigCat.id && p.visible)
      : products.filter((p) => p.visible);
    return src.slice(0, 3);
  }, [products, sigCat]);

  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-12 lg:px-24 w-full bg-kado-offwhite border-t border-kado-dark/10">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-10 sm:mb-16">
          <div>
            <span className="text-kado-red font-bold tracking-[0.2em] uppercase text-xs mb-3 block">Signatures</span>
            <h2 className="font-display text-[clamp(1.875rem,6vw,3.75rem)] md:text-5xl lg:text-6xl font-bold text-kado-dark leading-tight">
              Signature <span className="text-kado-red italic">Sips.</span>
            </h2>
          </div>
          <p className="text-kado-dark/70 font-medium max-w-sm text-sm leading-relaxed md:text-base hidden md:block">
            Explore our community's highest-rated daily rituals. Hand-crafted, every single time.
          </p>
        </div>
        <p className="text-kado-dark/65 text-sm leading-relaxed mb-8 md:hidden -mt-2 max-w-md">
          Community favourites — hand-crafted, every single time.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 w-full pb-6 sm:pb-8">
          {showcaseDrinks.map((drink, i) => (
            <motion.div
              key={drink.id}
              className="w-full bg-white rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-6 shadow-xl shadow-black/5 border border-kado-dark/10 group"
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="w-full aspect-[4/5] rounded-xl sm:rounded-[2rem] overflow-hidden mb-5 sm:mb-6 relative bg-kado-cream">
                <img
                  src={drink.image ?? FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]}
                  alt={drink.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display font-bold text-xl text-kado-dark">{drink.name}</h3>
                  {drink.description && <p className="text-sm font-medium text-kado-dark/70 mt-1">{drink.description}</p>}
                  {drink.tags?.length ? (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-kado-red/70 mt-1">{drink.tags.join(' · ')}</p>
                  ) : null}
                </div>
                <span className="font-display font-bold text-kado-red shrink-0 ml-3">{formatPhp(drink.basePrice)}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 sm:mt-16 flex justify-center px-1">
          <Link
            to="/menu"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] border-b-2 border-kado-red pb-1 text-kado-dark font-bold uppercase tracking-widest text-sm sm:text-base hover:text-kado-red transition-colors"
          >
            View Full Menu <ArrowRight className="w-4 h-4 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

// =========================================
// Events / Social Hub — data-driven from useEventStore
// =========================================

function useCountdown(isoDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!isoDate) return;
    const target = new Date(isoDate).getTime();
    const zero = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft(zero);
        return false;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
      return true;
    };

    if (!tick()) return;

    const id = window.setInterval(() => {
      if (!tick()) window.clearInterval(id);
    }, 1000);

    return () => window.clearInterval(id);
  }, [isoDate]);
  return timeLeft;
}

const FALLBACK_EVENT_IMG = 'https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=1200&auto=format&fit=crop';

function EventsSection() {
  /** Select raw `events` only — `visibleEvents()` returns a new array each call and breaks useSyncExternalStore snapshot equality (infinite re-renders). */
  const events = useEventStore((s) => s.events);
  const ev = useMemo(() => {
    const highlighted = events.find((e) => e.highlight && e.visible);
    if (highlighted) return highlighted;
    return [...events]
      .filter((e) => e.visible)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
  }, [events]);
  const countdown = useCountdown(ev?.startsAt);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return { day: d.getDate().toString(), month: d.toLocaleString('en-PH', { month: 'short' }).toUpperCase() };
  };

  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-12 lg:px-24 w-full bg-[#EFE6D5]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <span className="inline-flex items-center gap-2 text-kado-red font-bold tracking-[0.2em] uppercase text-[10px] sm:text-xs mb-4 bg-kado-red/10 px-3 sm:px-4 py-2 rounded-full border border-kado-red/20 shadow-sm">
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Next Massive Event
          </span>
          <h2 className="font-display text-[clamp(1.75rem,7vw,4.5rem)] md:text-6xl lg:text-8xl font-bold text-[#2A2626] leading-[1.08] px-1">
            More than a <span className="text-[#612821] italic opacity-90">Corner.</span>
          </h2>
          <p className="text-base sm:text-lg md:text-2xl text-[#4A423C] font-medium mx-auto max-w-3xl mt-5 sm:mt-6 px-1 sm:px-4 md:px-0 leading-relaxed">
            Coffee shop by day. Club and hangout by night. The definitive Marikina social experience.
          </p>
        </div>

        {ev ? (
          <div className="w-full">
            <div className="relative rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] overflow-hidden group cursor-pointer border border-[#2A2626]/20 shadow-2xl shadow-black/40 min-h-[min(68svh,520px)] sm:min-h-[500px] lg:h-[750px] w-full">
              <img src={ev.cover ?? FALLBACK_EVENT_IMG} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out brightness-[0.7] contrast-[1.1]" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/95 opacity-90" />
              <div className="absolute inset-0 p-5 sm:p-8 lg:p-16 flex flex-col justify-between gap-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 w-full">
                  {(() => { const { day, month } = formatDate(ev.startsAt); return (
                    <div className="bg-[#EFE6D5] text-[#2A2626] font-display font-bold text-xl sm:text-2xl lg:text-3xl px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] shadow-2xl leading-none text-center shrink-0 self-start">
                      {day}<br /><span className="text-[10px] sm:text-xs font-sans uppercase tracking-widest text-kado-red mt-1 block">{month}</span>
                    </div>
                  ); })()}
                  <div className="flex flex-wrap justify-center sm:justify-end gap-x-2 gap-y-2 sm:gap-4 bg-black/60 backdrop-blur-2xl border border-white/20 px-3 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5 rounded-xl sm:rounded-[2rem] shadow-2xl w-full sm:w-auto">
                    {[{ v: countdown.days, l: 'Days', red: true }, { v: countdown.hours, l: 'Hrs' }, { v: countdown.minutes, l: 'Min' }, { v: countdown.seconds, l: 'Sec' }].map(({ v, l, red }, i) => (
                      <div key={l} className="flex items-center gap-1.5 sm:gap-2 lg:gap-4">
                        {i > 0 && <span className="text-white/30 font-bold self-start mt-1 hidden sm:inline">:</span>}
                        <div className="text-center min-w-[2.25rem]">
                          <span className={`block font-display font-bold text-lg sm:text-2xl lg:text-4xl leading-none ${red ? 'text-kado-red' : 'text-white'}`}>{String(v).padStart(2, '0')}</span>
                          <span className="text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-widest text-[#A09A90] font-bold mt-0.5 sm:mt-1 block">{l}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-full max-w-3xl mt-auto">
                  <h3 className="font-display font-bold text-2xl sm:text-4xl lg:text-7xl text-white mb-3 sm:mb-4 lg:mb-6 leading-[1.1]">{ev.title}</h3>
                  <p className="text-[#EFE6D5]/90 font-medium text-sm sm:text-lg lg:text-2xl leading-relaxed mb-6 sm:mb-8 line-clamp-6 sm:line-clamp-none">{ev.description}</p>
                  {ev.cta ? (
                    <a href={ev.cta.href} className="inline-flex items-center justify-center gap-2 sm:gap-3 min-h-[48px] w-full sm:w-auto text-kado-cream hover:text-white font-bold text-xs sm:text-sm lg:text-base uppercase tracking-[0.15em] sm:tracking-[0.2em] bg-kado-red/90 hover:bg-kado-red px-6 sm:px-8 py-3.5 sm:py-4 rounded-full backdrop-blur-md border border-red-500/50 shadow-[0_0_30px_rgba(155,43,44,0.4)] transition-all">
                      {ev.cta.label} <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden />
                    </a>
                  ) : (
                    <Link to="/events" className="inline-flex items-center justify-center gap-2 sm:gap-3 min-h-[48px] w-full sm:w-auto text-kado-cream hover:text-white font-bold text-xs sm:text-sm lg:text-base uppercase tracking-[0.15em] sm:tracking-[0.2em] bg-kado-red/90 hover:bg-kado-red px-6 sm:px-8 py-3.5 sm:py-4 rounded-full backdrop-blur-md border border-red-500/50 shadow-[0_0_30px_rgba(155,43,44,0.4)] transition-all">
                      See all events <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <CalendarDays className="w-10 h-10 text-kado-red/40 mx-auto mb-4" />
            <p className="text-kado-dark/50 text-sm">No upcoming events right now. Check back soon.</p>
            <Link to="/events" className="mt-4 inline-block text-kado-red font-bold text-sm hover:underline">Browse past events →</Link>
          </div>
        )}
      </div>
    </section>
  );
}

// =========================================
// Branches Strip — data-driven from useBranchStore
// =========================================
function BranchesStrip() {
  const branches = useBranchStore((s) => s.branches);

  const fmt = (hours: { day: string; open: string; close: string }[]) => {
    if (!hours.length) return null;
    const mon = hours.find((h) => h.day === 'mon');
    return mon ? `${mon.open} – ${mon.close}` : null;
  };

  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 lg:px-24 w-full bg-kado-dark border-t border-white/5 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-kado-red font-bold tracking-[0.2em] uppercase text-xs mb-3 block">Locations</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-kado-cream">Find us.</h2>
          </div>
          <Link to="/branches" className="text-kado-cream/60 hover:text-kado-red text-sm font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">
            All branches <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {branches.map((branch) => {
            const hours = fmt(branch.hours);
            const isActive = branch.status === 'active';
            return (
              <Link
                key={branch.id}
                to="/branches"
                className="group relative rounded-2xl sm:rounded-[2rem] border border-white/10 bg-white/5 hover:bg-white/8 p-6 sm:p-8 flex flex-col gap-4 sm:gap-5 transition-all hover:border-kado-red/30 active:bg-white/10"
              >
                {/* Status pill */}
                <div className="flex items-center gap-2">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Open
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-kado-red border border-kado-red/30 px-3 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> Coming Soon
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-display font-bold text-xl md:text-2xl text-kado-cream mb-1 group-hover:text-kado-red transition-colors">{branch.name}</h3>
                  <p className="text-kado-cream/55 text-sm flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-kado-red" />
                    {branch.address}, {branch.city}
                  </p>
                  {hours && (
                    <p className="text-kado-cream/40 text-xs mt-2 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 shrink-0" /> {hours} daily
                    </p>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-2 text-kado-red text-xs font-bold uppercase tracking-wider">
                  <ExternalLink className="w-3.5 h-3.5" /> View details
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

