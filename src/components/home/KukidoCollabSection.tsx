import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  KUKIDO_BLUE,
  KUKIDO_BLUE_DEEP,
  KUKIDO_COOKIE_IMAGE,
  KUKIDO_COOKIE_LABEL,
  KUKIDO_PAPER,
  KUKI_SINGLE_PRICE,
  isKukidoCookieId,
  resolveKukiBoxOptions,
  resolveKukiPackPrices,
  resolveKukidoCookieImage,
  type KukidoCookieId,
} from '../../lib/kukido';
import { LOGO } from '../../lib/brandTokens';
import { formatPhp } from '../../lib/money';
import { useMenuStore } from '../../store/menuStore';

/** Flyer grid order (3×2): top row then bottom row. */
const FLYER_COOKIE_ORDER: readonly KukidoCookieId[] = [
  'cookie_klassic',
  'cookie_double_dark',
  'cookie_birthday',
  'cookie_campfire',
  'cookie_white_walnut',
  'cookie_blondie',
] as const;

/**
 * Homepage collab board — taped paper cookie menu on kukidō royal blue,
 * with the hero cookie peaking behind the card (flyer-faithful).
 * Prices follow Admin → Menu → Pastries when hydrated.
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
  const minPerCookie = Math.min(...boxOptions.map((o) => o.perCookie));

  return (
    <section
      id="landing-kukido"
      aria-labelledby="kukido-collab-heading"
      className="relative isolate overflow-hidden px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-16 md:px-8 md:pb-28 md:pt-20 lg:px-16 lg:pb-32 lg:pt-24"
      style={{ backgroundColor: KUKIDO_BLUE }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 100%, rgba(0,0,0,0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 18% 12%, rgba(255,255,255,0.16), transparent 50%)',
        }}
      />

      {/* Flyer cookie: sits behind the paper board, peeks bottom + sides on all orientations */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[42%] z-0 w-[min(135vw,46rem)] -translate-x-1/2 -translate-y-1/2 sm:top-[46%] sm:w-[min(105vw,50rem)] md:top-[48%] md:w-[min(88vw,54rem)] lg:w-[min(72vw,56rem)] landscape:top-[52%] landscape:w-[min(78vw,50rem)]"
      >
        <picture>
          <source srcSet="/kukido/backdrop-cookie.webp" type="image/webp" />
          <img
            src="/kukido/backdrop-cookie.png"
            alt=""
            width={682}
            height={673}
            decoding="async"
            loading="lazy"
            fetchPriority="low"
            className={[
              'mx-auto h-auto w-full object-contain opacity-[0.97]',
              'drop-shadow-[0_32px_56px_rgba(8,24,80,0.5)]',
              reduce ? '' : 'origin-center -rotate-[3deg]',
            ].join(' ')}
          />
        </picture>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-xl sm:max-w-2xl lg:max-w-3xl">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="relative mx-auto"
        >
          <div
            aria-hidden
            className="absolute -top-3 left-1/2 z-20 h-7 w-24 -translate-x-1/2 -rotate-2 rounded-[2px] opacity-95 shadow-[0_2px_6px_rgba(10,30,90,0.25)] sm:h-8 sm:w-32 md:w-36"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.35), transparent 40%), #5B8DEF',
            }}
          />

          <div
            className="relative overflow-hidden rounded-[1.15rem] px-4 py-7 shadow-[0_28px_64px_rgba(10,30,90,0.38)] sm:rounded-[1.35rem] sm:px-7 sm:py-9 md:px-9 md:py-10"
            style={{ backgroundColor: KUKIDO_PAPER }}
          >
            <div className="mb-5 flex items-center justify-center gap-3 border-b border-kado-dark/10 pb-4 sm:mb-6 sm:gap-5 sm:pb-5">
              <div className="flex min-w-0 flex-col items-center text-center">
                <p
                  className="font-display text-[clamp(1.15rem,3.6vw,1.65rem)] font-black leading-none tracking-tight"
                  style={{ color: KUKIDO_BLUE_DEEP }}
                >
                  kukidō
                </p>
                <p
                  className="mt-1 text-[clamp(0.5rem,1.6vw,0.62rem)] font-bold uppercase tracking-[0.16em]"
                  style={{ color: KUKIDO_BLUE_DEEP }}
                >
                  Handcrafted Cookies
                </p>
              </div>

              <span className="h-9 w-px shrink-0 self-center bg-kado-dark/20 sm:h-11" aria-hidden />

              {/* Official stacked KADO / KŌHĪ wordmark in brand red */}
              <div
                className="h-9 w-[4.85rem] shrink-0 bg-kado-red sm:h-11 sm:w-[5.85rem]"
                style={{
                  WebkitMaskImage: `url("${LOGO.stackedWordmark}")`,
                  maskImage: `url("${LOGO.stackedWordmark}")`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                }}
                role="img"
                aria-label="Kado Kohi"
              />
            </div>

            <h2
              id="kukido-collab-heading"
              className="mb-5 text-center font-display text-[clamp(1.45rem,4.5vw,2rem)] font-black uppercase leading-none tracking-tight sm:mb-6"
              style={{ color: KUKIDO_BLUE_DEEP }}
            >
              Cookie Menu
            </h2>

            <ul className="mb-6 grid grid-cols-2 gap-x-3 gap-y-5 sm:mb-8 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-6">
              {FLYER_COOKIE_ORDER.map((id, i) => {
                const remote = products.find((p) => p.id === id)?.image;
                return (
                  <motion.li
                    key={id}
                    initial={reduce ? false : { opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.5,
                      delay: reduce ? 0 : 0.04 * i,
                      ease: [0.32, 0.72, 0, 1],
                    }}
                    className="flex flex-col items-center text-center"
                  >
                    <span className="mb-2 block aspect-square w-[min(100%,6.75rem)] overflow-hidden rounded-full bg-[#F0EEE8] shadow-[inset_0_0_0_1px_rgba(25,25,25,0.06)] sm:mb-2.5 sm:w-[min(100%,8rem)]">
                      <img
                        src={resolveKukidoCookieImage(id, remote) || KUKIDO_COOKIE_IMAGE[id]}
                        alt=""
                        className="h-full w-full object-cover object-center"
                        loading="lazy"
                        decoding="async"
                        width={200}
                        height={200}
                      />
                    </span>
                    <span
                      className="max-w-[9.5rem] text-[clamp(0.65rem,2.2vw,0.8rem)] font-bold lowercase leading-snug"
                      style={{ color: KUKIDO_BLUE_DEEP }}
                    >
                      {KUKIDO_COOKIE_LABEL[id]}
                    </span>
                  </motion.li>
                );
              })}
            </ul>

            <div
              className="rounded-[1.1rem] px-3.5 py-4 text-white sm:rounded-2xl sm:px-5 sm:py-5"
              style={{ backgroundColor: KUKIDO_BLUE_DEEP }}
            >
              <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                <div>
                  <p className="inline-flex rounded-full border border-white/55 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white">
                    Single kuki
                  </p>
                  <p className="mt-2 font-display text-[clamp(1.75rem,6vw,2.15rem)] font-black leading-none tabular-nums">
                    {formatPhp(singlePrice)}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-snug text-white/75">
                    Free box starts at 4 cookies
                  </p>
                </div>
                <div>
                  <p className="inline-flex rounded-full border border-white/55 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white">
                    Kuki boxes
                  </p>
                  <ul className="mt-2 space-y-0.5 text-sm font-semibold tabular-nums">
                    {boxOptions.map((o) => (
                      <li
                        key={o.size}
                        className="flex justify-between gap-3 border-b border-white/15 py-1 last:border-0"
                      >
                        <span>{o.size} pcs</span>
                        <span>{formatPhp(o.price)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-white/70">
                    Cookies {formatPhp(minPerCookie)} for 6 pcs and up
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col-reverse items-stretch gap-3 border-t border-white/20 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <p className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 sm:text-left">
                  Single +{Math.round(packPrices.single)} | Big box +{Math.round(packPrices.big)}
                </p>
                <Link
                  to="/pastries"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-[10px] font-black uppercase tracking-[0.14em] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] sm:min-w-[8.5rem]"
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
