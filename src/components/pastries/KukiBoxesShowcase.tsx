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
 * Avoids a generic 3-equal-card row: featured 6-pc hero + compact size rail.
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
      className="scroll-mt-[calc(7.5rem+env(safe-area-inset-top,0px))] px-4 pb-2 pt-1 sm:scroll-mt-[calc(8rem+env(safe-area-inset-top,0px))] sm:px-6 md:px-8 lg:px-16"
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.65, ease: EASE }}
        className="mx-auto max-w-6xl overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem]"
        style={{ backgroundColor: KUKIDO_CREAM }}
      >
        <div className="grid md:grid-cols-12 md:items-stretch">
          {/* Featured packaging — editorial left */}
          <div className="relative md:col-span-7">
            <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[5/4] md:aspect-auto md:h-full md:min-h-[22rem]">
              <img
                src={KUKI_BOX_IMAGE[featured.productId] ?? KUKI_BOX_IMAGE.kuki_box_6}
                alt=""
                className="h-full w-full object-cover object-center"
                loading="eager"
                decoding="async"
                width={800}
                height={640}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 45%, rgba(255,249,229,0.92) 100%)',
                }}
              />
              <p
                className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white sm:bottom-5 sm:left-5"
                style={{ backgroundColor: KUKIDO_BLUE }}
              >
                <Package className="h-3 w-3" aria-hidden />
                Mix your flavors
              </p>
            </div>
          </div>

          {/* Copy + size rail */}
          <div className="flex flex-col justify-center px-5 py-6 sm:px-7 sm:py-8 md:col-span-5 md:px-8 md:py-10">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: KUKIDO_BLUE }}
            >
              kukidō · Kado Kohi
            </p>
            <h2
              id="kuki-boxes-heading"
              className="mt-2 font-display text-[clamp(1.65rem,4.5vw,2.15rem)] font-black leading-none tracking-tight"
              style={{ color: KUKIDO_BLUE_DEEP }}
            >
              Kuki Boxes
            </h2>
            <p className="mt-3 max-w-[28ch] text-sm leading-relaxed text-kado-dark/65">
              Pick 4, 5, 6, or 10 cookies — fill each slot with your flavors. Packaging optional at
              checkout.
            </p>

            <ul className="mt-5 space-y-2">
              {[featured, ...rail].map((box) => (
                <li key={box.productId}>
                  <button
                    type="button"
                    onClick={() => onBuild(box.size)}
                    disabled={!box.orderable}
                    className="group flex w-full min-h-14 items-center gap-3 rounded-[1rem] bg-white/70 px-2.5 py-2 text-left ring-1 ring-black/5 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.99] disabled:opacity-45 touch-manipulation"
                  >
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-[0.75rem] bg-[#FFF3D6]">
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
                        className="block text-[11px] font-black uppercase tracking-[0.1em]"
                        style={{ color: KUKIDO_BLUE_DEEP }}
                      >
                        {box.size} pcs
                      </span>
                      <span className="block text-[10px] font-semibold text-kado-dark/45">
                        {formatPhp(box.perCookie)} / cookie
                      </span>
                    </span>
                    <span
                      className="shrink-0 pr-1 font-display text-base font-black tabular-nums"
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
              className="group mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-[10px] font-black uppercase tracking-[0.14em] text-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation"
              style={{ backgroundColor: KUKIDO_BLUE }}
            >
              <Package className="h-4 w-4" aria-hidden />
              Build a Kuki Box
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5"
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
