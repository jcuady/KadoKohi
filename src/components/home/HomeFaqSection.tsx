import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ExternalLink, Instagram } from 'lucide-react';
import type { FaqCopy } from '../../store/landingContentStore';
import { useLandingContentStore } from '../../store/landingContentStore';
import CmsStyledText from '../cms/CmsStyledText';
import { cmsTextPlain } from '../../lib/cmsTypography';
import { cmsTextProps } from '../../lib/cmsFieldBind';
import { HOME_FAQ_LOCATION_INDEX } from '../../data/homeFaqSeed';
import { kadoMapsSearchUrl } from '../../content/kadoLocation';
import { SEO_SOCIAL } from '../../content/seo';

type Props = {
  copy: FaqCopy;
  cmsEditMode?: boolean;
};

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
  cmsEditMode,
  index,
  showMapLink,
}: {
  question: FaqCopy['items'][number]['question'];
  answer: FaqCopy['items'][number]['answer'];
  isOpen: boolean;
  onToggle: () => void;
  cmsEditMode?: boolean;
  index: number;
  showMapLink: boolean;
}) {
  const updateFaqItem = useLandingContentStore((s) => s.updateFaqItem);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-3 rounded-2xl bg-kado-cream px-5 py-4 text-left shadow-sm transition-transform hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-kado-red"
        aria-expanded={isOpen}
      >
        <CmsStyledText
          value={question}
          as="span"
          className="flex-1 font-display text-sm font-bold leading-snug text-kado-dark sm:text-base"
          {...cmsTextProps(cmsEditMode, `faq.item.${index}.question`, `Question ${index + 1}`, (v) =>
            updateFaqItem(index, { question: v }),
          )}
        />
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-kado-dark/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-1 pt-4 pb-2 text-center sm:px-2">
              <CmsStyledText
                value={answer}
                as="p"
                className="whitespace-pre-line text-sm leading-relaxed text-white/90 sm:text-base"
                {...cmsTextProps(cmsEditMode, `faq.item.${index}.answer`, `Answer ${index + 1}`, (v) =>
                  updateFaqItem(index, { answer: v }),
                )}
              />

              {showMapLink ? (
                <div className="mt-5 space-y-3">
                  <a
                    href={kadoMapsSearchUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-kado-cream/90 bg-kado-cream/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-kado-cream transition-colors hover:bg-kado-cream/20"
                  >
                    Open in Google Maps
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                    Nearby landmarks
                  </p>
                  <div className="rounded-2xl border border-kado-cream/25 bg-kado-cream/10 px-4 py-3 text-left text-xs leading-relaxed text-white/85 sm:text-sm">
                    <p>Marikina Science School</p>
                    <p className="mt-1">Shell Gas Station along Mayor Gil Fernando Ave.</p>
                  </div>
                  <Link
                    to="/branches"
                    className="inline-block text-xs font-semibold text-kado-cream/80 underline-offset-2 hover:text-white hover:underline"
                  >
                    Branch details on kadokohi.com →
                  </Link>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function HomeFaqSection({ copy, cmsEditMode }: Props) {
  const updateFaq = useLandingContentStore((s) => s.updateFaq);
  const [openIdx, setOpenIdx] = useState<number | null>(HOME_FAQ_LOCATION_INDEX);
  const items = copy.items.filter((item) => cmsTextPlain(item.question).trim());

  const toggle = (i: number) => setOpenIdx((prev) => (prev === i ? null : i));

  return (
    <section
      id="landing-faq"
      className="relative w-full overflow-hidden bg-kado-red py-20 px-6 text-white md:px-12 lg:px-24"
    >
      {/* ponytail: lightweight grain — SVG feTurbulence, no image asset */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-xl">
        <header className="mb-10 text-center sm:mb-12">
          <CmsStyledText
            value={copy.eyebrow}
            as="p"
            className="font-display text-lg font-black tracking-[0.12em] text-white sm:text-xl"
            {...cmsTextProps(cmsEditMode, 'faq.eyebrow', 'FAQ eyebrow', (v) => updateFaq({ eyebrow: v }))}
          />
          <CmsStyledText
            value={copy.title}
            as="h2"
            className="mt-2 font-display text-2xl font-black uppercase leading-tight tracking-[0.06em] text-white sm:text-3xl md:text-4xl"
            {...cmsTextProps(cmsEditMode, 'faq.title', 'FAQ title', (v) => updateFaq({ title: v }))}
          />
          {cmsTextPlain(copy.subtitle).trim() ? (
            <CmsStyledText
              value={copy.subtitle}
              as="p"
              className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/70"
              {...cmsTextProps(cmsEditMode, 'faq.subtitle', 'FAQ subtitle', (v) => updateFaq({ subtitle: v }))}
            />
          ) : null}
        </header>

        <div className="flex flex-col gap-4 sm:gap-5">
          {items.map((item, i) => (
            <div key={`faq-${i}-${cmsTextPlain(item.question).slice(0, 24)}`}>
              <FaqItem
                question={item.question}
                answer={item.answer}
                isOpen={openIdx === i}
                onToggle={() => toggle(i)}
                cmsEditMode={cmsEditMode}
                index={i}
                showMapLink={i === HOME_FAQ_LOCATION_INDEX}
              />
            </div>
          ))}
        </div>

        <footer className="mt-14 text-center">
          <CmsStyledText
            value={copy.footerText}
            as="p"
            className="text-sm font-bold uppercase tracking-[0.12em] text-white/80 sm:text-base"
            {...cmsTextProps(cmsEditMode, 'faq.footerText', 'FAQ footer', (v) => updateFaq({ footerText: v }))}
          />
          <div className="mt-5 flex flex-col items-center gap-3">
            <a
              href={SEO_SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border-2 border-white px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-white hover:text-kado-red"
            >
              <Instagram className="h-4 w-4" aria-hidden />
              <CmsStyledText
                value={copy.contactCtaLabel}
                as="span"
                {...cmsTextProps(cmsEditMode, 'faq.contactCtaLabel', 'Contact CTA', (v) =>
                  updateFaq({ contactCtaLabel: v }),
                )}
              />
            </a>
            <Link
              to="/contact"
              className="text-xs font-semibold text-white/60 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              Or message us on the contact page →
            </Link>
          </div>
        </footer>
      </div>
    </section>
  );
}
