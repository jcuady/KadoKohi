import { CalendarDays, Mail, MessageCircle } from 'lucide-react';
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
  { title: 'Share your event', body: 'Tell us the occasion, guest count, and what you have in mind — no packages to pick.' },
  { title: 'Choose an open date', body: 'Use the calendar to see which days are available. Unavailable dates are blocked by our team.' },
  { title: 'Submit your proposal', body: 'We save your request and open email so you can reach our events team to discuss pricing.' },
];

export default function BookingSteps({ eyebrow, title, steps }: Props) {
  const items = steps ?? (DEFAULT_STEPS as [BoothHowItWorksStep, BoothHowItWorksStep, BoothHowItWorksStep]);

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-6">
        <CmsStyledText
          value={eyebrow ?? 'How it works'}
          as="p"
          className="text-[10px] font-black uppercase tracking-[0.2em] mb-3"
          defaultColorClass="text-kado-red"
        />
        <CmsStyledText
          value={title ?? 'Simple, No-Pressure Booking'}
          as="h2"
          className="font-display text-3xl md:text-4xl font-black tracking-tight mb-10"
          defaultColorClass="text-kado-dark"
        />

        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {items.map((step, idx) => {
            const Icon = ICONS[idx] ?? MessageCircle;
            return (
              <article key={boothChipKey(step.title, idx)} className="rounded-2xl bg-white border border-kado-dark/10 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-10 h-10 rounded-xl bg-kado-red/10 text-kado-red flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-kado-dark/45">
                    0{idx + 1}
                  </span>
                </div>
                <CmsStyledText
                  value={step.title}
                  as="h3"
                  className="font-display text-lg font-bold mb-2"
                  defaultColorClass="text-kado-dark"
                />
                <CmsStyledText
                  value={step.body}
                  as="p"
                  className="leading-relaxed"
                  defaultSizeClass="kado-body-sm"
                  defaultColorClass="text-kado-dark/65"
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
