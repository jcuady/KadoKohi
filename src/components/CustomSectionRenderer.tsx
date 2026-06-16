import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';
import { useSectionStore, type CustomSection } from '../store/sectionStore';

// ─── FAQ data ────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'Where is Kado Kohi located?',
    a: 'Our flagship branch is at J.P. Laurel St. Corner Mt. Everest, Marikina City. A second branch at Greenhills Mall is coming soon — follow us on Instagram for the opening date.',
  },
  {
    q: 'What are your opening hours?',
    a: 'We\'re open Monday through Sunday, 7:00 AM to 11:00 PM. On event nights we sometimes stay open later — check our Kado Events page for the schedule.',
  },
  {
    q: 'How do I order online?',
    a: 'Head to the All Coffee page, browse the menu, and add items to your cart. You can choose pickup or dine-in and place your order before you even arrive. No account required for guest orders.',
  },
  {
    q: 'Can I order at my table by scanning a QR code?',
    a: 'Yes — every table inside the store has a Kado QR card. Just point your camera at it, and the menu loads instantly in your browser. No app download needed.',
  },
  {
    q: 'What is the Kado Circle loyalty programme?',
    a: 'Every drink earns a digital stamp on your Kado Circle card. Collect 10 stamps and your next drink is on us. Stamps are stored on your account and never expire as long as you visit at least once every 6 months.',
  },
  {
    q: 'Do you use plant-based milk?',
    a: 'Absolutely. We carry Oatside oat milk and soy milk across all our espresso-based drinks. You can switch your milk at checkout — oat and soy add ₱50 to the base price.',
  },
  {
    q: 'Can I host events or book the space for a private session?',
    a: 'Yes, the Kado Circle space is available for intimate events on selected evenings. Reach out via the Contact page or DM us on Instagram and our team will get back to you within 24 hours.',
  },
  {
    q: 'Is there parking at the Marikina branch?',
    a: 'Street parking is available along J.P. Laurel. For peak weekend nights, we recommend arriving by ride-share or dropping off at the corner of Mt. Everest for the shortest walk.',
  },
];

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-kado-dark/10 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-6 py-5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2 rounded-sm"
        aria-expanded={isOpen}
      >
        <span className="font-display font-bold text-kado-dark text-base md:text-lg leading-snug group-hover:text-kado-red transition-colors">
          {q}
        </span>
        <span className="shrink-0 w-7 h-7 rounded-full border border-kado-dark/15 flex items-center justify-center text-kado-dark/50 group-hover:border-kado-red group-hover:text-kado-red transition-all">
          {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm md:text-base text-kado-dark/65 leading-relaxed max-w-2xl">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQSection({ section }: { section: CustomSection }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (i: number) => setOpenIdx((prev) => (prev === i ? null : i));

  return (
    <section className="py-20 px-6 md:px-12 lg:px-24 w-full bg-kado-offwhite border-t border-kado-dark/8">
      <div className="max-w-[1100px] mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <span className="text-kado-red font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
              角 Good to know
            </span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-kado-dark leading-tight">
              {section.title ?? 'Common questions.'}
            </h2>
          </div>
          <p className="text-kado-dark/50 text-sm md:text-base max-w-xs hidden md:block leading-relaxed">
            {section.body ?? "Everything you need before you pull up a chair."}
          </p>
        </div>

        {/* Two-column grid on desktop */}
        <div className="grid md:grid-cols-2 gap-x-16">
          <div>
            {FAQS.slice(0, Math.ceil(FAQS.length / 2)).map((faq, i) => (
              <div key={i}>
                <FAQItem
                  q={faq.q}
                  a={faq.a}
                  isOpen={openIdx === i}
                  onToggle={() => toggle(i)}
                />
              </div>
            ))}
          </div>
          <div>
            {FAQS.slice(Math.ceil(FAQS.length / 2)).map((faq, i) => {
              const idx = Math.ceil(FAQS.length / 2) + i;
              return (
                <div key={idx}>
                  <FAQItem
                    q={faq.q}
                    a={faq.a}
                    isOpen={openIdx === idx}
                    onToggle={() => toggle(idx)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-14 pt-10 border-t border-kado-dark/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-kado-dark/55 text-sm">Still have questions? We're happy to help.</p>
          <Link
            to="/contact"
            className="text-kado-dark border border-kado-dark/20 hover:border-kado-red hover:text-kado-red px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-colors"
          >
            Contact us →
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionCard({ section }: { section: CustomSection }) {
  switch (section.type) {
    case 'image-text':
      return (
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="rounded-[2.5rem] bg-kado-offwhite border border-kado-dark/10 overflow-hidden grid md:grid-cols-2 gap-0">
            {section.image && (
              <div className="aspect-[4/3] md:aspect-auto">
                <img src={section.image} alt={section.title ?? ''} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              {section.title && <h2 className="font-display text-2xl md:text-3xl font-bold text-kado-dark mb-4">{section.title}</h2>}
              {section.body && <p className="text-sm md:text-base text-kado-dark/70 leading-relaxed mb-6">{section.body}</p>}
              {section.ctaLabel && section.ctaHref && (
                <Link to={section.ctaHref} className="inline-flex rounded-full bg-kado-red text-kado-cream px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors self-start">
                  {section.ctaLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="rounded-[2.5rem] bg-kado-dark p-10 md:p-14">
            {section.title && <h2 className="font-display text-2xl md:text-3xl font-bold text-kado-cream mb-4">{section.title}</h2>}
            {section.body && <p className="text-sm md:text-base text-kado-cream/70 leading-relaxed mb-8 max-w-lg mx-auto">{section.body}</p>}
            {section.ctaLabel && section.ctaHref && (
              <Link to={section.ctaHref} className="inline-flex rounded-full bg-kado-red text-kado-cream px-8 py-4 text-xs font-bold uppercase tracking-wider hover:bg-kado-cream hover:text-kado-dark transition-colors">
                {section.ctaLabel}
              </Link>
            )}
          </div>
        </div>
      );

    case 'hero':
      return (
        <div className="relative px-6 py-20 text-center bg-kado-dark text-kado-cream overflow-hidden">
          {section.image && <img src={section.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
          <div className="relative z-10 max-w-3xl mx-auto">
            {section.title && <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{section.title}</h2>}
            {section.body && <p className="text-base md:text-lg text-kado-cream/80 mb-8">{section.body}</p>}
            {section.ctaLabel && section.ctaHref && (
              <Link to={section.ctaHref} className="inline-flex rounded-full bg-kado-red text-kado-cream px-8 py-4 text-xs font-bold uppercase tracking-wider hover:bg-kado-cream hover:text-kado-dark transition-colors">
                {section.ctaLabel}
              </Link>
            )}
          </div>
        </div>
      );

    case 'stat':
      return (
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          {section.title && <p className="font-display text-5xl md:text-7xl font-bold text-kado-red mb-4">{section.title}</p>}
          {section.body && <p className="text-sm md:text-base text-kado-dark/70">{section.body}</p>}
        </div>
      );

    case 'gallery':
      return (
        <div className="max-w-6xl mx-auto px-6 py-16">
          {section.title && <h2 className="font-display text-2xl md:text-3xl font-bold text-kado-dark mb-6 text-center">{section.title}</h2>}
          {section.image && (
            <div className="rounded-[2rem] overflow-hidden border border-kado-dark/10">
              <img src={section.image} alt={section.title ?? ''} className="w-full h-auto" />
            </div>
          )}
          {section.body && <p className="text-sm text-kado-dark/60 text-center mt-4">{section.body}</p>}
        </div>
      );

    case 'faq':
      return <FAQSection section={section} />;

    default:
      return null;
  }
}

export default function CustomSectionRenderer() {
  const hydrateFromRemote = useSectionStore((s) => s.hydrateFromRemote);
  const allSections = useSectionStore((s) => s.sections);
  const sections = useMemo(
    () =>
      [...allSections]
        .filter((sec) => sec.page === 'home' && sec.visible)
        .sort((a, b) => a.order - b.order),
    [allSections],
  );

  useEffect(() => {
    void hydrateFromRemote();
  }, [hydrateFromRemote]);

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section) => (
        <div key={section.id}>
          <SectionCard section={section} />
        </div>
      ))}
    </>
  );
}
