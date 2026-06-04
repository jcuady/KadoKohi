import { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MapPin, CalendarDays, ArrowUpRight, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductDetailDrawer from '../ProductDetailDrawer';
import { AnimatedTestimonials } from '../ui/animated-testimonials';
import { KadoOrderingCarousel } from '../ui/animated-feature-carousel';
import KadoCircleCTA from '../ui/cta-with-text-marquee';
import HomeHeroSlider from '../ui/home-hero-slider';
import HomeSeoIntro from './HomeSeoIntro';
import CafeScheduleSection from './CafeScheduleSection';
import { useBranchStore } from '../../store/branchStore';
import { useEventStore } from '../../store/eventStore';
import { useCountdown } from '../../hooks/useCountdown';
import {
  eventDurationLabel,
  eventImages,
  getEventLifecyclePhase,
  getEventSignupPhase,
  pickCurrentOrUpcoming,
  signupCountdownTarget,
} from '../../lib/eventTiming';
import { useMenuStore } from '../../store/menuStore';
import { useAuthStore } from '../../store/authStore';
import type { Product } from '../../types/domain';
import { KADO_GOOGLE_LISTING } from '../../content/kadoGoogleReviews';
import type { FeaturedCopy, EventsCopy, BranchesStripCopy, LandingContentState } from '../../store/landingContentStore';
import { formatPhp } from '../../lib/money';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import {
  getMenuProductImageUrl,
  listVisibleCoffeeProducts,
  pickFeaturedCoffeeProducts,
} from '../../lib/menuCatalog';

type Props = {
  landing: LandingContentState;
  /** Shown when rendering admin preview iframe */
  previewBanner?: boolean;
};

export default function HomePageContent({ landing, previewBanner }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col w-full max-w-[100vw] min-w-0 overflow-x-hidden bg-kado-cream font-sans"
    >
      {previewBanner ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-[100] bg-amber-500 text-kado-dark text-center py-2 px-4 text-xs font-bold uppercase tracking-wider shadow-md"
        >
          Preview mode — unpublished changes only
        </motion.div>
      ) : null}
      <HomeHeroSlider slides={landing.heroSlides} chrome={landing.heroChrome} />
      <HomeSeoIntro />
      <BestCoffeesSection copy={landing.featured} />
      <KadoOrderingCarousel copy={landing.ordering} />
      <CafeScheduleSection copy={landing.schedule} />
      <EventsSection copy={landing.events} />
      <AnimatedTestimonials
        badgeText={landing.testimonials.badge}
        title={landing.testimonials.title}
        subtitle={landing.testimonials.subtitle}
        trustedCompaniesTitle={landing.testimonials.trustedTitle}
        trustedCompanies={landing.trustedBrands}
        testimonials={landing.testimonialItems}
        googleListing={KADO_GOOGLE_LISTING}
      />
      <BranchesStrip copy={landing.branchesStrip} />
      <KadoCircleCTA copy={landing.kadoCircle} />
    </motion.div>
  );
}

function BestCoffeesSection({ copy }: { copy: FeaturedCopy }) {
  const products = useMenuStore((s) => s.products);
  const categories = useMenuStore((s) => s.categories);
  const menuDataSource = useMenuStore((s) => s.dataSource);
  const menuRemoteLoaded = useMenuStore((s) => s.remoteLoaded);
  const hydrateMenu = useMenuStore((s) => s.hydrateFromRemote);
  const user = useAuthStore((s) => s.user);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!menuRemoteLoaded) void hydrateMenu();
  }, [menuRemoteLoaded, hydrateMenu]);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const liveMenuCatalog = useMemo(() => {
    if (menuDataSource !== 'remote') return [];
    return listVisibleCoffeeProducts(products, categories);
  }, [menuDataSource, products, categories]);

  const showcaseDrinks = useMemo(
    () => pickFeaturedCoffeeProducts(copy.productIds, liveMenuCatalog, 3),
    [copy.productIds, liveMenuCatalog],
  );

  const menuReady = menuRemoteLoaded && menuDataSource === 'remote';

  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-12 lg:px-24 w-full bg-kado-offwhite border-t border-kado-dark/10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="max-w-[1400px] mx-auto"
      >
        <div className="rounded-[1.75rem] border border-kado-dark/10 bg-gradient-to-br from-white to-kado-cream p-5 sm:p-8 md:p-10 shadow-[0_14px_40px_rgba(25,25,25,0.08)]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-5 md:gap-8 mb-8 md:mb-10"
          >
            <motion.div initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
              <span className="inline-flex items-center gap-2 rounded-full bg-kado-red/10 border border-kado-red/25 px-3 py-1.5 text-kado-red font-black tracking-[0.2em] uppercase text-[10px] sm:text-xs mb-3">
                {copy.badge}
              </span>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-kado-dark leading-[1.08] md:leading-tight">
                {copy.title}
              </h2>
              <p className="text-kado-dark/70 font-medium max-w-xl text-sm sm:text-base leading-relaxed mt-3 md:mt-4">
                <span className="hidden md:inline">{copy.subtitleDesktop}</span>
                <span className="md:hidden">{copy.subtitleMobile}</span>
              </p>
            </motion.div>

            <div className="w-full lg:w-auto flex items-center gap-3">
              <Link
                to={copy.shopCtaPath || '/menu'}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-kado-red px-5 py-3 text-white text-xs font-black uppercase tracking-[0.14em] hover:bg-kado-dark transition-colors"
              >
                {copy.shopCtaLabel || 'View Shop'} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/menu"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-kado-dark/20 bg-white/80 px-5 py-3 text-kado-dark text-xs font-black uppercase tracking-[0.14em] hover:border-kado-red/35 hover:text-kado-red transition-colors"
              >
                {copy.menuCtaLabel}
              </Link>
            </div>
          </motion.div>

          {!menuReady ? (
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              {[0, 1, 2].map((slot) => (
                <div
                  key={slot}
                  className="rounded-xl md:rounded-[1.25rem] border border-kado-dark/10 bg-white/70 aspect-[4/5] animate-pulse"
                  aria-hidden
                />
              ))}
            </div>
          ) : showcaseDrinks.length === 0 ? (
            <p className="text-sm text-kado-dark/60 font-medium py-6">
              No coffee items are available on the menu yet. Add products in Admin → Menu, then select them here in
              Homepage content.
            </p>
          ) : (
          <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-4 md:gap-6 w-full pb-6 pt-1 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scrollbar-hide">
          {showcaseDrinks.map((drink, i) => {
            const image = getMenuProductImageUrl(drink);
            const desc =
              drink.description ??
              (drink.temperature === 'iced'
                ? 'Served iced — crisp and refreshing.'
                : drink.temperature === 'both'
                  ? 'Available hot or iced.'
                  : 'Hand-crafted in-house.');

            return (
              <motion.button
                key={drink.id}
                type="button"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                onClick={() => setSelectedProduct(drink)}
                className="group w-[85vw] sm:w-[45vw] md:w-auto shrink-0 snap-center snap-always text-left bg-white border border-kado-dark/10 rounded-xl md:rounded-[1.25rem] overflow-hidden hover:shadow-[0_12px_28px_rgba(158,24,29,0.08)] hover:-translate-y-0.5 hover:border-kado-red/30 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red flex flex-col h-full"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-kado-dark/5 shrink-0">
                  <img
                    src={image}
                    alt={drink.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <span className="absolute top-2 left-2 text-[8px] font-black uppercase tracking-widest bg-kado-dark text-white px-2 py-0.5 rounded-full shadow">
                    {drink.tags?.[0] ?? 'Best Coffee'}
                  </span>

                  <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-kado-red/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-full shadow-lg">
                      View details
                    </span>
                  </div>
                </div>

                <div className="p-3 sm:p-4 flex flex-col flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-kado-dark/45 mb-1">
                    {drink.categoryId ? categoryById.get(drink.categoryId) ?? 'Coffee' : 'Coffee'}
                  </p>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-display font-black text-sm sm:text-[0.95rem] leading-snug text-kado-dark group-hover:text-kado-red transition-colors line-clamp-2">
                      {drink.name}
                    </h3>
                    <span className="font-sans font-black text-sm sm:text-base text-kado-dark shrink-0">
                      {formatPhp(drink.basePrice)}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium text-kado-dark/60 leading-relaxed line-clamp-2 mt-auto pt-1">
                    {desc}
                  </p>
                  <p className="mt-4 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-kado-dark/45 group-hover:text-kado-red transition-colors">
                    {user?.role === 'customer' ? 'Tap to customize & order' : 'Tap to view — sign in to order'}
                  </p>
                </div>
              </motion.button>
            );
          })}
          </div>
          )}
        </div>
      </motion.div>

      <ProductDetailDrawer
        product={selectedProduct}
        categoryName={
          selectedProduct?.categoryId ? categoryById.get(selectedProduct.categoryId) ?? 'Coffee' : 'Coffee'
        }
        onClose={() => setSelectedProduct(null)}
        requireAuthToOrder
      />
    </section>
  );
}

const FALLBACK_EVENT_IMG = 'https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=1200&auto=format&fit=crop';

function EventsSection({ copy }: { copy: EventsCopy }) {
  const events = useEventStore((s) => s.events);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    void orderingRepo.fetchEventRegistrationCounts().then(setRegCounts).catch(() => {});
  }, [events.length]);

  const ev = useMemo(() => {
    return pickCurrentOrUpcoming(events);
  }, [events]);
  const signupPhase = ev ? getEventSignupPhase(ev, regCounts[ev.id] ?? 0) : 'disabled';
  const lifecycle = ev ? getEventLifecyclePhase(ev) : 'upcoming';
  const countdownTarget = useMemo(() => {
    if (!ev) return undefined;
    if (lifecycle === 'upcoming') return ev.startsAt;
    if (lifecycle === 'current' && ev.endsAt) return ev.endsAt;
    return signupCountdownTarget(ev, signupPhase);
  }, [ev, lifecycle, signupPhase]);
  const countdown = useCountdown(countdownTarget);
  const heroImage = copy.coverImageOverride?.trim() || (ev ? eventImages(ev)[0] : '') || FALLBACK_EVENT_IMG;
  const durationLabel = ev ? eventDurationLabel(ev) : null;
  const ctaHref = ev && signupPhase === 'open' ? `/events?event=${encodeURIComponent(ev.id)}#event-${ev.id}` : '/events';
  const ctaLabel =
    ev && signupPhase === 'open'
      ? (ev.cta?.label?.trim() || 'Sign up now')
      : (ev?.cta?.label?.trim() || 'View Kado Events');

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return { day: d.getDate().toString(), month: d.toLocaleString('en-PH', { month: 'short' }).toUpperCase() };
  };

  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-12 lg:px-24 w-full bg-[#EFE6D5]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="max-w-[1400px] mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <span className="inline-flex items-center gap-2 text-kado-red font-bold tracking-[0.2em] uppercase text-[10px] sm:text-xs mb-4 bg-kado-red/10 px-3 sm:px-4 py-2 rounded-full border border-kado-red/20 shadow-sm">
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {copy.badge}
          </span>
          <h2 className="font-display text-[clamp(1.75rem,7vw,4.5rem)] md:text-6xl lg:text-8xl font-bold text-[#2A2626] leading-[1.08] px-1">
            {copy.title}
          </h2>
          <p className="text-base sm:text-lg md:text-2xl text-[#4A423C] font-medium mx-auto max-w-3xl mt-5 sm:mt-6 px-1 sm:px-4 md:px-0 leading-relaxed">
            {copy.subtitle}
          </p>
        </motion.div>

        {ev ? (
          <motion.div
            className="w-full"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <div className="relative rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] overflow-hidden group cursor-pointer border border-[#2A2626]/20 shadow-2xl shadow-black/40 min-h-[min(68svh,520px)] sm:min-h-[500px] lg:h-[750px] w-full">
              <motion.img
                src={heroImage}
                alt={ev.title}
                className="w-full h-full object-cover brightness-[0.7] contrast-[1.1]"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 2, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/95 opacity-90"
                initial={{ opacity: 0.85 }}
                whileHover={{ opacity: 0.95 }}
              />
              <div className="absolute inset-0 p-5 sm:p-8 lg:p-16 flex flex-col justify-between gap-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 w-full">
                  {(() => {
                    const { day, month } = formatDate(ev.startsAt);
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-[#EFE6D5] text-[#2A2626] font-display font-bold text-xl sm:text-2xl lg:text-3xl px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] shadow-2xl leading-none text-center shrink-0 self-start"
                      >
                        {day}
                        <br />
                        <span className="text-[10px] sm:text-xs font-sans uppercase tracking-widest text-kado-red mt-1 block">
                          {month}
                        </span>
                      </motion.div>
                    );
                  })()}
                  {countdownTarget ? (
                    <div className="flex flex-wrap justify-center sm:justify-end gap-x-2 gap-y-2 sm:gap-4 bg-black/60 backdrop-blur-2xl border border-white/20 px-3 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5 rounded-xl sm:rounded-[2rem] shadow-2xl w-full sm:w-auto">
                      {[
                        { v: countdown.days, l: 'Days', red: true },
                        { v: countdown.hours, l: 'Hrs' },
                        { v: countdown.minutes, l: 'Min' },
                        { v: countdown.seconds, l: 'Sec' },
                      ].map(({ v, l, red }, i) => (
                        <motion.div
                          key={l}
                          className="flex items-center gap-1.5 sm:gap-2 lg:gap-4"
                          initial={{ opacity: 0, y: 6 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05 }}
                        >
                          {i > 0 && <span className="text-white/30 font-bold self-start mt-1 hidden sm:inline">:</span>}
                          <motion.div className="text-center min-w-[2.25rem]">
                            <span
                              className={`block font-display font-bold text-lg sm:text-2xl lg:text-4xl leading-none ${red ? 'text-kado-red' : 'text-white'}`}
                            >
                              {String(v).padStart(2, '0')}
                            </span>
                            <span className="text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-widest text-[#A09A90] font-bold mt-0.5 sm:mt-1 block">
                              {l}
                            </span>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center rounded-xl sm:rounded-[2rem] border border-emerald-300/40 bg-emerald-500/20 px-4 py-2.5 sm:px-6 text-emerald-100 text-xs sm:text-sm font-black uppercase tracking-widest">
                      {lifecycle === 'current' ? 'Live now' : 'Details on events page'}
                    </div>
                  )}
                </div>
                <motion.div
                  className="w-full max-w-3xl mt-auto"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="font-display font-bold text-2xl sm:text-4xl lg:text-7xl text-white mb-3 sm:mb-4 lg:mb-6 leading-[1.1]">
                    {ev.title}
                  </h3>
                  <p className="text-[#EFE6D5]/90 font-medium text-sm sm:text-lg lg:text-2xl leading-relaxed mb-6 sm:mb-8 line-clamp-6 sm:line-clamp-none">
                    {ev.description}
                  </p>
                  {durationLabel && (
                    <p className="text-xs sm:text-sm text-[#EFE6D5]/80 font-semibold mb-5">
                      Event duration: {durationLabel}
                    </p>
                  )}
                  <Link
                    to={ctaHref}
                    className="inline-flex items-center justify-center gap-2 sm:gap-3 min-h-[48px] w-full sm:w-auto text-kado-cream hover:text-white font-bold text-xs sm:text-sm lg:text-base uppercase tracking-[0.15em] sm:tracking-[0.2em] bg-kado-red/90 hover:bg-kado-red px-6 sm:px-8 py-3.5 sm:py-4 rounded-full backdrop-blur-md border border-red-500/50 shadow-[0_0_30px_rgba(155,43,44,0.4)] transition-all"
                  >
                    {ctaLabel} <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <CalendarDays className="w-10 h-10 text-kado-red/40 mx-auto mb-4" />
            <p className="text-kado-dark/50 text-sm">{copy.noEventBody}</p>
            <Link to="/events" className="mt-4 inline-block text-kado-red font-bold text-sm hover:underline">
              {copy.noEventBrowseLabel}
            </Link>
          </div>
        )}
      </motion.div>
    </section>
  );
}

function BranchesStrip({ copy }: { copy: BranchesStripCopy }) {
  const branches = useBranchStore((s) => s.branches);

  const fmt = (hours: { day: string; open: string; close: string }[]) => {
    if (!hours.length) return null;
    const mon = hours.find((h) => h.day === 'mon');
    return mon ? `${mon.open} – ${mon.close}` : null;
  };

  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 lg:px-24 w-full bg-kado-dark border-t border-white/5 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="max-w-[1400px] mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <span className="text-kado-red font-bold tracking-[0.2em] uppercase text-xs mb-3 block">{copy.badge}</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-kado-cream">{copy.title}</h2>
          </div>
          <Link
            to="/branches"
            className="text-kado-cream/60 hover:text-kado-red text-sm font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            {copy.ctaLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div
          className="grid sm:grid-cols-2 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {branches.map((branch) => {
            const hours = fmt(branch.hours);
            const isActive = branch.status === 'active';
            return (
              <motion.div
                key={branch.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
              >
                <Link
                  to="/branches"
                  className="group relative rounded-2xl sm:rounded-[2rem] border border-white/10 bg-white/5 hover:bg-white/8 p-6 sm:p-8 flex flex-col gap-4 sm:gap-5 transition-all hover:border-kado-red/30 active:bg-white/10 block"
                >
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
                    <h3 className="font-display font-bold text-xl md:text-2xl text-kado-cream mb-1 group-hover:text-kado-red transition-colors">
                      {branch.name}
                    </h3>
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

                  <motion.div
                    className="mt-auto flex items-center gap-2 text-kado-red text-xs font-bold uppercase tracking-wider"
                    whileHover={{ x: 4 }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View details
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}
