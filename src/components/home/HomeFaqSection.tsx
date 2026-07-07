import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ExternalLink, Instagram, MapPin } from 'lucide-react';
import type { FaqCopy } from '../../store/landingContentStore';
import { useLandingContentStore } from '../../store/landingContentStore';
import CmsStyledText from '../cms/CmsStyledText';
import { cmsTextPlain } from '../../lib/cmsTypography';
import { cmsTextProps } from '../../lib/cmsFieldBind';
import { HOME_FAQ_LOCATION_INDEX } from '../../data/homeFaqSeed';
import { kadoMapsSearchUrl } from '../../content/kadoLocation';
import { SEO_SOCIAL } from '../../content/seo';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

type Props = {
  copy: FaqCopy;
  cmsEditMode?: boolean;
};

function faqAnswerWithoutLandmarks(text: string): string {
  return text.replace(/\n*\s*Nearby landmarks:.*$/is, '').trim();
}

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
  cmsEditMode,
  index,
  showMapLink,
  isLast,
}: {
  question: FaqCopy['items'][number]['question'];
  answer: FaqCopy['items'][number]['answer'];
  isOpen: boolean;
  onToggle: () => void;
  cmsEditMode?: boolean;
  index: number;
  showMapLink: boolean;
  isLast: boolean;
}) {
  const updateFaqItem = useLandingContentStore((s) => s.updateFaqItem);
  const prefersReducedMotion = usePrefersReducedMotion();
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-trigger-${index}`;
  const plainAnswer = cmsTextPlain(answer);
  const displayAnswer =
    showMapLink && !cmsEditMode ? faqAnswerWithoutLandmarks(plainAnswer) : plainAnswer;

  const motionProps = prefersReducedMotion
    ? { initial: false, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 } }
    : {
        initial: { height: 0, opacity: 0 },
        animate: { height: 'auto', opacity: 1 },
        exit: { height: 0, opacity: 0 },
        transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className={isLast ? '' : 'border-b border-kado-dark/8'}>
      <h3 className="m-0">
        <button
          id={buttonId}
          type="button"
          onClick={onToggle}
          className="group flex w-full min-h-[52px] items-center gap-3 px-1 py-4 text-left transition-colors sm:gap-4 sm:px-2 sm:py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2 focus-visible:ring-offset-kado-cream rounded-lg"
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-colors ${
              isOpen ? 'bg-kado-red text-kado-cream' : 'bg-kado-dark/8 text-kado-dark/55 group-hover:bg-kado-red/10 group-hover:text-kado-red'
            }`}
            aria-hidden
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <CmsStyledText
            value={question}
            as="span"
            className="min-w-0 flex-1 kado-body font-semibold text-kado-dark sm:kado-h3 sm:font-semibold"
            {...cmsTextProps(cmsEditMode, `faq.item.${index}.question`, `Question ${index + 1}`, (v) =>
              updateFaqItem(index, { question: v }),
            )}
          />
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
              isOpen
                ? 'border-kado-red/30 bg-kado-red/10 text-kado-red'
                : 'border-kado-dark/10 bg-kado-offwhite text-kado-dark/45 group-hover:border-kado-red/20 group-hover:text-kado-red'
            }`}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            key="body"
            {...motionProps}
            className="overflow-hidden"
          >
            <div className="pb-5 pl-10 pr-2 sm:pl-12 sm:pr-4">
              {cmsEditMode ? (
                <CmsStyledText
                  value={answer}
                  as="p"
                  className="whitespace-pre-line text-left text-sm leading-relaxed text-kado-dark/80 sm:text-[0.9375rem]"
                  {...cmsTextProps(cmsEditMode, `faq.item.${index}.answer`, `Answer ${index + 1}`, (v) =>
                    updateFaqItem(index, { answer: v }),
                  )}
                />
              ) : (
                <p className="whitespace-pre-line text-left kado-body leading-relaxed text-kado-dark/80">
                  {displayAnswer}
                </p>
              )}

              {showMapLink ? (
                <div className="mt-5 space-y-3 rounded-2xl border border-kado-dark/8 bg-kado-offwhite p-4">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-kado-red" aria-hidden />
                    <div className="min-w-0 text-xs leading-relaxed text-kado-dark/75 sm:text-sm">
                      <p className="kado-label mb-1.5 text-kado-dark/45">Nearby landmarks</p>
                      <p>Marikina Science School</p>
                      <p className="mt-1">Shell Gas Station along Mayor Gil Fernando Ave.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <a
                      href={kadoMapsSearchUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-kado-red px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-kado-cream transition-colors hover:bg-kado-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2"
                    >
                      Open in Google Maps
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                    <Link
                      to="/branches"
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border-2 border-kado-dark/15 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-kado-dark transition-colors hover:border-kado-red/30 hover:text-kado-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2"
                    >
                      Branch details
                    </Link>
                  </div>
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
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const items = copy.items.filter((item) => cmsTextPlain(item.question).trim());

  const toggle = (i: number) => setOpenIdx((prev) => (prev === i ? null : i));

  return (
    <section
      id="landing-faq"
      aria-labelledby="faq-section-title"
      className="landing-section relative w-full overflow-hidden bg-kado-red text-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        aria-hidden
        className="kado-kanji-watermark -right-6 top-4 text-[clamp(8rem,24vw,16rem)] text-white/[0.07] sm:right-0"
      >
        角
      </div>

      <div className="relative mx-auto max-w-[1400px]">
        <header className="mx-auto mb-8 max-w-2xl text-center md:mb-10 lg:mb-12">
          <CmsStyledText
            value={copy.eyebrow}
            as="p"
            className="kado-label text-kado-cream/90"
            {...cmsTextProps(cmsEditMode, 'faq.eyebrow', 'FAQ eyebrow', (v) => updateFaq({ eyebrow: v }))}
          />
          <div id="faq-section-title">
            <CmsStyledText
              value={copy.title}
              as="h2"
              className="mt-2 kado-h2 text-white"
              {...cmsTextProps(cmsEditMode, 'faq.title', 'FAQ title', (v) => updateFaq({ title: v }))}
            />
          </div>
          {cmsTextPlain(copy.subtitle).trim() ? (
            <CmsStyledText
              value={copy.subtitle}
              as="p"
              className="mx-auto mt-3 max-w-lg kado-body text-white/70 md:mt-4"
              {...cmsTextProps(cmsEditMode, 'faq.subtitle', 'FAQ subtitle', (v) => updateFaq({ subtitle: v }))}
            />
          ) : null}
        </header>

        {/* Single cream shell — matches nav capsule / mobile drawer pattern */}
        <div className="mx-auto max-w-3xl lg:max-w-4xl">
          <div className="rounded-2xl bg-kado-cream p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)] sm:rounded-[2rem] sm:p-5 md:p-6">
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
                  isLast={i === items.length - 1}
                />
              </div>
            ))}
          </div>
        </div>

        <footer className="mx-auto mt-10 max-w-xl text-center md:mt-12 lg:mt-14">
          <CmsStyledText
            value={copy.footerText}
            as="p"
            className="kado-label text-white/80"
            {...cmsTextProps(cmsEditMode, 'faq.footerText', 'FAQ footer', (v) => updateFaq({ footerText: v }))}
          />
          <div className="mt-5 flex flex-col items-center gap-3">
            <a
              href={SEO_SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] w-full max-w-sm items-center justify-center gap-2 rounded-full bg-kado-cream px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-kado-dark transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-kado-red sm:w-auto"
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
              className="inline-flex min-h-[44px] items-center text-xs font-semibold text-white/70 underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              Or message us on the contact page →
            </Link>
          </div>
        </footer>
      </div>
    </section>
  );
}
