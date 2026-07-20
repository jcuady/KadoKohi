import { ArrowDown, CalendarDays, Mail, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import type { BoothHowItWorksStep } from '../../lib/boothPageContent';
import type { CmsText } from '../../lib/cmsTypography';
import CmsStyledText from '../cms/CmsStyledText';
import { boothChipKey } from '../../lib/boothPageContent';

const ICONS = [MessageCircle, CalendarDays, Mail] as const;

type Props = {
  eyebrow?: CmsText;
  title?: CmsText;
  steps?: [BoothHowItWorksStep, BoothHowItWorksStep, BoothHowItWorksStep];
};

const DEFAULT_STEPS: BoothHowItWorksStep[] = [
  {
    title: 'Share your details',
    body: 'Step through contact info, event details, and your preferred package — one section at a time.',
  },
  {
    title: 'Pick your date',
    body: 'Choose any open day on the calendar. Only dates our team marks unavailable are blocked.',
  },
  {
    title: 'Submit your proposal',
    body: 'Review your request, then submit — we save it and open email so you can reach our events team about pricing.',
  },
];

/**
 * Booking process strip — offwhite field, numbered sequence as the signature.
 * Matches homepage “How it works” tokens (pill eyebrow, display type, cream plates).
 */
export default function BookingSteps({ eyebrow, title, steps }: Props) {
  const items = steps ?? (DEFAULT_STEPS as [BoothHowItWorksStep, BoothHowItWorksStep, BoothHowItWorksStep]);

  return (
    <section className="relative overflow-hidden border-t border-kado-dark/8 bg-kado-offwhite py-14 sm:py-16 md:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(25,25,25,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(25,25,25,0.35) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 top-8 select-none font-display text-[clamp(6rem,18vw,12rem)] font-black leading-none text-kado-dark/[0.04]"
      >
        角
      </span>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <header className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <CmsStyledText
            value={eyebrow ?? 'How it works'}
            as="p"
            className="kado-label mb-3 inline-flex rounded-full border border-kado-red/20 bg-kado-red/10 px-3 py-1.5 text-kado-red"
          />
          <CmsStyledText
            value={title ?? 'Simple, No-Pressure Booking'}
            as="h2"
            className="font-display text-[clamp(1.65rem,4vw,2.35rem)] font-bold tracking-tight text-balance text-kado-dark"
          />
        </header>

        <ol className="relative grid gap-4 sm:gap-5 md:grid-cols-3 md:gap-6">
          {/* Desktop process rail */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-[2.15rem] hidden h-px bg-kado-red/25 md:block"
          />

          {items.map((step, idx) => {
            const Icon = ICONS[idx] ?? MessageCircle;
            const n = String(idx + 1).padStart(2, '0');
            return (
              <motion.li
                key={boothChipKey(step.title, idx)}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-32px' }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="relative flex gap-4 rounded-2xl border border-kado-dark/8 bg-kado-cream/55 p-5 sm:p-6 md:flex-col md:gap-0"
              >
                <div className="flex shrink-0 items-center gap-3 md:mb-5">
                  <span
                    className="font-display text-[2.35rem] font-black leading-none tracking-tight text-kado-red tabular-nums sm:text-[2.75rem]"
                    aria-hidden
                  >
                    {n}
                  </span>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-kado-offwhite text-kado-red shadow-[0_1px_0_rgba(25,25,25,0.06)] ring-1 ring-kado-dark/8 sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]" strokeWidth={1.6} aria-hidden />
                  </span>
                  <span className="sr-only">Step {idx + 1}</span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5 md:pt-0">
                  <CmsStyledText
                    value={step.title}
                    as="h3"
                    className="font-display text-lg font-bold leading-snug tracking-tight md:text-xl"
                    defaultColorClass="text-kado-dark"
                  />
                  <CmsStyledText
                    value={step.body}
                    as="p"
                    className="mt-2 max-w-sm leading-relaxed md:mt-2.5"
                    defaultSizeClass="kado-body-sm"
                    defaultColorClass="text-kado-dark/70"
                  />
                </div>
              </motion.li>
            );
          })}
        </ol>

        <div className="mt-10 flex justify-center md:mt-12">
          <a
            href="#booking-form"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-sm bg-kado-red px-7 text-xs font-bold uppercase tracking-[0.15em] text-kado-cream transition-colors hover:bg-kado-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2 focus-visible:ring-offset-kado-offwhite sm:min-h-[52px] sm:px-8"
          >
            Start your proposal <ArrowDown className="h-4 w-4 shrink-0" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
