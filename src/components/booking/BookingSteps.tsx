import { ClipboardList, Calculator, MessageSquare, CalendarCheck } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Choose your setup',
    body: 'Pick a booth package and optional add-ons based on your event style and headcount.',
  },
  {
    icon: Calculator,
    title: 'Review estimate',
    body: 'See a live quote preview with transparent line items before submitting your request.',
  },
  {
    icon: MessageSquare,
    title: 'We confirm details',
    body: 'Our team reviews your request, shares final notes, and aligns the event flow with you.',
  },
  {
    icon: CalendarCheck,
    title: 'Secure your date',
    body: 'Confirm your booking and lock your event date once terms and schedule are approved.',
  },
];

export default function BookingSteps() {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red mb-3">How it works</p>
        <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight text-kado-dark mb-10">
          Book In 4 Simple Steps
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className="rounded-2xl bg-white border border-kado-dark/10 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="w-10 h-10 rounded-xl bg-kado-red/10 text-kado-red flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-kado-dark/45">
                    0{idx + 1}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-kado-dark mb-2">{step.title}</h3>
                <p className="text-sm text-kado-dark/65 leading-relaxed">{step.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
