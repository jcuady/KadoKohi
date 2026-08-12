import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Package } from 'lucide-react';
import {
  KUKIDO_BLUE,
  KUKIDO_BLUE_DEEP,
  KUKIDO_CREAM,
  KUKI_BOX_IMAGE,
  resolveKukiBoxOptions,
  type KukiBoxSize,
} from '../../lib/kukido';
import { formatPhp } from '../../lib/money';
import { useMenuStore } from '../../store/menuStore';

const EASE = [0.32, 0.72, 0, 1] as const;

type Props = {
  onBuild: (size?: KukiBoxSize) => void;
};

/**
 * High-visibility Kuki Box entry on /pastries — cream band + packaging art + size CTAs.
 * Mobile: image stacks above copy (single column). md+: editorial split.
 */
export default function KukiBoxesShowcase({ onBuild }: Props) {
  const reduce = useReducedMotion();
  const products = useMenuStore((s) => s.products);
  const boxes = useMemo(() => resolveKukiBoxOptions(products), [products]);
  const featured = boxes.find((b) => b.size === 6) ?? boxes[0];
  const rail = boxes.filter((b) => b.productId !== featured?.productId);

  if (!featured) return null;

  return (
    <section
      id="kuki-boxes"
      aria-labelledby="kuki-boxes-heading"
      className="scroll-mt-[calc(7.5rem+env(safe-area-inset-top,0px))] w-full px-4 pb-2 pt-1 sm:scroll-mt-[calc(8rem+env(safe-area-inset-top,0px))] sm:px-6 md:px-8 lg:px-16"
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.65, ease: EASE }}
        className="mx-auto w-full max-w-6xl overflow-hidden rounded-[1.25rem] sm:rounded-[1.75rem]"
        style={{ backgroundColor: KUKIDO_CREAM }}
      >
        <div className="grid w-full grid-cols-1 md:grid-cols-12 md:items-stretch">
          {/* Packaging — first on mobile so box art is obvious */}
          <div className="relative w-full md:col-span-7">
            <div className="relative aspect-[5/4] w-full overflow-hidden sm:aspect-[4/3] md:aspect-auto md:h-full md:min-h-[22rem]">
              <img
                src={KUKI_BOX_IMAGE[featured.productId] ?? KUKI_BOX_IMAGE.kuki_box_6}
                alt="Open Kuki Box with assorted kukidō cookies"
                className="h-full w-full object-cover object-center"
                loading="eager"
                decoding="async"
                width={800}
                height={640}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 md:h-2/5"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 0%, rgba(255,249,229,0.88) 100%)',
                }}
              />
              <p
                className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white sm:bottom-5 sm:left-5 sm:px-3 sm:text-[9px] sm:tracking-[0.16em]"
                style={{ backgroundColor: KUKIDO_BLUE }}
              >
                <Package className="h-3 w-3 shrink-0" aria-hidden />
                Mix your flavors
              </p>
            </div>
          </div>

          {/* Copy + size rail */}
          <div className="flex w-full flex-col justify-center px-4 py-5 sm:px-7 sm:py-8 md:col-span-5 md:px-8 md:py-10">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: KUKIDO_BLUE }}
            >
              kukidō · Kado Kohi
            </p>
            <h2
              id="kuki-boxes-heading"
              className="mt-1.5 font-display text-[clamp(1.5rem,7vw,2.15rem)] font-black leading-none tracking-tight sm:mt-2"
              style={{ color: KUKIDO_BLUE_DEEP }}
            >
              Kuki Boxes
            </h2>
            <p className="mt-2.5 max-w-none text-sm leading-relaxed text-kado-dark/65 sm:mt-3 sm:max-w-[28ch]">
              Pick 4, 5, 6, or 10 cookies — fill each slot with your flavors. Packaging optional at
              checkout.
            </p>

            <ul className="mt-4 grid grid-cols-1 gap-2 sm:mt-5">
              {[featured, ...rail].map((box) => (
                <li key={box.productId} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onBuild(box.size)}
                    disabled={!box.orderable}
                    className="group flex w-full min-h-12 items-center gap-2.5 rounded-[0.9rem] bg-white/80 px-2 py-2 text-left ring-1 ring-black/5 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.99] disabled:opacity-45 touch-manipulation sm:min-h-14 sm:gap-3 sm:rounded-[1rem] sm:px-2.5"
                  >
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[0.65rem] bg-[#FFF3D6] sm:h-12 sm:w-12 sm:rounded-[0.75rem]">
                      <img
                        src={KUKI_BOX_IMAGE[box.productId] ?? KUKI_BOX_IMAGE.kuki_box_4}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        width={96}
                        height={96}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block text-[10px] font-black uppercase tracking-[0.1em] sm:text-[11px]"
                        style={{ color: KUKIDO_BLUE_DEEP }}
                      >
                        {box.size} pcs
                      </span>
                      <span className="block truncate text-[10px] font-semibold text-kado-dark/45">
                        {formatPhp(box.perCookie)} / cookie
                      </span>
                    </span>
                    <span
                      className="shrink-0 pr-0.5 font-display text-sm font-black tabular-nums sm:pr-1 sm:text-base"
                      style={{ color: KUKIDO_BLUE }}
                    >
                      {formatPhp(box.price)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => onBuild(4)}
              className="group mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-4 text-[10px] font-black uppercase tracking-[0.14em] text-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation sm:mt-5 sm:px-5"
              style={{ backgroundColor: KUKIDO_BLUE }}
            >
              <Package className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">Build a Kuki Box</span>
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5"
                aria-hidden
              >
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
