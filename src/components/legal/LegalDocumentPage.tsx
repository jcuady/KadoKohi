import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { LegalSection } from '../../content/customerLegal';
import { LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from '../../content/customerLegal';

type Props = {
  title: string;
  subtitle: string;
  sections: LegalSection[];
  sibling?: { label: string; to: string };
};

export default function LegalDocumentPage({ title, subtitle, sections, sibling }: Props) {
  return (
    <div className="flex flex-col w-full bg-white font-sans min-h-dvh overflow-x-hidden">
      <section className="pt-24 sm:pt-28 pb-8 sm:pb-10 px-4 sm:px-6 border-b border-kado-dark/5 bg-[#FAF7F2]">
        <div className="max-w-3xl mx-auto w-full">
          <Link
            to="/"
            className="inline-flex items-center gap-2 min-h-[44px] text-[10px] font-bold uppercase tracking-[0.18em] text-kado-dark/50 hover:text-kado-red transition-colors mb-2 sm:mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            Back to home
          </Link>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-kado-red mb-2">Legal</p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-kado-dark tracking-tight break-words">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-kado-dark/60 mt-3 leading-relaxed font-medium">{subtitle}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-kado-dark/40 mt-4 break-words">
            Version {LEGAL_VERSION} · Effective {LEGAL_EFFECTIVE_DATE}
          </p>
          {sibling && (
            <p className="text-xs sm:text-sm text-kado-dark/55 mt-3">
              See also{' '}
              <Link
                to={sibling.to}
                className="font-bold text-kado-red hover:underline underline-offset-2 inline-block py-1"
              >
                {sibling.label}
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <article className="px-4 sm:px-6 py-10 sm:py-12 md:py-16 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto w-full space-y-8 sm:space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-base sm:text-lg md:text-xl font-bold text-kado-dark mb-3 break-words">
                {section.title}
              </h2>
              <div className="space-y-3 text-sm sm:text-[15px] text-kado-dark/75 leading-relaxed break-words">
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 48)}>{p}</p>
                ))}
                {section.bullets?.length ? (
                  <ul className="list-disc pl-4 sm:pl-5 space-y-2 marker:text-kado-red">
                    {section.bullets.map((b) => (
                      <li key={b.slice(0, 48)}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}

          <p className="text-xs sm:text-sm text-kado-dark/45 border-t border-kado-dark/10 pt-8 leading-relaxed break-words">
            This document is provided for transparency on kadokohi.com. It does not replace advice from qualified
            legal counsel. For business or legal notices, contact us through the email listed above or our{' '}
            <Link to="/contact" className="text-kado-red font-semibold hover:underline">
              contact page
            </Link>
            .
          </p>
        </div>
      </article>
    </div>
  );
}
