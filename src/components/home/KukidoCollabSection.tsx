import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  KUKIDO_BLUE,
  KUKIDO_BLUE_DEEP,
  KUKIDO_COOKIE_IDS,
  KUKIDO_COOKIE_IMAGE,
  KUKIDO_COOKIE_LABEL,
  KUKIDO_PAPER,
  KUKI_SINGLE_PRICE,
  isKukidoCookieId,
  resolveKukiBoxOptions,
  resolveKukiPackPrices,
  resolveKukidoCookieImage,
} from '../../lib/kukido';
import { formatPhp } from '../../lib/money';
import { useMenuStore } from '../../store/menuStore';

/**
 * Homepage collab board — taped paper cookie menu on kukidō royal blue.
 * Prices follow Admin → Menu → Pastries catalog when hydrated.
 */
export default function KukidoCollabSection() {
  const reduce = useReducedMotion();
  const products = useMenuStore((s) => s.products);

  const boxOptions = useMemo(() => resolveKukiBoxOptions(products), [products]);
  const packPrices = useMemo(() => resolveKukiPackPrices(products), [products]);
  const singlePrice = useMemo(() => {
    const cookie = products.find(
      (p) => isKukidoCookieId(p.id) && p.visible !== false && Number(p.basePrice) > 0,
    );
    return cookie ? Number(cookie.basePrice) : KUKI_SINGLE_PRICE;
  }, [products]);

  return (
    <section
      id="landing-kukido"
      aria-labelledby="kukido-collab-heading"
      className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-24 lg:px-16"
      style={{ backgroundColor: KUKIDO_BLUE }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[42%] opacity-35"
        style={{
          backgroundImage: 'url(/kukido/menu-graphic.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 10%, rgba(255,255,255,0.18), transparent 45%), linear-gradient(90deg, rgba(20,58,158,0.35), transparent 55%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="relative mx-auto"
        >
          {/* Painter tape */}
          <div
            aria-hidden
            className="absolute -top-3 left-1/2 z-20 h-8 w-28 -translate-x-1/2 -rotate-2 rounded-[2px] opacity-95 shadow-sm sm:w-36"
            style={{ backgroundColor: '#5B8DEF' }}
          />

          <div
            className="relative overflow-hidden rounded-[1.25rem] px-5 py-8 shadow-[0_24px_60px_rgba(10,30,90,0.35)] sm:px-8 sm:py-10"
            style={{ backgroundColor: KUKIDO_PAPER }}
          >
            <div className="mb-6 flex items-center justify-center gap-4 border-b border-kado-dark/10 pb-5">
              <p
                className="font-display text-xl font-black tracking-tight sm:text-2xl"
                style={{ color: KUKIDO_BLUE_DEEP }}
              >
                kukidō
              </p>
              <span className="h-8 w-px bg-kado-dark/20" aria-hidden />
              <p className="font-display text-sm font-black uppercase tracking-[0.14em] text-kado-red sm:text-base">
                Kado Kohi
              </p>
            </div>

            <h2
              id="kukido-collab-heading"
              className="mb-6 text-center font-display text-2xl font-black uppercase tracking-tight sm:text-3xl"
              style={{ color: KUKIDO_BLUE_DEEP }}
            >
              Cookie Menu
            </h2>

            <ul className="mb-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-7">
              {KUKIDO_COOKIE_IDS.map((id, i) => {
                const remote = products.find((p) => p.id === id)?.image;
                return (
                  <motion.li
                    key={id}
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.55,
                      delay: reduce ? 0 : 0.05 * i,
                      ease: [0.32, 0.72, 0, 1],
                    }}
                    className="flex flex-col items-center text-center"
                  >
                    <span className="mb-2.5 block aspect-square w-[min(100%,7.5rem)] overflow-hidden rounded-full bg-[#F0EEE8] shadow-[inset_0_0_0_1px_rgba(25,25,25,0.06)] sm:w-[8.5rem]">
                      <img
                        src={resolveKukidoCookieImage(id, remote) || KUKIDO_COOKIE_IMAGE[id]}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        width={200}
                        height={200}
                      />
                    </span>
                    <span
                      className="text-[11px] font-bold lowercase leading-snug sm:text-xs"
                      style={{ color: KUKIDO_BLUE_DEEP }}
                    >
                      {KUKIDO_COOKIE_LABEL[id]}
                    </span>
                  </motion.li>
                );
              })}
            </ul>

            <div
              className="rounded-2xl px-4 py-5 text-white sm:px-6"
              style={{ backgroundColor: KUKIDO_BLUE_DEEP }}
            >
              <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Single kuki</p>
                  <p className="mt-1 font-display text-3xl font-black">{formatPhp(singlePrice)}</p>
                  <p className="mt-1 text-[11px] text-white/75">Free box starts at 4 cookies</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Kuki boxes</p>
                  <ul className="mt-1.5 space-y-0.5 text-sm font-semibold tabular-nums">
                    {boxOptions.map((o) => (
                      <li key={o.size} className="flex justify-between gap-3 border-b border-white/15 py-1 last:border-0">
                        <span>{o.size} pcs</span>
                        <span>{formatPhp(o.price)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-white/70">
                    From {formatPhp(Math.min(...boxOptions.map((o) => o.perCookie)))} per cookie in larger boxes
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
                  Single +{Math.round(packPrices.single)} · Big box +{Math.round(packPrices.big)}
                </p>
                <Link
                  to="/pastries"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-[10px] font-black uppercase tracking-[0.14em] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                  style={{ color: KUKIDO_BLUE_DEEP }}
                >
                  Add a box
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
