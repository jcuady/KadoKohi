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
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute right-0 top-[5%] w-[68%] overflow-hidden rounded-2xl border border-kado-cream/10 shadow-2xl shadow-black/30">
        <img src="/images/hero-interior.png" alt="Barista at the counter" className="h-48 w-full object-cover" />
        <div className="bg-kado-offwhite p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-kado-red">
              <span className="text-[7px] font-black text-white">角</span>
            </div>
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
      <div className="absolute bottom-[8%] left-0 w-[42%] rounded-xl border border-kado-dark/10 bg-kado-offwhite p-4 shadow-xl">
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
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute right-0 top-[2%] w-[72%] overflow-hidden rounded-2xl border border-kado-dark/10 shadow-2xl">
        <div className="flex items-center gap-2 bg-kado-dark/90 px-3 py-2">
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-kado-red/80" />
            <div className="h-2 w-2 rounded-full bg-yellow-500/80" />
            <div className="h-2 w-2 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 rounded-full bg-kado-dark/60 px-3 py-0.5">
            <span className="font-mono text-[8px] text-white/40">kado-kohi.com/menu</span>
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
      <div className="absolute bottom-[10%] left-0 flex max-w-[88%] items-center gap-3 rounded-2xl bg-kado-dark px-4 py-3 text-kado-cream shadow-xl">
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
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute right-[5%] top-[4%] w-[56%] overflow-hidden rounded-2xl border border-kado-dark/10 bg-kado-offwhite shadow-2xl">
        <div className="flex items-center gap-2 bg-kado-dark p-4">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-kado-red">
            <span className="text-[8px] font-black text-white">角</span>
          </div>
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
      <div className="absolute bottom-[6%] left-0 w-[50%] overflow-hidden rounded-2xl bg-kado-dark shadow-xl">
        <img src="/images/hero-coffee.png" alt="Coffee shop table" className="h-16 w-full object-cover opacity-60" />
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
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute right-0 top-[4%] w-[68%] overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: 'linear-gradient(135deg,#9E181D 0%,#4a0d10 100%)' }}
      >
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-kado-cream/50">Kado Circle</p>
              <p className="text-base font-black tracking-tight text-kado-cream">Juan Cruz</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-kado-cream/20 bg-kado-cream/10">
              <span className="text-sm font-black text-kado-cream">角</span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {Array(10)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="flex aspect-square w-full items-center justify-center rounded-full"
                  style={{
                    background: i < 8 ? 'rgba(241,223,186,0.9)' : 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(241,223,186,0.2)',
                  }}
                >
                  {i < 8 && <span className="text-[8px] font-black text-kado-red">角</span>}
                </div>
              ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-[8%] left-0 flex w-[52%] items-center gap-3 rounded-2xl border border-kado-dark/8 bg-white p-3 shadow-2xl">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-kado-red">
          <span className="text-[8px] font-black uppercase tracking-wide text-kado-cream">+1</span>
        </div>
        <div>
          <p className="text-[9px] font-black text-kado-dark">Congrats! Free drink earned</p>
          <p className="text-[8px] text-kado-dark/40">Redeem at any Kado branch</p>
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

  return (
    <section className={clsx('landing-section relative w-full min-w-0 overflow-hidden bg-kado-offwhite', className)}>
      <div
        aria-hidden
        className="kado-kanji-watermark -right-2 top-6 text-[clamp(7rem,20vw,14rem)] text-kado-dark/[0.04]"
      >
        角
      </div>

      <div className="relative mx-auto flex max-w-[1200px] flex-col gap-8 lg:gap-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
          <div>
            <CmsStyledText
              value={copy?.badge ?? 'How it works'}
              as="span"
              className="kado-label mb-3 block text-kado-red"
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
              'Walk in, order online, or scan a table QR — then collect stamps every time.'
            }
            as="p"
            className="hidden max-w-sm md:block"
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
          className="-mt-2 md:hidden"
          defaultSizeClass="kado-body"
          defaultColorClass="text-kado-dark/55"
          {...cmsTextProps(cmsEditMode, 'ordering.subtitleMobile', 'Subtitle (mobile)', (v) =>
            updateOrdering({ subtitleMobile: v }),
          )}
        />

        <div className="overflow-hidden rounded-3xl border border-kado-dark/10 bg-kado-cream shadow-[0_24px_64px_rgba(25,25,25,0.08)]">
          <div className="grid min-h-[420px] lg:grid-cols-[minmax(0,13rem)_1fr]">
            <nav
              className="flex flex-row gap-1 overflow-x-auto border-b border-kado-dark/10 bg-kado-dark p-3 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-b-0 lg:border-r lg:p-0"
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
                      'flex min-h-[44px] min-w-[9rem] shrink-0 items-center gap-3 px-4 py-3 text-left transition-colors lg:min-w-0 lg:w-full lg:px-5 lg:py-5',
                      active ? 'bg-kado-red text-kado-cream' : 'text-kado-cream/65 hover:bg-white/5 hover:text-kado-cream',
                    )}
                  >
                    <span
                      className={clsx(
                        'font-display text-2xl font-black leading-none tabular-nums lg:text-3xl',
                        active ? 'text-kado-cream' : 'text-kado-cream/35',
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] sm:inline">
                      <CmsStyledText value={step.eyebrow} as="span" />
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="grid min-h-[380px] lg:grid-cols-[minmax(0,1fr)_minmax(0,44%)]">
              <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col gap-4"
                  >
                    <CmsStyledText
                      value={steps[current].eyebrow}
                      as="p"
                      className="kado-label text-kado-red"
                      {...cmsTextProps(cmsEditMode, `ordering.step.${current}.eyebrow`, `Step ${current + 1} eyebrow`, (v) =>
                        updateOrderingStep(current, { eyebrow: v }),
                      )}
                    />
                    <CmsStyledText
                      value={steps[current].title}
                      as="h3"
                      className="kado-h2 leading-tight text-kado-dark"
                      {...cmsTextProps(cmsEditMode, `ordering.step.${current}.title`, `Step ${current + 1} title`, (v) =>
                        updateOrderingStep(current, { title: v }),
                      )}
                    />
                    <CmsStyledText
                      value={steps[current].description}
                      as="p"
                      className="max-w-lg"
                      defaultSizeClass="kado-body"
                      defaultColorClass="text-kado-dark/65"
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

              <div className="relative min-h-[240px] border-t border-kado-dark/8 bg-kado-dark/[0.03] lg:min-h-0 lg:border-l lg:border-t-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={steps[current].id}
                    className="absolute inset-0 p-5 sm:p-6"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.35 }}
                  >
                    {steps[current].visual}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center kado-subtext text-kado-dark/40">
          {cmsTextPlain(steps[current].eyebrow)} — step {current + 1} of {steps.length}
        </p>
      </div>
    </section>
  );
}
