import { CalendarDays, Mail, MessageCircle } from 'lucide-react';

const STEPS = [
  {
    icon: MessageCircle,
    title: 'Share your event',
    body: 'Tell us the occasion, guest count, and what you have in mind — no packages to pick.',
  },
  {
    icon: CalendarDays,
    title: 'Choose an open date',
    body: 'Use the calendar to see which days are available. Unavailable dates are blocked by our team.',
  },
  {
    icon: Mail,
    title: 'Submit your proposal',
    body: 'We save your request and open email so you can reach our events team to discuss pricing.',
  },
];

export default function BookingSteps() {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red mb-3">How it works</p>
        <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight text-kado-dark mb-10">
          Simple, No-Pressure Booking
        </h2>

        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="rounded-2xl bg-white border border-kado-dark/10 p-5 shadow-sm">
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
