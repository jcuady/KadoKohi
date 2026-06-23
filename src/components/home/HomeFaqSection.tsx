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
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-trigger-${index}`;

  return (
    <article className="flex h-full min-w-0 flex-col">
      <h3 className="m-0">
        <button
          id={buttonId}
          type="button"
          onClick={onToggle}
          className="group flex w-full min-h-[52px] items-center justify-between gap-3 rounded-xl border border-kado-cream/20 bg-kado-cream px-4 py-3.5 text-left shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-kado-red sm:px-5 sm:py-4"
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <CmsStyledText
            value={question}
            as="span"
            className="flex-1 font-display text-[0.9375rem] font-bold leading-snug text-kado-dark sm:text-base"
            {...cmsTextProps(cmsEditMode, `faq.item.${index}.question`, `Question ${index + 1}`, (v) =>
              updateFaqItem(index, { question: v }),
            )}
          />
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-kado-dark/45 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-1 pt-3 pb-1 sm:px-2 sm:pt-3.5">
              <CmsStyledText
                value={answer}
                as="p"
                className="whitespace-pre-line text-left text-sm leading-relaxed text-white/90 sm:text-[0.9375rem]"
                {...cmsTextProps(cmsEditMode, `faq.item.${index}.answer`, `Answer ${index + 1}`, (v) =>
                  updateFaqItem(index, { answer: v }),
                )}
              />

              {showMapLink ? (
                <div className="mt-4 space-y-3">
                  <a
                    href={kadoMapsSearchUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-kado-cream/80 bg-kado-cream/10 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-kado-cream transition-colors hover:bg-kado-cream/20"
                  >
                    Open in Google Maps
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                    Nearby landmarks
                  </p>
                  <div className="rounded-xl border border-kado-cream/20 bg-kado-cream/10 px-4 py-3 text-left text-xs leading-relaxed text-white/85 sm:text-sm">
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
    </article>
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
      className="relative w-full overflow-hidden bg-kado-red px-5 py-16 text-white sm:px-8 md:px-10 md:py-20 lg:px-16 lg:py-24"
    >
      {/* ponytail: lightweight grain — SVG feTurbulence, no image asset */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <header className="mx-auto mb-8 max-w-2xl text-center md:mb-10 lg:mb-12">
          <CmsStyledText
            value={copy.eyebrow}
            as="p"
            className="font-display text-base font-black tracking-[0.14em] text-white/90 sm:text-lg"
            {...cmsTextProps(cmsEditMode, 'faq.eyebrow', 'FAQ eyebrow', (v) => updateFaq({ eyebrow: v }))}
          />
          <CmsStyledText
            value={copy.title}
            as="h2"
            className="mt-2 font-display text-2xl font-black uppercase leading-tight tracking-[0.05em] text-white sm:text-3xl lg:text-[2rem]"
            {...cmsTextProps(cmsEditMode, 'faq.title', 'FAQ title', (v) => updateFaq({ title: v }))}
          />
          {cmsTextPlain(copy.subtitle).trim() ? (
            <CmsStyledText
              value={copy.subtitle}
              as="p"
              className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/70 md:mt-4"
              {...cmsTextProps(cmsEditMode, 'faq.subtitle', 'FAQ subtitle', (v) => updateFaq({ subtitle: v }))}
            />
          ) : null}
        </header>

        <div className="grid grid-cols-1 items-start gap-x-8 gap-y-3 sm:gap-y-3.5 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-4">
          {items.map((item, i) => (
            <div key={`faq-${i}-${cmsTextPlain(item.question).slice(0, 24)}`} className="min-w-0">
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

        <footer className="mx-auto mt-10 max-w-xl text-center md:mt-12 lg:mt-14">
          <CmsStyledText
            value={copy.footerText}
            as="p"
            className="text-xs font-bold uppercase tracking-[0.12em] text-white/75 sm:text-sm"
            {...cmsTextProps(cmsEditMode, 'faq.footerText', 'FAQ footer', (v) => updateFaq({ footerText: v }))}
          />
          <div className="mt-4 flex flex-col items-center gap-2.5 sm:mt-5 sm:gap-3">
            <a
              href={SEO_SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border-2 border-white/90 px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-kado-red"
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
              className="text-xs font-semibold text-white/55 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              Or message us on the contact page →
            </Link>
          </div>
        </footer>
      </div>
    </section>
  );
}
