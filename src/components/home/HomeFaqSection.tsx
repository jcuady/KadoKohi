import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';
import type { FaqCopy } from '../../store/landingContentStore';
import { useLandingContentStore } from '../../store/landingContentStore';
import CmsStyledText from '../cms/CmsStyledText';
import { cmsTextPlain } from '../../lib/cmsTypography';
import { cmsTextProps } from '../../lib/cmsFieldBind';

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
}: {
  question: FaqCopy['items'][number]['question'];
  answer: FaqCopy['items'][number]['answer'];
  isOpen: boolean;
  onToggle: () => void;
  cmsEditMode?: boolean;
  index: number;
}) {
  const updateFaqItem = useLandingContentStore((s) => s.updateFaqItem);

  return (
    <div className="border-b border-kado-dark/10 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-6 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red focus-visible:ring-offset-2 rounded-sm"
        aria-expanded={isOpen}
      >
        <CmsStyledText
          value={question}
          as="span"
          className="font-display text-base font-bold leading-snug text-kado-dark transition-colors group-hover:text-kado-red md:text-lg"
          {...cmsTextProps(cmsEditMode, `faq.item.${index}.question`, `Question ${index + 1}`, (v) =>
            updateFaqItem(index, { question: v }),
          )}
        />
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-kado-dark/15 text-kado-dark/50 transition-all group-hover:border-kado-red group-hover:text-kado-red">
          {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </span>
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
            <CmsStyledText
              value={answer}
              as="p"
              className="max-w-2xl pb-5 text-sm leading-relaxed text-kado-dark/65 md:text-base"
              {...cmsTextProps(cmsEditMode, `faq.item.${index}.answer`, `Answer ${index + 1}`, (v) =>
                updateFaqItem(index, { answer: v }),
              )}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function HomeFaqSection({ copy, cmsEditMode }: Props) {
  const updateFaq = useLandingContentStore((s) => s.updateFaq);
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const items = copy.items.filter((item) => cmsTextPlain(item.question).trim());

  const toggle = (i: number) => setOpenIdx((prev) => (prev === i ? null : i));
  const half = Math.ceil(items.length / 2);

  return (
    <section id="landing-faq" className="w-full border-t border-kado-dark/8 bg-kado-offwhite py-20 px-6 md:px-12 lg:px-24">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <CmsStyledText
              value={copy.eyebrow}
              as="span"
              className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-kado-red"
              {...cmsTextProps(cmsEditMode, 'faq.eyebrow', 'FAQ eyebrow', (v) => updateFaq({ eyebrow: v }))}
            />
            <CmsStyledText
              value={copy.title}
              as="h2"
              className="font-display text-4xl font-bold leading-tight text-kado-dark md:text-5xl lg:text-6xl"
              {...cmsTextProps(cmsEditMode, 'faq.title', 'FAQ title', (v) => updateFaq({ title: v }))}
            />
          </div>
          <CmsStyledText
            value={copy.subtitle}
            as="p"
            className="hidden max-w-xs text-sm leading-relaxed text-kado-dark/50 md:block md:text-base"
            {...cmsTextProps(cmsEditMode, 'faq.subtitle', 'FAQ subtitle', (v) => updateFaq({ subtitle: v }))}
          />
        </div>

        <div className="grid gap-x-16 md:grid-cols-2">
          <div>
            {items.slice(0, half).map((item, i) => (
              <div key={`faq-${i}-${cmsTextPlain(item.question).slice(0, 24)}`}>
                <FaqItem
                  question={item.question}
                  answer={item.answer}
                  isOpen={openIdx === i}
                  onToggle={() => toggle(i)}
                  cmsEditMode={cmsEditMode}
                  index={i}
                />
              </div>
            ))}
          </div>
          <div>
            {items.slice(half).map((item, i) => {
              const idx = half + i;
              return (
                <div key={`faq-${idx}-${cmsTextPlain(item.question).slice(0, 24)}`}>
                  <FaqItem
                    question={item.question}
                    answer={item.answer}
                    isOpen={openIdx === idx}
                    onToggle={() => toggle(idx)}
                    cmsEditMode={cmsEditMode}
                    index={idx}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-kado-dark/10 pt-10 sm:flex-row sm:items-center">
          <CmsStyledText
            value={copy.footerText}
            as="p"
            className="text-sm text-kado-dark/55"
            {...cmsTextProps(cmsEditMode, 'faq.footerText', 'FAQ footer', (v) => updateFaq({ footerText: v }))}
          />
          <Link
            to="/contact"
            className="rounded-full border border-kado-dark/20 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-kado-dark transition-colors hover:border-kado-red hover:text-kado-red"
          >
            <CmsStyledText
              value={copy.contactCtaLabel}
              as="span"
              {...cmsTextProps(cmsEditMode, 'faq.contactCtaLabel', 'Contact CTA', (v) =>
                updateFaq({ contactCtaLabel: v }),
              )}
            />{' '}
            →
          </Link>
        </div>
      </div>
    </section>
  );
}
