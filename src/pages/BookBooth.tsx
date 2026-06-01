import { useMemo } from 'react';
import { motion } from 'motion/react';
import { CalendarHeart, Users, Clock3, BadgeCheck, ArrowDown } from 'lucide-react';
import BookingSteps from '../components/booking/BookingSteps';
import BookingWizard from '../components/booking/BookingWizard';
import { useBoothShowcaseStore } from '../store/boothShowcaseStore';
import { useBookingEstimateStore } from '../store/bookingEstimateStore';
import { formatPhp } from '../lib/money';

export default function BookBooth() {
  const estimates = useBookingEstimateStore((s) => s.estimates);
  const showcaseMediaRaw = useBoothShowcaseStore((s) => s.media);
  const showcaseMedia = useMemo(
    () =>
      [...showcaseMediaRaw]
        .filter((item) => item.visible)
        .sort((a, b) => a.order - b.order),
    [showcaseMediaRaw],
  );

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-kado-dark" style={{ minHeight: 'min(92svh, 680px)' }}>
        {/* Photo collage grid */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-0.5 opacity-60">
          <div className="col-span-4 row-span-3 overflow-hidden">
            <img src="/booth-photos/booth-1.jpg" alt="Kado Kohi booth event" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-5 row-span-4 overflow-hidden">
            <img src="/booth-photos/booth-2.jpg" alt="Kado Kohi booth setup" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-3 row-span-2 overflow-hidden">
            <img src="/booth-photos/booth-3.jpg" alt="Kado Kohi booth guests" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-4 row-span-3 overflow-hidden">
            <img src="/booth-photos/booth-4.jpg" alt="Kado Kohi event drinks" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-3 row-span-2 overflow-hidden">
            <img src="/booth-photos/booth-5.jpg" alt="Kado Kohi event venue" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
          <div className="col-span-5 row-span-2 overflow-hidden">
            <img src="/booth-photos/booth-1.jpg" alt="Kado Kohi booth" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-[3s] ease-out" />
          </div>
        </div>

        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-kado-dark/95 via-kado-dark/75 to-kado-dark/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-kado-dark/80 via-transparent to-transparent" />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col justify-end h-full px-6 sm:px-10 md:px-16 pb-12 sm:pb-16" style={{ minHeight: 'inherit' }}>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.28em] text-kado-red mb-4">
              Events &amp; Celebrations
            </p>
            <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-black text-white leading-[0.95] tracking-tight uppercase mb-5 drop-shadow-lg">
              Your Moment,<br />Our Space.
            </h1>
            <p className="text-kado-cream/85 text-base sm:text-lg leading-relaxed max-w-xl mb-8">
              Host birthdays, weddings, and intimate celebrations in a Japanese-inspired space with curated coffee, food, and an event-ready setup that's anything but ordinary.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {[
                { icon: CalendarHeart, label: 'Events & Celebrations' },
                { icon: Users, label: 'Flexible Group Sizes' },
                { icon: Clock3, label: 'Custom Duration' },
                { icon: BadgeCheck, label: 'Professional Support' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm text-[10px] sm:text-xs font-bold uppercase tracking-wider text-kado-cream/90">
                  <Icon className="w-3 h-3 text-kado-red shrink-0" />{label}
                </span>
              ))}
            </div>

            <a
              href="#booking-form"
              className="inline-flex items-center gap-2.5 min-h-[52px] px-8 bg-kado-red text-white text-xs font-bold uppercase tracking-[0.15em] rounded-sm shadow-lg shadow-kado-red/30 hover:bg-[#7d1115] transition-colors"
            >
              Book an Event <ArrowDown className="w-4 h-4 shrink-0" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── SHOWCASE ─────────────────────────────────────────────── */}
      {showcaseMedia.length > 0 && (
        <section className="py-10 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {showcaseMedia.map((media, i) => (
                <motion.article
                  key={media.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="rounded-2xl overflow-hidden border border-kado-dark/10 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <img
                    src={media.image}
                    alt={media.title}
                    className="w-full aspect-[4/3] object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-4">
                    <h3 className="font-display text-lg font-bold text-kado-dark">{media.title}</h3>
                    {media.caption && <p className="text-sm text-kado-dark/60 mt-1">{media.caption}</p>}
                  </div>
                </motion.article>
              ))}

              {/* Always show booth photos as additional cards */}
              {[
                { src: '/booth-photos/booth-3.jpg', title: 'Intimate Gatherings', caption: 'Perfect for birthdays and milestones.' },
                { src: '/booth-photos/booth-5.jpg', title: 'Event-Ready Setup', caption: 'We handle the space, you enjoy the moment.' },
                { src: '/booth-photos/booth-4.jpg', title: 'Curated Drinks Bar', caption: 'Signature Kado coffee, served fresh.' },
              ].map(({ src, title, caption }, i) => (
                <motion.article
                  key={src}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: (showcaseMedia.length + i) * 0.07 }}
                  className="rounded-2xl overflow-hidden border border-kado-dark/10 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <img src={src} alt={title} className="w-full aspect-[4/3] object-cover" />
                  <div className="p-4">
                    <h3 className="font-display text-lg font-bold text-kado-dark">{title}</h3>
                    <p className="text-sm text-kado-dark/60 mt-1">{caption}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      <BookingSteps />

      <BookingWizard />

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red mb-3">Sample Estimates</p>
          <h2 className="font-display text-3xl md:text-4xl font-black text-kado-dark mb-6">Budget Guidance</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[...estimates]
              .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
              .slice(0, 4)
              .map((estimate) => (
                <article key={estimate.id} className="rounded-2xl bg-white border border-kado-dark/10 p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-display text-xl font-bold text-kado-dark">{estimate.shortCode}</p>
                    <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full bg-kado-red/10 text-kado-red">
                      {estimate.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {estimate.lineItems.map((line) => (
                      <div key={line.id} className="flex justify-between text-sm text-kado-dark/70">
                        <span>{line.labelSnapshot}</span>
                        <span>{formatPhp(line.lineTotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-kado-dark/10 pt-2 flex justify-between font-bold text-kado-dark">
                    <span>Total</span>
                    <span className="text-kado-red">{formatPhp(estimate.total)}</span>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
