import { useCallback, useEffect, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import type { OrderingCopy } from '../../store/landingContentStore';
import type { CmsText } from '../../lib/cmsTypography';
import CmsStyledText from '../cms/CmsStyledText';
import { useLandingContentStore } from '../../store/landingContentStore';
import { cmsTextProps } from '../../lib/cmsFieldBind';
import { cmsTextPlain } from '../../lib/cmsTypography';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { toWebpSrc } from '../../lib/toWebpSrc';

interface Step {
  id: string;
  eyebrow: CmsText;
  title: CmsText;
  description: CmsText;
  visual: ReactNode;
}

/** Figma Vector Arts — How it works step panels (Walk in / Online / Table / Loyalty). */
const DEFAULT_STEP_ICONS = [
  '/ordering/walk-in.webp',
  '/ordering/online.webp',
  '/ordering/table.webp',
  '/ordering/loyalty.webp',
] as const;

function useStepIndex(total: number, interval = 7000, paused = false) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (paused || total < 2) return;
    const id = window.setTimeout(() => setCurrent((p) => (p + 1) % total), interval);
    return () => window.clearTimeout(id);
  }, [current, total, interval, paused]);

  const setStep = useCallback((i: number) => setCurrent(i % total), [total]);
  return { current, setStep };
}

function StepArtVisual({ src, alt }: { src: string; alt: string }) {
  const webp = toWebpSrc(src) || src;
  const png = src.replace(/\.webp$/i, '.png');

  return (
    <div className="flex h-full min-h-[220px] items-center justify-center sm:min-h-[260px] lg:min-h-full">
      <picture>
        <source type="image/webp" srcSet={webp} />
        <img
          src={png}
          alt={alt}
          width={1080}
          height={1080}
          loading="lazy"
          decoding="async"
          className="h-auto max-h-[min(52svh,22rem)] w-full max-w-[22rem] object-contain select-none sm:max-h-[26rem] sm:max-w-[26rem] lg:max-h-none lg:max-w-[min(100%,28rem)]"
          draggable={false}
          onError={(e) => {
            const el = e.currentTarget;
            if (el.src.endsWith('.webp') && png !== webp) {
              el.src = png;
              return;
            }
            if (el.src !== src) el.src = src;
          }}
        />
      </picture>
    </div>
  );
}

const DEFAULT_STEP_COPY = [
  {
    id: 'walk-in',
    eyebrow: 'Walk In',
    title: 'Order at the counter.',
    description:
      'Pull up, pick your drink. Walk in to any branch, browse the board, and tell your barista how you want it — every cup pulled fresh.',
    icon: DEFAULT_STEP_ICONS[0],
  },
  {
    id: 'online-gcash',
    eyebrow: 'Order Online',
    title: 'Menu, cart & GCash QR.',
    description:
      'Sign in, browse the full menu, and checkout with GCash QR. Upload your payment screenshot — we confirm and queue your order.',
    icon: DEFAULT_STEP_ICONS[1],
  },
  {
    id: 'table-qr',
    eyebrow: 'Dine In · Table QR',
    title: 'Scan, order, pay with GCash.',
    description:
      'Scan the QR on your table to open the menu for your seat. Pay via GCash QR and upload proof — no app download required.',
    icon: DEFAULT_STEP_ICONS[2],
  },
  {
    id: 'loyalty',
    eyebrow: 'Kado Circle',
    title: 'Earn stamps & vouchers.',
    description:
      'Completed drink orders earn stamps. Claim voucher rewards in your account and apply them at checkout.',
    icon: DEFAULT_STEP_ICONS[3],
  },
] as const;

function buildSteps(copySteps?: OrderingCopy['steps']): Step[] {
  return DEFAULT_STEP_COPY.map((fallback, i) => {
    const cms = copySteps?.[i];
    const icon = cms?.icon?.trim() || fallback.icon;
    const eyebrow = cms?.eyebrow ?? fallback.eyebrow;
    return {
      id: fallback.id,
      eyebrow,
      title: cms?.title ?? fallback.title,
      description: cms?.description ?? fallback.description,
      visual: (
        <StepArtVisual
          src={icon}
          alt={`${cmsTextPlain(eyebrow)} — how ordering works at Kado Kohi`}
        />
      ),
    };
  });
}

export type KadoOrderingCarouselCopy = OrderingCopy;

export function KadoOrderingCarousel({
  className,
  copy,
  cmsEditMode,
}: {
  className?: string;
  copy?: KadoOrderingCarouselCopy;
  cmsEditMode?: boolean;
}) {
  const updateOrdering = useLandingContentStore((s) => s.updateOrdering);
  const updateOrderingStep = useLandingContentStore((s) => s.updateOrderingStep);
  const prefersReducedMotion = usePrefersReducedMotion();
  const steps = buildSteps(copy?.steps);
  const { current, setStep } = useStepIndex(steps.length, 7000, prefersReducedMotion || !!cmsEditMode);
  const layoutId = prefersReducedMotion || cmsEditMode ? undefined : 'ordering-step-highlight';

  return (
    <section className={clsx('landing-section relative w-full min-w-0 overflow-hidden bg-kado-offwhite', className)}>
      <div
        aria-hidden
        className="kado-kanji-watermark -right-2 top-6 text-[clamp(7rem,20vw,14rem)] text-kado-dark/[0.04]"
      >
        角
      </div>

      <div className="relative mx-auto flex max-w-[1200px] flex-col gap-6 sm:gap-8 lg:gap-10">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="min-w-0">
            <CmsStyledText
              value={copy?.badge ?? 'How it works'}
              as="span"
              className="kado-label mb-2 inline-flex rounded-full border border-kado-red/20 bg-kado-red/10 px-3 py-1.5 text-kado-red sm:mb-3"
              {...cmsTextProps(cmsEditMode, 'ordering.badge', 'Badge', (v) => updateOrdering({ badge: v }))}
            />
            <CmsStyledText
              value={copy?.title ?? 'Order your way.'}
              as="h2"
              className="kado-h2 text-kado-dark"
              {...cmsTextProps(cmsEditMode, 'ordering.title', 'Title', (v) => updateOrdering({ title: v }))}
            />
          </div>
          <CmsStyledText
            value={
              copy?.subtitleDesktop ??
              'Walk in, order online with GCash QR, or scan your table — drink stamps unlock when your order is complete.'
            }
            as="p"
            className="hidden max-w-md md:block md:text-right"
            defaultSizeClass="kado-body"
            defaultColorClass="text-kado-dark/70"
            {...cmsTextProps(cmsEditMode, 'ordering.subtitleDesktop', 'Subtitle (desktop)', (v) =>
              updateOrdering({ subtitleDesktop: v }),
            )}
          />
        </div>
        <CmsStyledText
          value={copy?.subtitleMobile ?? 'In-store, online, QR at your table — earn stamps every visit.'}
          as="p"
          className="-mt-1 md:hidden"
          defaultSizeClass="kado-body-sm"
          defaultColorClass="text-kado-dark/70"
          {...cmsTextProps(cmsEditMode, 'ordering.subtitleMobile', 'Subtitle (mobile)', (v) =>
            updateOrdering({ subtitleMobile: v }),
          )}
        />

        <div className="relative overflow-hidden rounded-2xl border border-kado-dark/10 bg-kado-cream shadow-[0_28px_72px_rgba(25,25,25,0.1)] sm:rounded-[1.75rem]">
          <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-kado-red" />

          <div className="grid lg:min-h-[440px] lg:grid-cols-[minmax(0,15.5rem)_1fr]">
            {/* Mobile: equal-width step tabs + progress */}
            <div className="border-b border-kado-dark/10 bg-kado-dark lg:hidden">
              <nav className="grid grid-cols-4" aria-label="Ordering steps">
                {steps.map((step, i) => {
                  const active = current === i;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setStep(i)}
                      aria-label={cmsTextPlain(step.eyebrow)}
                      aria-current={active ? 'step' : undefined}
                      className={clsx(
                        'relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-1 py-2.5 transition-colors',
                        active ? 'bg-kado-red text-kado-cream' : 'text-kado-cream/50',
                      )}
                    >
                      <span className="font-display text-xl font-black leading-none tabular-nums sm:text-2xl">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="line-clamp-1 text-[8px] font-bold uppercase tracking-[0.12em] sm:text-[9px]">
                        <CmsStyledText value={step.eyebrow} as="span" />
                      </span>
                    </button>
                  );
                })}
              </nav>
              <div className="flex gap-1 px-3 pb-3 pt-1" aria-hidden>
                {steps.map((_, i) => (
                  <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-kado-cream/15">
                    <motion.div
                      className="h-full rounded-full bg-kado-red"
                      initial={false}
                      animate={{ width: i <= current ? '100%' : '0%' }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <nav
              className="hidden border-r border-kado-dark/10 bg-kado-dark lg:flex lg:flex-col"
              aria-label="Ordering steps"
            >
              {steps.map((step, i) => {
                const active = current === i;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setStep(i)}
                    aria-current={active ? 'step' : undefined}
                    className={clsx(
                      'group relative flex w-full items-center gap-3 overflow-hidden px-6 py-0 text-left transition-colors lg:flex-1',
                      active ? 'text-kado-cream' : 'text-kado-cream/55 hover:bg-white/[0.04] hover:text-kado-cream/85',
                    )}
                  >
                    {layoutId && active && (
                      <motion.div
                        layoutId={layoutId}
                        className="absolute inset-0 bg-kado-red"
                        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                      />
                    )}
                    {!layoutId && active && <span className="absolute inset-0 bg-kado-red" />}
                    <span
                      className={clsx(
                        'relative z-[1] font-display text-[2rem] font-black leading-none tabular-nums',
                        active ? 'text-kado-cream' : 'text-kado-cream/30 group-hover:text-kado-cream/50',
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="relative z-[1] text-[10px] font-bold uppercase tracking-[0.18em]">
                      <CmsStyledText value={step.eyebrow} as="span" />
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="relative flex flex-col justify-center gap-3 p-4 sm:gap-4 sm:p-6 lg:p-10 xl:p-12">
                <span
                  aria-hidden
                  className="pointer-events-none absolute right-4 top-2 font-display text-[clamp(3.5rem,8vw,5.5rem)] font-black leading-none tabular-nums text-kado-dark/[0.045] lg:right-8 lg:top-4"
                >
                  {String(current + 1).padStart(2, '0')}
                </span>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-[1] flex flex-col gap-3 sm:gap-4"
                  >
                    <CmsStyledText
                      value={steps[current].eyebrow}
                      as="p"
                      className="kado-label hidden text-kado-red lg:block"
                      {...cmsTextProps(cmsEditMode, `ordering.step.${current}.eyebrow`, `Step ${current + 1} eyebrow`, (v) =>
                        updateOrderingStep(current, { eyebrow: v }),
                      )}
                    />
                    <CmsStyledText
                      value={steps[current].title}
                      as="h3"
                      className="kado-h3 max-w-md leading-[1.08] text-kado-dark sm:kado-h2"
                      {...cmsTextProps(cmsEditMode, `ordering.step.${current}.title`, `Step ${current + 1} title`, (v) =>
                        updateOrderingStep(current, { title: v }),
                      )}
                    />
                    <CmsStyledText
                      value={steps[current].description}
                      as="p"
                      className="max-w-md text-sm leading-relaxed sm:text-base"
                      defaultSizeClass="kado-body"
                      defaultColorClass="text-kado-dark/60"
                      {...cmsTextProps(
                        cmsEditMode,
                        `ordering.step.${current}.description`,
                        `Step ${current + 1} body`,
                        (v) => updateOrderingStep(current, { description: v }),
                      )}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="ordering-visual-stage relative min-h-[240px] border-t border-kado-cream/10 sm:min-h-[280px] lg:min-h-0 lg:border-l lg:border-t-0">
                <div
                  aria-hidden
                  className="kado-kanji-watermark right-2 top-2 text-[clamp(4rem,10vw,7rem)] text-kado-cream/[0.05] sm:right-4 sm:top-4"
                >
                  角
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={steps[current].id}
                    className="relative z-[1] p-4 sm:p-5 lg:absolute lg:inset-0 lg:p-7"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {steps[current].visual}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2" aria-hidden>
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={clsx(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === current ? 'w-8 bg-kado-red' : 'w-1.5 bg-kado-dark/15 hover:bg-kado-dark/25',
                )}
              />
            ))}
          </div>
          <p className="kado-subtext text-center text-kado-dark/40">
            {cmsTextPlain(steps[current].eyebrow)} — step {current + 1} of {steps.length}
          </p>
        </div>
      </div>
    </section>
  );
}
