import { cn } from '@/lib/utils';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { sendInboundEmail } from '../../lib/sendInboundEmail';
import type { BrandMarqueeItem, KadoCircleCopy } from '../../store/landingContentStore';
import CmsStyledText from '../cms/CmsStyledText';
import CmsEditableImage from '../cms/CmsEditableImage';
import { cmsTextPlain } from '../../lib/cmsTypography';
import { cmsTextProps } from '../../lib/cmsFieldBind';
import { useLandingContentStore } from '../../store/landingContentStore';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

/** Partners & collaborators — default strip when CMS copy is absent. */
export const KADO_CIRCLE_SPONSORS: BrandMarqueeItem[] = [
  { label: 'Blitzbar', imageUrl: '' },
  { label: 'Offgrid', imageUrl: '' },
  { label: 'Anik PH', imageUrl: '' },
];

/** What membership unlocks — fixed ritual copy (section signature, not CMS). */
const CIRCLE_RITUALS = [
  { mark: '角', title: 'Corner invites', body: 'Private events before they hit the feed.' },
  { mark: '9', title: 'Stamp card', body: 'Drink stamps unlock when your order completes.' },
  { mark: '一', title: 'First sip', body: 'Secret menu drops land here first.' },
] as const;

const DEFAULT_STATS = [
  { num: '2+', label: 'Branches' },
  { num: '50+', label: 'Menu items' },
  { num: '9', label: 'Stamp loyalty' },
  { num: '∞', label: 'Good vibes' },
] as const;

type KadoCircleCTAProps = {
  className?: string;
  copy?: KadoCircleCopy;
  cmsEditMode?: boolean;
};

/**
 * Kado Circle — landing closer.
 * Signature: cream membership “stamp card” on kado-dark, loyalty dots as brand motif.
 * Tokens: cream #F1DFBA · red #9E181D · dark #191919 · off-white #FAF9F6.
 */
export default function KadoCircleCTA({ className, copy, cmsEditMode }: KadoCircleCTAProps) {
  const updateKadoCircle = useLandingContentStore((s) => s.updateKadoCircle);
  const updateKadoCircleSponsor = useLandingContentStore((s) => s.updateKadoCircleSponsor);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [statusDetail, setStatusDetail] = useState('');

  const sponsors = copy?.sponsors?.length ? copy.sponsors : KADO_CIRCLE_SPONSORS;
  const visibleSponsors = sponsors.filter((s) => cmsTextPlain(s.label).trim() || s.imageUrl?.trim());
  const stats = copy?.stats?.length ? copy.stats : [...DEFAULT_STATS];

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error');
      setStatusDetail('Enter a valid email address to request access.');
      return;
    }

    setSubmitting(true);
    setStatus('idle');
    setStatusDetail('');

    const result = await sendInboundEmail({ kind: 'kado_circle', email: trimmed });
    setSubmitting(false);

    if (result.ok === false) {
      setStatus('error');
      setStatusDetail(result.message);
      return;
    }

    if (result.via === 'mailto') {
      window.location.href = result.mailto;
      setStatus('sent');
      setStatusDetail('Opening your email app to complete the request…');
      setEmail('');
      return;
    }

    setStatus('sent');
    setEmail('');
  };

  return (
    <section
      id="kado-circle"
      aria-labelledby="kado-circle-heading"
      className={cn(
        'landing-section relative w-full min-w-0 overflow-hidden bg-kado-dark',
        className,
      )}
    >
      {/* Brand atmosphere — cream wash + kanji, no purple/glow defaults */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(241,223,186,0.08),transparent_55%),radial-gradient(ellipse_at_10%_90%,rgba(158,24,29,0.18),transparent_45%)]"
      />
      <div
        aria-hidden
        className="kado-kanji-watermark pointer-events-none absolute -right-6 top-8 select-none font-display text-[clamp(8rem,28vw,18rem)] leading-none text-kado-cream/[0.05] sm:right-4 sm:top-4"
      >
        角
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px]">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-20">
          {/* Narrative column */}
          <div className="min-w-0 max-w-xl">
            <p className="kado-label mb-4 inline-flex items-center gap-2 rounded-full border border-kado-red/35 bg-kado-red/10 px-3 py-1.5 text-kado-cream">
              <span aria-hidden className="font-display text-sm font-bold text-kado-red">
                角
              </span>
              <CmsStyledText
                value={copy?.badge ?? 'Kado Circle'}
                as="span"
                {...cmsTextProps(cmsEditMode, 'kado-circle.badge', 'Badge', (v) => updateKadoCircle({ badge: v }))}
              />
            </p>

            <h2 id="kado-circle-heading" className="kado-h1 mb-4 text-kado-offwhite sm:mb-5">
              <CmsStyledText
                value={copy?.titleBefore ?? 'Your seat at the'}
                as="span"
                {...cmsTextProps(cmsEditMode, 'kado-circle.titleBefore', 'Title before accent', (v) =>
                  updateKadoCircle({ titleBefore: v }),
                )}
              />{' '}
              <CmsStyledText
                value={copy?.titleAccent ?? 'corner.'}
                as="span"
                className="text-kado-red not-italic"
                {...cmsTextProps(cmsEditMode, 'kado-circle.titleAccent', 'Title accent', (v) =>
                  updateKadoCircle({ titleAccent: v }),
                )}
              />
            </h2>

            <CmsStyledText
              value={
                copy?.body ??
                'Kado Circle is how locals stay close — event invites, stamp loyalty on completed drinks, and early word on secret menu drops. One email. One corner.'
              }
              as="p"
              className="max-w-md"
              defaultSizeClass="kado-body"
              defaultColorClass="text-kado-cream/75"
              {...cmsTextProps(cmsEditMode, 'kado-circle.body', 'Body', (v) => updateKadoCircle({ body: v }))}
            />

            <ul className="mt-8 space-y-4 border-t border-kado-cream/10 pt-8">
              {CIRCLE_RITUALS.map((ritual) => (
                <li key={ritual.title} className="flex gap-4">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center border border-kado-cream/15 bg-kado-cream/[0.04] font-display text-sm font-bold text-kado-red"
                  >
                    {ritual.mark}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-kado-offwhite">
                      {ritual.title}
                    </p>
                    <p className="mt-1 kado-body-sm text-kado-cream/65">{ritual.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Membership stamp card */}
          <div
            className={cn(
              'relative w-full justify-self-stretch lg:justify-self-end lg:max-w-md',
              !prefersReducedMotion && 'animate-fade-in-up',
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-px rounded-[1.75rem] bg-gradient-to-br from-kado-cream/40 via-transparent to-kado-red/40 opacity-60"
            />
            <div className="relative overflow-hidden rounded-[1.65rem] border-[6px] border-kado-red bg-kado-cream px-5 py-6 shadow-[0_28px_60px_rgba(0,0,0,0.35)] sm:px-7 sm:py-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-3 -top-2 select-none font-display text-[5.5rem] leading-none text-kado-dark/[0.06]"
              >
                角
              </div>

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="kado-label text-kado-red">Member card</p>
                  <p className="mt-1 font-display text-lg font-bold tracking-tight text-kado-dark sm:text-xl">
                    Stamp loyalty
                  </p>
                </div>
                <BrandHybridMini />
              </div>

              {/* 9-stamp row — signature motif */}
              <div
                className="mt-6 grid grid-cols-9 gap-1.5 sm:gap-2"
                role="img"
                aria-label="Nine stamp loyalty slots — three earned toward a free drink"
              >
                {Array.from({ length: 9 }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'aspect-square rounded-full border-2',
                      i < 3
                        ? 'border-kado-red bg-kado-red shadow-[inset_0_0_0_2px_rgba(241,223,186,0.35)]'
                        : 'border-kado-dark/20 bg-kado-offwhite',
                    )}
                  />
                ))}
              </div>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-kado-dark/55">
                3 of 9 · Free drink at nine
              </p>

              <form onSubmit={onSubmit} className="mt-6 space-y-3">
                <label htmlFor="kado-circle-email" className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/70">
                  Email for invites
                </label>
                <input
                  id="kado-circle-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={copy?.emailPlaceholder ?? 'you@email.com'}
                  className="w-full min-h-[48px] rounded-xl border border-kado-dark/15 bg-kado-offwhite px-4 py-3 text-base text-kado-dark placeholder:text-kado-dark/40 transition-colors focus:border-kado-red focus:outline-none focus:ring-2 focus:ring-kado-red/25 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-kado-red px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-kado-cream transition-transform hover:scale-[1.01] hover:bg-kado-red-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    'Sending…'
                  ) : (
                    <>
                      <CmsStyledText
                        value={copy?.submitLabel ?? 'Request access'}
                        as="span"
                        {...cmsTextProps(cmsEditMode, 'kado-circle.submitLabel', 'Submit button', (v) =>
                          updateKadoCircle({ submitLabel: v }),
                        )}
                      />
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </button>
              </form>

              {status === 'sent' ? (
                <p className="mt-3 text-xs font-medium leading-relaxed text-kado-dark/80">
                  Thanks — request sent. We&apos;ll follow up, or{' '}
                  <Link to="/auth/signup" className="font-bold text-kado-red underline-offset-2 hover:underline">
                    create an account
                  </Link>{' '}
                  now.
                </p>
              ) : status === 'error' ? (
                <p className="mt-3 text-xs font-medium text-kado-red" role="alert">
                  {statusDetail}
                </p>
              ) : statusDetail ? (
                <p className="mt-3 text-xs text-kado-dark/70">{statusDetail}</p>
              ) : (
                <p className="mt-3 text-xs text-kado-dark/60">
                  <CmsStyledText
                    value={copy?.disclaimer ?? 'No spam. Leave anytime.'}
                    as="span"
                    {...cmsTextProps(cmsEditMode, 'kado-circle.disclaimer', 'Disclaimer', (v) =>
                      updateKadoCircle({ disclaimer: v }),
                    )}
                  />
                </p>
              )}

              <p className="mt-5 border-t border-kado-dark/10 pt-4 text-center">
                <Link
                  to="/auth/signup"
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-kado-red transition-colors hover:text-kado-dark"
                >
                  <CmsStyledText
                    value={copy?.footerLinkLabel ?? 'Create account instead'}
                    as="span"
                    {...cmsTextProps(cmsEditMode, 'kado-circle.footerLinkLabel', 'Footer link', (v) =>
                      updateKadoCircle({ footerLinkLabel: v }),
                    )}
                  />
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Friends — quiet editorial strip (no boxed marquee) */}
        {visibleSponsors.length > 0 ? (
          <div className="mt-14 border-t border-kado-cream/10 pt-8 md:mt-16 md:pt-10">
            <CmsStyledText
              value={copy?.marqueeLabel ?? 'Friends of the corner'}
              as="p"
              className="mb-5 text-center text-[10px] font-bold uppercase tracking-[0.22em]"
              defaultColorClass="text-kado-cream/55"
              {...cmsTextProps(cmsEditMode, 'kado-circle.marqueeLabel', 'Marquee label', (v) =>
                updateKadoCircle({ marqueeLabel: v }),
              )}
            />
            <ul className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:gap-x-3">
              {visibleSponsors.map((item, si) => (
                <li
                  key={`${cmsTextPlain(item.label)}-${item.imageUrl ?? 'text'}-${si}`}
                  className="flex items-center gap-x-2 sm:gap-x-3"
                >
                  {si > 0 ? (
                    <span aria-hidden className="select-none text-kado-cream/25">
                      ·
                    </span>
                  ) : null}
                  {item.imageUrl?.trim() ? (
                    cmsEditMode ? (
                      <CmsEditableImage
                        cmsField={`kado-circle.sponsor.${si}.image`}
                        cmsLabel={`Sponsor ${si + 1} logo`}
                        src={item.imageUrl}
                        alt={cmsTextPlain(item.label)}
                        className="h-7 w-auto max-w-[120px] object-contain opacity-80 sm:h-8"
                        onImageChange={(url) => updateKadoCircleSponsor(si, { imageUrl: url })}
                      />
                    ) : (
                      <img
                        src={
                          item.imageUrl.includes('Logo1.png')
                            ? '/logo/Logo1-sm.png'
                            : item.imageUrl.includes('Logo2.png')
                              ? '/logo/Logo2-sm.png'
                              : item.imageUrl
                        }
                        alt={cmsTextPlain(item.label)}
                        width={120}
                        height={32}
                        loading="lazy"
                        decoding="async"
                        className="h-7 w-auto max-w-[120px] object-contain opacity-80 sm:h-8"
                      />
                    )
                  ) : (
                    <CmsStyledText
                      value={item.label}
                      as="span"
                      className="font-display text-sm font-medium tracking-tight sm:text-base"
                      defaultColorClass="text-kado-cream/80"
                      {...cmsTextProps(cmsEditMode, `kado-circle.sponsor.${si}.label`, `Sponsor ${si + 1}`, (v) =>
                        updateKadoCircleSponsor(si, { label: v }),
                      )}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Stats — single composition, cream hairline */}
        <div className="mt-10 grid grid-cols-2 gap-6 border-t border-kado-cream/10 pt-8 sm:mt-12 sm:grid-cols-4 sm:gap-4 md:mt-14 md:pt-10">
          {stats.map(({ num, label }, statIdx) => (
            <div key={`${cmsTextPlain(label)}-${statIdx}`} className="min-w-0 text-center sm:text-left">
              <CmsStyledText
                value={num}
                as="p"
                className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
                defaultColorClass="text-kado-offwhite"
                {...cmsTextProps(cmsEditMode, `kado-circle.stat.${statIdx}.num`, `Stat ${statIdx + 1} number`, (v) => {
                  const next = [...stats];
                  next[statIdx] = { ...next[statIdx], num: v };
                  updateKadoCircle({ stats: next });
                })}
              />
              <CmsStyledText
                value={label}
                as="p"
                className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                defaultColorClass="text-kado-cream/60"
                {...cmsTextProps(cmsEditMode, `kado-circle.stat.${statIdx}.label`, `Stat ${statIdx + 1} label`, (v) => {
                  const next = [...stats];
                  next[statIdx] = { ...next[statIdx], label: v };
                  updateKadoCircle({ stats: next });
                })}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandHybridMini() {
  return (
    <div
      aria-hidden
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-kado-red bg-kado-dark font-display text-lg font-bold text-kado-cream"
    >
      角
    </div>
  );
}
