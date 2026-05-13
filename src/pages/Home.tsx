import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MapPin, CalendarDays, ArrowUpRight, CheckCircle2, Clock, ExternalLink, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomSectionRenderer from '../components/CustomSectionRenderer';
import { AnimatedTestimonials } from '../components/ui/animated-testimonials';
import { KadoOrderingCarousel } from '../components/ui/animated-feature-carousel';
import KadoCircleCTA from '../components/ui/cta-with-text-marquee';
import HomeHeroSlider from '../components/ui/home-hero-slider';
import CafeScheduleSection from '../components/home/CafeScheduleSection';
import { useBranchStore } from '../store/branchStore';
import { useEventStore } from '../store/eventStore';
import { useMenuStore } from '../store/menuStore';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import {
  useLandingContentStore,
  type FeaturedCopy,
  type EventsCopy,
  type HomeBlockType,
} from '../store/landingContentStore';
import { formatPhp } from '../lib/money';

export default function Home() {
  const landing = useLandingContentStore((s) => s.content);
  const blockMap = useMemo(
    () =>
      ({
        hero: <HomeHeroSlider slides={landing.heroSlides} />,
        featured: <SignatureSipsSection copy={landing.featured} />,
        ordering: <KadoOrderingCarousel />,
        schedule: <CafeScheduleSection copy={landing.schedule} />,
        events: <EventsSection copy={landing.events} />,
        testimonials: (
          <AnimatedTestimonials
            badgeText={landing.testimonials.badge}
            title={landing.testimonials.title}
            subtitle={landing.testimonials.subtitle}
            trustedCompaniesTitle={landing.testimonials.trustedTitle}
            trustedCompanies={['Oatside', 'Emborg', 'Aiya Matcha', 'Marigold', 'Arla']}
            testimonials={[
              {
                id: 1,
                name: 'Rina Santos',
                role: 'Regular',
                company: 'Marikina',
                content:
                  "The oat latte here is unreal. Oatside milk makes such a difference — perfectly steamed, not too sweet, and the ambiance just pulls you in. I'm here every weekend without fail.",
                rating: 5,
                avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
              },
              {
                id: 2,
                name: 'Marco Dela Cruz',
                role: 'Freelancer',
                company: 'Pasig',
                content:
                  "Best work-from-cafe spot in the area. The music is always right, the matcha (Aiya grade A!) is excellent, and the staff actually know your order by your third visit.",
                rating: 5,
                avatar: 'https://randomuser.me/api/portraits/men/54.jpg',
              },
              {
                id: 3,
                name: 'Jess Buenaventura',
                role: 'Creative',
                company: 'QC',
                content:
                  "I love that they're intentional about what goes into their drinks — Emborg dairy, quality matcha. You taste the difference. The night vibe on weekends is also *chef's kiss*.",
                rating: 5,
                avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
              },
              {
                id: 4,
                name: 'Luis Tomas',
                role: 'Student',
                company: 'Marikina',
                content:
                  "Kado is my corner. No pretension, just good coffee, good music, and people who feel like community. It's rare to find a place this intentional about craft and vibe.",
                rating: 5,
                avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
              },
            ]}
          />
        ),
        branches: <BranchesStrip />,
        kadoCircle: <KadoCircleCTA />,
        customSections: <CustomSectionRenderer />,
      }) satisfies Record<HomeBlockType, ReactNode>,
    [landing],
  );

  return (
    <div className="flex flex-col w-full max-w-[100vw] min-w-0 overflow-x-hidden bg-kado-cream font-sans">
      {landing.homeBlocks
        .filter((block) => block.enabled)
        .map((block) => (
          <div key={block.id}>{blockMap[block.id]}</div>
        ))}
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

function SignatureSipsSection({ copy }: { copy: FeaturedCopy }) {
  const products = useMenuStore((s) => s.products);
  const categories = useMenuStore((s) => s.categories);
  const user = useAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);

  const sigCat = categories.find((c) => c.name.toLowerCase().includes('signature'));
  const showcaseDrinks = useMemo(() => {
    const src = sigCat
      ? products.filter((p) => p.categoryId === sigCat.id && p.visible)
      : products.filter((p) => p.visible);
    return src.slice(0, 3);
  }, [products, sigCat]);

  const handleAddToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const defaultMilk = product.milks[0];
    const defaultSize = product.sizes[0];
    const unitPrice = product.basePrice + (defaultMilk?.priceDelta ?? 0) + (defaultSize?.priceDelta ?? 0);

    addItem({
      itemType: 'coffee',
      productId: product.id,
      productNameSnapshot: product.name,
      qty: 1,
      milkId: defaultMilk?.id,
      milkLabelSnapshot: defaultMilk?.label,
      sizeId: defaultSize?.id,
      sizeLabelSnapshot: defaultSize?.label,
      temperature: product.temperature === 'both' ? 'hot' : product.temperature === 'iced' ? 'iced' : 'hot',
      unitPrice,
      lineTotal: unitPrice,
      image: product.image,
    });
  };
  
  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-12 lg:px-24 w-full bg-kado-offwhite border-t border-kado-dark/10">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-10 sm:mb-16">
          <div>
            <span className="text-kado-red font-bold tracking-[0.2em] uppercase text-xs mb-3 block">{copy.badge}</span>
            <h2 className="font-display text-[clamp(1.875rem,6vw,3.75rem)] md:text-5xl lg:text-6xl font-bold text-kado-dark leading-tight">
              {copy.title}
            </h2>
          </div>
          <p className="text-kado-dark/70 font-medium max-w-sm text-sm leading-relaxed md:text-base hidden md:block">
            {copy.subtitleDesktop}
          </p>
        </div>
        <p className="text-kado-dark/65 text-sm leading-relaxed mb-8 md:hidden -mt-2 max-w-md">
          {copy.subtitleMobile}
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
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(drink.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-kado-dark px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-kado-cream transition-colors hover:bg-kado-red"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add to Cart
                  </button>
                  <Link
                    to="/menu"
                    className="inline-flex items-center rounded-lg border border-kado-dark/15 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-kado-dark/80 transition-colors hover:border-kado-red/35 hover:text-kado-red"
                  >
                    Explore Menu
                  </Link>
                  {!user && (
                    <Link
                      to="/auth/login"
                      className="inline-flex items-center rounded-lg border border-kado-dark/15 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-kado-dark/80 transition-colors hover:border-kado-red/35 hover:text-kado-red"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
        </div>
        
        <div className="mt-12 sm:mt-16 flex justify-center px-1">
          <Link
            to="/menu"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] border-b-2 border-kado-red pb-1 text-kado-dark font-bold uppercase tracking-widest text-sm sm:text-base hover:text-kado-red transition-colors"
          >
            {copy.menuCtaLabel} <ArrowRight className="w-4 h-4 shrink-0" aria-hidden />
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

function EventsSection({ copy }: { copy: EventsCopy }) {
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
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {copy.badge}
          </span>
          <h2 className="font-display text-[clamp(1.75rem,7vw,4.5rem)] md:text-6xl lg:text-8xl font-bold text-[#2A2626] leading-[1.08] px-1">
            {copy.title}
          </h2>
          <p className="text-base sm:text-lg md:text-2xl text-[#4A423C] font-medium mx-auto max-w-3xl mt-5 sm:mt-6 px-1 sm:px-4 md:px-0 leading-relaxed">
            {copy.subtitle}
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

