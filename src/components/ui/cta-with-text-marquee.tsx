import { cn } from '@/lib/utils';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import { HorizontalMarquee } from './marquee';

/** Partners & collaborators — shown in the sponsor strip (swap for CMS later). */
export const KADO_CIRCLE_SPONSORS = [
  'Anytime Fitness',
  'foodpanda',
  'GrabFood',
  'Pick.A.Roo',
  'Oatside',
  'Lalamove',
  'Emborg',
  'Aiya Matcha',
] as const;

type KadoCircleCTAProps = {
  className?: string;
};

/**
 * “Join the Kado Circle” — dark panel, email capture, horizontal sponsor marquee, stats.
 * Brand: `kado-dark`, `kado-red`, `kado-cream` / white text (see `index.css` @theme).
 */
export default function KadoCircleCTA({ className }: KadoCircleCTAProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = marqueeRef.current;
    if (!root) return;

    let raf = 0;
    let stopped = false;

    const updateOpacity = () => {
      const items = root.querySelectorAll('.marquee-item-horizontal');
      const containerRect = root.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;

      items.forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenterX = itemRect.left + itemRect.width / 2;
        const distance = Math.abs(centerX - itemCenterX);
        const maxDistance = containerRect.width / 2;
        const normalizedDistance = Math.min(distance / maxDistance, 1);
        const opacity = 1 - normalizedDistance * 0.75;
        (item as HTMLElement).style.opacity = opacity.toString();
      });
    };

    const loop = () => {
      if (stopped) return;
      updateOpacity();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    navigate('/auth/signup', { state: { email: trimmed } });
  };

  return (
    <section
      id="kado-circle"
      className={cn(
        'relative w-full min-w-0 overflow-hidden bg-kado-dark border-t border-white/5 py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-12 lg:px-24',
        className,
      )}
    >
      <div className="pointer-events-none absolute right-0 top-1/2 w-[min(50vw,28rem)] aspect-square bg-kado-red/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 lg:items-end animate-fade-in-up">
          {/* Copy */}
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-kado-red mb-5">
              <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden />
              The Inner Circle
            </p>
            <h2 className="font-display font-bold leading-[0.95] tracking-tight text-white mb-4 sm:mb-5 text-[clamp(2rem,6vw,4rem)]">
              Join the{' '}
              <span className="text-kado-red not-italic">Kado Circle.</span>
            </h2>
            <p className="text-white/55 font-medium text-base md:text-lg leading-relaxed">
              Curated invites to private events, secret menu drops, and your trackable loyalty stamp card. Become a
              local.
            </p>
          </div>

          {/* Email → signup */}
          <div className="w-full lg:max-w-md shrink-0 justify-self-end">
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <label htmlFor="kado-circle-email" className="sr-only">
                Email address
              </label>
              <input
                id="kado-circle-email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full min-h-[48px] bg-white/[0.07] border border-white/12 text-white placeholder:text-white/35 px-4 sm:px-5 py-3 rounded-xl sm:rounded-2xl focus:outline-none focus:border-kado-red/70 focus:bg-white/[0.09] transition-all text-base sm:text-sm"
              />
              <button
                type="submit"
                className="w-full min-h-[48px] bg-kado-red text-kado-cream font-bold uppercase tracking-[0.12em] text-xs px-6 py-3.5 rounded-xl sm:rounded-2xl hover:bg-[#7d1115] transition-colors flex items-center justify-center gap-2 active:opacity-95"
              >
                Request access <ArrowRight className="w-4 h-4" aria-hidden />
              </button>
            </form>
            <p className="text-white/35 text-xs mt-3 text-center lg:text-left">No spam. Unsubscribe any time.</p>
          </div>
        </div>

        {/* Sponsor marquee */}
        <div className="mt-14 md:mt-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 mb-4 text-center">
            Friends of the corner
          </p>
          <div ref={marqueeRef} className="relative w-full py-2">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] py-4 md:py-5">
              <HorizontalMarquee speed={32} pauseOnHover className="w-full">
                {KADO_CIRCLE_SPONSORS.map((name) => (
                  <div
                    key={name}
                    className="marquee-item-horizontal font-display text-lg sm:text-2xl md:text-3xl lg:text-4xl font-medium tracking-tight text-white/90 px-6 sm:px-10 md:px-14 whitespace-nowrap"
                  >
                    {name}
                  </div>
                ))}
              </HorizontalMarquee>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-20 md:w-32 bg-gradient-to-r from-kado-dark via-kado-dark/80 to-transparent z-10" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-20 md:w-32 bg-gradient-to-l from-kado-dark via-kado-dark/80 to-transparent z-10" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-10 sm:mt-12 md:mt-14 pt-8 sm:pt-10 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-8 sm:gap-8">
          {[
            { num: '2+', label: 'Branches' },
            { num: '50+', label: 'Menu items' },
            { num: '9', label: 'Stamp loyalty' },
            { num: '∞', label: 'Good vibes' },
          ].map(({ num, label }) => (
            <div key={label}>
              <p className="font-display font-bold text-3xl md:text-4xl text-white mb-1">{num}</p>
              <p className="text-white/40 text-xs uppercase tracking-widest font-bold">{label}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 sm:mt-10 text-center">
          <Link
            to="/auth/signup"
            className="inline-flex min-h-[44px] items-center justify-center px-2 text-xs font-bold uppercase tracking-wider text-kado-red/90 hover:text-kado-cream transition-colors"
          >
            Or go straight to create account →
          </Link>
        </p>
      </div>
    </section>
  );
}
