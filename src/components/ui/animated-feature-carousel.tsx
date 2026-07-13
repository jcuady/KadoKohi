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
import { LOGO } from '../../lib/brandTokens';

interface Step {
  id: string;
  eyebrow: CmsText;
  title: CmsText;
  description: CmsText;
  visual: ReactNode;
}

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

function VisualInStore() {
  return (
    <div className="flex h-full flex-col gap-3 lg:relative lg:block lg:overflow-visible">
      <div className="overflow-hidden rounded-2xl border border-kado-cream/15 shadow-[0_20px_48px_rgba(0,0,0,0.45)] lg:absolute lg:right-0 lg:top-[2%] lg:w-[70%]">
        <img src="/images/hero-interior.png" alt="Barista at the counter" className="h-36 w-full object-cover sm:h-44 lg:h-52" />
        <div className="bg-kado-offwhite p-3 sm:p-4">
          <div className="mb-2 flex items-center gap-2 sm:mb-3">
            <img src={LOGO.hybridMark} alt="" className="h-5 w-5 object-contain" aria-hidden />
            <span className="text-[11px] font-bold tracking-tight text-kado-dark">Kado Counter</span>
          </div>
          <div className="space-y-2">
            {[
              { name: 'Matcha Oat Latte', price: '₱185' },
              { name: 'Iced Café Latte', price: '₱165' },
            ].map((i) => (
              <div
                key={i.name}
                className="flex items-center justify-between border-b border-kado-dark/8 py-1.5 last:border-0"
              >
                <span className="text-[10px] font-medium text-kado-dark">{i.name}</span>
                <span className="text-[10px] font-bold text-kado-red">{i.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-kado-cream/20 bg-kado-offwhite p-3 shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:p-4 lg:absolute lg:bottom-[6%] lg:left-0 lg:w-[44%]">
        <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-kado-dark/40">Order #042</p>
        <div className="mb-3 space-y-1">
          <div className="flex justify-between text-[10px] text-kado-dark">
            <span>Matcha Latte</span>
            <span className="font-bold">₱185</span>
          </div>
          <div className="flex justify-between text-[10px] text-kado-dark">
            <span>Ube Shio</span>
            <span className="font-bold">₱195</span>
          </div>
        </div>
        <div className="flex justify-between border-t border-dashed border-kado-dark/20 pt-2">
          <span className="text-[9px] font-bold text-kado-dark/50">TOTAL</span>
          <span className="text-[11px] font-black text-kado-red">₱380</span>
        </div>
      </div>
    </div>
  );
}

function VisualOnlineOrder() {
  return (
    <div className="flex h-full flex-col gap-3 lg:relative lg:block lg:overflow-visible">
      <div className="overflow-hidden rounded-2xl border border-kado-cream/15 shadow-[0_20px_48px_rgba(0,0,0,0.45)] lg:absolute lg:right-0 lg:top-0 lg:w-[74%]">
        <div className="flex items-center gap-2 bg-kado-dark/95 px-3 py-2">
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-kado-red/80" />
            <div className="h-2 w-2 rounded-full bg-yellow-500/80" />
            <div className="h-2 w-2 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 rounded-full bg-white/10 px-3 py-0.5">
            <span className="font-mono text-[8px] text-white/45">kado-kohi.com/menu</span>
          </div>
        </div>
        <div className="bg-kado-offwhite p-4">
          <div className="mb-3 flex gap-1.5">
            {['All', 'Hot', 'Iced', 'Matcha'].map((c, i) => (
              <span
                key={c}
                className={clsx(
                  'rounded-full px-2 py-0.5 text-[8px] font-bold',
                  i === 0 ? 'bg-kado-red text-white' : 'bg-kado-cream text-kado-dark',
                )}
              >
                {c}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { n: 'Matcha Oat Latte', p: '₱185', img: '/social/matcha-latte.png' },
              { n: 'Iced Café Latte', p: '₱165', img: '/social/cafe-latte.png' },
            ].map((p) => (
              <div key={p.n} className="overflow-hidden rounded-xl border border-kado-dark/5 bg-white shadow-sm">
                <img src={p.img} alt={p.n} className="h-16 w-full object-cover" />
                <div className="p-2">
                  <p className="truncate text-[9px] font-bold text-kado-dark">{p.n}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[9px] font-bold text-kado-red">{p.p}</p>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-kado-red text-[10px] font-bold leading-none text-white">
                      +
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-kado-cream/10 bg-kado-dark px-3 py-2.5 text-kado-cream shadow-[0_16px_40px_rgba(0,0,0,0.4)] sm:px-4 sm:py-3 lg:absolute lg:bottom-[8%] lg:left-0 lg:max-w-[90%]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#007dfe] text-[8px] font-black">
          GC
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-kado-cream/50">GCash QR</p>
          <p className="truncate text-[10px] font-black text-kado-cream">Pay · upload proof</p>
        </div>
        <div className="ml-auto shrink-0 rounded-lg bg-kado-red px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-white">
          Checkout
        </div>
      </div>
    </div>
  );
}

function VisualQROrder() {
  return (
    <div className="flex h-full flex-col gap-3 sm:flex-row lg:relative lg:block lg:overflow-visible">
      <div className="flex-1 overflow-hidden rounded-2xl border border-kado-cream/15 bg-kado-offwhite shadow-[0_20px_48px_rgba(0,0,0,0.45)] lg:absolute lg:right-[2%] lg:top-[2%] lg:w-[58%]">
        <div className="flex items-center gap-2 bg-kado-dark p-4">
          <img
            src={LOGO.hybridMark}
            alt=""
            className="h-6 w-6 object-contain brightness-0 invert"
            aria-hidden
          />
          <div>
            <p className="text-[10px] font-black tracking-tight text-kado-cream">TABLE 5</p>
            <p className="text-[8px] text-kado-cream/40">Scan to order</p>
          </div>
        </div>
        <div className="flex flex-col items-center p-4">
          <div className="mb-2 h-28 w-28 rounded-xl border border-kado-dark/10 bg-white p-2 shadow-inner">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' fill='white'/%3E%3Crect x='4' y='4' width='32' height='32' fill='none' stroke='%23191919' stroke-width='4'/%3E%3Crect x='12' y='12' width='16' height='16' fill='%239E181D'/%3E%3Crect x='60' y='4' width='32' height='32' fill='none' stroke='%23191919' stroke-width='4'/%3E%3Crect x='68' y='12' width='16' height='16' fill='%239E181D'/%3E%3Crect x='4' y='60' width='32' height='32' fill='none' stroke='%23191919' stroke-width='4'/%3E%3Crect x='12' y='68' width='16' height='16' fill='%239E181D'/%3E%3C/svg%3E\")",
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              }}
            />
          </div>
          <p className="text-center text-[8px] font-medium text-kado-dark/40">Scan → menu → GCash QR</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden rounded-2xl border border-kado-cream/10 bg-kado-dark shadow-[0_16px_40px_rgba(0,0,0,0.4)] lg:absolute lg:bottom-[4%] lg:left-0 lg:w-[52%]">
        <img src="/images/hero-coffee.png" alt="Coffee shop table" className="h-16 w-full object-cover opacity-70" />
        <div className="p-3">
          <p className="mb-0.5 text-[8px] font-bold uppercase tracking-widest text-kado-red">Table 5 · Dine In</p>
          <p className="text-[10px] font-bold text-kado-cream">Menu loaded!</p>
        </div>
      </div>
    </div>
  );
}

function VisualLoyalty() {
  return (
    <div className="flex h-full flex-col gap-3 lg:relative lg:block lg:overflow-visible">
      <div
        className="relative overflow-hidden rounded-2xl border border-kado-cream/10 shadow-[0_24px_56px_rgba(0,0,0,0.5)] lg:absolute lg:right-0 lg:top-[0%] lg:w-[72%]"
        style={{ background: 'linear-gradient(145deg,#9E181D 0%,#5c1014 48%,#2a0809 100%)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-kado-cream/10 blur-2xl"
        />
        <div className="relative p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.28em] text-kado-cream/55">Kado Circle</p>
              <p className="font-display text-lg font-black tracking-tight text-kado-cream sm:text-xl">Juan Cruz</p>
            </div>
            <img
              src={LOGO.hybridMark}
              alt=""
              className="h-9 w-9 rounded-xl object-contain brightness-0 invert"
              aria-hidden
            />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Array(10)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex aspect-square w-full items-center justify-center rounded-full border transition-transform',
                    i < 8
                      ? 'border-kado-cream/30 bg-kado-cream/95 shadow-sm'
                      : 'border-kado-cream/15 bg-white/5',
                  )}
                >
                  {i < 8 && <span className="text-[9px] font-black text-kado-red">角</span>}
                </div>
              ))}
          </div>
          <p className="mt-4 text-[9px] font-bold uppercase tracking-widest text-kado-cream/45">8 / 10 stamps</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-kado-cream/15 bg-kado-offwhite p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] sm:p-4 lg:absolute lg:bottom-[6%] lg:left-0 lg:w-[54%]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kado-red shadow-md shadow-kado-red/30">
          <span className="text-[9px] font-black uppercase tracking-wide text-kado-cream">+1</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-kado-dark">Congrats! Free drink earned</p>
          <p className="text-[8px] text-kado-dark/45">Redeem at any Kado branch</p>
        </div>
      </div>
    </div>
  );
}

const STEP_VISUALS = [
  <VisualInStore key="walk-in" />,
  <VisualOnlineOrder key="online" />,
  <VisualQROrder key="qr" />,
  <VisualLoyalty key="loyalty" />,
] as const;

const DEFAULT_STEP_COPY = [
  {
    id: 'walk-in',
    eyebrow: 'Walk In',
    title: 'Order at the counter.',
    description:
      'Pull up, pick your drink. Walk in to any branch, browse the board, and tell your barista how you want it — every cup pulled fresh.',
  },
  {
    id: 'online-gcash',
    eyebrow: 'Order Online',
    title: 'Menu, cart & GCash QR.',
    description:
      'Sign in, browse the full menu, and checkout with GCash QR. Upload your payment screenshot — we confirm and queue your order.',
  },
  {
    id: 'table-qr',
    eyebrow: 'Dine In · Table QR',
    title: 'Scan, order, pay with GCash.',
    description:
      'Scan the QR on your table to open the menu for your seat. Pay via GCash QR and upload proof — no app download required.',
  },
  {
    id: 'loyalty',
    eyebrow: 'Kado Circle',
    title: 'Earn stamps & vouchers.',
    description:
      'Completed drink orders earn stamps. Claim voucher rewards in your account and apply them at checkout.',
  },
] as const;

function buildSteps(copySteps?: OrderingCopy['steps']): Step[] {
  return DEFAULT_STEP_COPY.map((fallback, i) => {
    const cms = copySteps?.[i];
    return {
      id: fallback.id,
      eyebrow: cms?.eyebrow ?? fallback.eyebrow,
      title: cms?.title ?? fallback.title,
      description: cms?.description ?? fallback.description,
      visual: STEP_VISUALS[i] ?? STEP_VISUALS[0],
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
            defaultColorClass="text-kado-dark/55"
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
          defaultColorClass="text-kado-dark/55"
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
