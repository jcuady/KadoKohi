import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  KUKIDO_BLUE,
  KUKIDO_BLUE_DEEP,
  KUKIDO_COOKIE_IMAGE,
  KUKIDO_COOKIE_LABEL,
  KUKIDO_CREAM,
  KUKIDO_PAPER,
  KUKI_BOX_IMAGE,
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

/** Flyer grid order (2×3): top row then bottom row — matches cookie menu flyer. */
const FLYER_COOKIE_ORDER: readonly KukidoCookieId[] = [
  'cookie_klassic',
  'cookie_double_dark',
  'cookie_birthday',
  'cookie_campfire',
  'cookie_white_walnut',
  'cookie_blondie',
] as const;

const EASE = [0.32, 0.72, 0, 1] as const;

/**
 * Homepage kukidō collab — bright royal blue field + taped white cookie menu
 * (no charcoal / dark vignettes). Prices follow Admin → Menu → Pastries.
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
  const featuredBoxes = useMemo(
    () => boxOptions.filter((o) => o.size === 4 || o.size === 5 || o.size === 6),
    [boxOptions],
  );

  return (
    <section
      id="landing-kukido"
      aria-labelledby="kukido-collab-heading"
      className="relative isolate overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 md:px-8 md:pb-24 md:pt-16 lg:px-16 lg:pb-28 lg:pt-20"
      style={{ backgroundColor: KUKIDO_BLUE }}
    >
      {/* Soft light bloom only — never a dark vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 50% 0%, rgba(255,255,255,0.22), transparent 58%), radial-gradient(ellipse 40% 35% at 85% 80%, rgba(255,255,255,0.12), transparent 55%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-xl sm:max-w-2xl lg:max-w-3xl">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative mx-auto"
        >
          <div
            aria-hidden
            className="absolute -top-3 left-1/2 z-20 h-7 w-24 -translate-x-1/2 -rotate-2 rounded-[2px] opacity-95 sm:h-8 sm:w-32 md:w-36"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.4), transparent 42%), #5B8DEF',
              boxShadow: '0 2px 8px rgba(10,40,120,0.18)',
            }}
          />

          <div
            className="relative overflow-hidden rounded-[1.15rem] px-4 py-7 sm:rounded-[1.35rem] sm:px-7 sm:py-9 md:px-9 md:py-10"
            style={{
              backgroundColor: KUKIDO_PAPER,
              boxShadow: '0 24px 48px rgba(20,58,158,0.28)',
            }}
          >
            <div className="mb-5 flex items-center justify-center gap-3 border-b border-black/10 pb-4 sm:mb-6 sm:gap-5 sm:pb-5">
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

              <span className="h-9 w-px shrink-0 self-center bg-black/15 sm:h-11" aria-hidden />

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
                      ease: EASE,
                    }}
                    className="flex flex-col items-center text-center"
                  >
                    {/* Flyer: cookie on solid black circle */}
                    <span className="mb-2 flex aspect-square w-[min(100%,6.75rem)] items-center justify-center overflow-hidden rounded-full bg-black sm:mb-2.5 sm:w-[min(100%,8rem)]">
                      <img
                        src={resolveKukidoCookieImage(id, remote) || KUKIDO_COOKIE_IMAGE[id]}
                        alt=""
                        className="h-[88%] w-[88%] object-contain object-center"
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
                    {boxOptions
                      .filter((o) => o.size !== 10)
                      .map((o) => (
                        <li
                          key={o.size}
                          className="flex justify-between gap-3 border-b border-white/15 py-1 last:border-0"
                        >
                          <span>{o.size} pcs</span>
                          <span>{formatPhp(o.price)}</span>
                        </li>
                      ))}
                  </ul>
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
                  Build a box
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cream Kuki Singles / box gallery — light surface, punchy blue type */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, delay: reduce ? 0 : 0.08, ease: EASE }}
          className="relative z-10 mt-10 overflow-hidden rounded-[1.35rem] px-4 py-8 sm:mt-12 sm:rounded-[1.5rem] sm:px-7 sm:py-10 md:px-9"
          style={{ backgroundColor: KUKIDO_CREAM }}
        >
          <h3
            className="mb-6 text-center font-display text-[clamp(1.35rem,4vw,1.85rem)] font-black tracking-tight sm:mb-8"
            style={{ color: KUKIDO_BLUE }}
          >
            Kuki Boxes
          </h3>
          <ul className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-5">
            {featuredBoxes.map((box, i) => (
              <motion.li
                key={box.productId}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: reduce ? 0 : 0.06 * i, ease: EASE }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-3 aspect-square w-full max-w-[14rem] overflow-hidden rounded-[1.25rem] bg-white/50 sm:max-w-none">
                  <img
                    src={KUKI_BOX_IMAGE[box.productId] ?? KUKI_BOX_IMAGE.kuki_box_4}
                    alt=""
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={400}
                  />
                </div>
                <p
                  className="font-display text-[clamp(0.85rem,2.4vw,1rem)] font-black uppercase tracking-[0.06em]"
                  style={{ color: KUKIDO_BLUE }}
                >
                  {box.size}-pc box
                </p>
                <p className="mt-1 text-sm font-semibold tabular-nums" style={{ color: KUKIDO_BLUE }}>
                  {formatPhp(box.price)}
                </p>
              </motion.li>
            ))}
          </ul>
          <div className="mt-8 flex justify-center">
            <Link
              to="/pastries"
              className="inline-flex min-h-11 items-center justify-center rounded-full px-6 text-[10px] font-black uppercase tracking-[0.14em] text-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
              style={{ backgroundColor: KUKIDO_BLUE }}
            >
              Order cookies
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
