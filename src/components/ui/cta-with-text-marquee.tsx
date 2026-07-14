import { cn } from '@/lib/utils';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import { sendInboundEmail } from '../../lib/sendInboundEmail';
import { HorizontalMarquee } from './marquee';
import type { BrandMarqueeItem, KadoCircleCopy } from '../../store/landingContentStore';
import CmsStyledText from '../cms/CmsStyledText';
import CmsEditableImage from '../cms/CmsEditableImage';
import { cmsTextPlain } from '../../lib/cmsTypography';
import { cmsTextProps } from '../../lib/cmsFieldBind';
import { useLandingContentStore } from '../../store/landingContentStore';

/** Partners & collaborators — default strip when CMS copy is absent. */
export const KADO_CIRCLE_SPONSORS: BrandMarqueeItem[] = [
  { label: 'Kado Kohi', imageUrl: '/logo/Logo1-sm.png' },
  { label: 'Anytime Fitness', imageUrl: '' },
  { label: 'foodpanda', imageUrl: '' },
  { label: 'GrabFood', imageUrl: '' },
  { label: 'Pick.A.Roo', imageUrl: '' },
  { label: 'Oatside', imageUrl: '' },
  { label: 'Lalamove', imageUrl: '' },
  { label: 'Emborg', imageUrl: '' },
];

type KadoCircleCTAProps = {
  className?: string;
  /** When provided (e.g. from landing content store), overrides default copy and sponsor list. */
  copy?: KadoCircleCopy;
  cmsEditMode?: boolean;
};

/**
 * “Join the Kado Circle” — dark panel, email capture, horizontal sponsor marquee, stats.
 * Brand: `kado-dark`, `kado-red`, `kado-cream` / white text (see `index.css` @theme).
 */
export default function KadoCircleCTA({ className, copy, cmsEditMode }: KadoCircleCTAProps) {
  const updateKadoCircle = useLandingContentStore((s) => s.updateKadoCircle);
  const updateKadoCircleSponsor = useLandingContentStore((s) => s.updateKadoCircleSponsor);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [statusDetail, setStatusDetail] = useState('');
  const marqueeRef = useRef<HTMLDivElement>(null);

  const sponsors = copy?.sponsors?.length ? copy.sponsors : KADO_CIRCLE_SPONSORS;
  const visibleSponsors = sponsors.filter((s) => cmsTextPlain(s.label).trim() || s.imageUrl?.trim());

  useEffect(() => {
    const root = marqueeRef.current;
    if (!root) return;

    let raf = 0;
    let stopped = false;

    const updateOpacity = () => {
      const items = root.querySelectorAll('.marquee-item-horizontal');
      const containerRect = root.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;

      items.forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenterX = itemRect.left + itemRect.width / 2;
        const distance = Math.abs(centerX - itemCenterX);
        const maxDistance = containerRect.width / 2;
        const normalizedDistance = Math.min(distance / maxDistance, 1);
        const opacity = 1 - normalizedDistance * 0.75;
        (item as HTMLElement).style.opacity = opacity.toString();
      });
    };

    const loop = () => {
      if (stopped) return;
      updateOpacity();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, []);

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
      className={cn(
        'landing-section relative w-full min-w-0 overflow-hidden bg-kado-dark border-t border-white/5',
        className,
      )}
    >
      <div className="pointer-events-none absolute right-0 top-1/2 w-[min(50vw,28rem)] aspect-square bg-kado-red/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
      <div
        aria-hidden
        className="kado-kanji-watermark -left-8 bottom-0 text-[clamp(10rem,30vw,22rem)] text-white/[0.04] sm:-left-4"
      >
        角
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 lg:items-end animate-fade-in-up">
          {/* Copy */}
          <div className="max-w-xl">
            <p className="kado-label mb-5 flex items-center gap-2 text-kado-red">
              <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden />
              <CmsStyledText
                value={copy?.badge ?? 'The Inner Circle'}
                as="span"
                {...cmsTextProps(cmsEditMode, 'kado-circle.badge', 'Badge', (v) => updateKadoCircle({ badge: v }))}
              />
            </p>
            <h2 className="kado-h1 mb-4 sm:mb-5 text-white">
              <CmsStyledText
                value={copy?.titleBefore ?? 'Join the'}
                as="span"
                {...cmsTextProps(cmsEditMode, 'kado-circle.titleBefore', 'Title before accent', (v) =>
                  updateKadoCircle({ titleBefore: v }),
                )}
              />{' '}
              <CmsStyledText
                value={copy?.titleAccent ?? 'Kado Circle.'}
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
                'Curated invites to private events, secret menu drops, and your trackable loyalty stamp card. Become a local.'
              }
              as="p"
              className="md:text-base"
              defaultSizeClass="kado-body"
              defaultColorClass="text-white/55"
              {...cmsTextProps(cmsEditMode, 'kado-circle.body', 'Body', (v) => updateKadoCircle({ body: v }))}
            />
          </div>

          {/* Email → signup */}
          <div className="w-full lg:max-w-md shrink-0 justify-self-end">
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <label htmlFor="kado-circle-email" className="sr-only">
                Email address
              </label>
              <input
                id="kado-circle-email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={copy?.emailPlaceholder ?? 'Enter your email address'}
                className="w-full min-h-[48px] bg-white/[0.07] border border-white/12 text-white placeholder:text-white/35 px-4 sm:px-5 py-3 rounded-xl sm:rounded-2xl focus:outline-none focus:border-kado-red/70 focus:bg-white/[0.09] transition-all text-base sm:text-sm"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[52px] bg-kado-red text-kado-cream font-bold uppercase tracking-[0.12em] text-xs px-6 py-3.5 rounded-xl sm:rounded-2xl shadow-lg shadow-kado-red/25 hover:bg-kado-red-hover hover:shadow-xl hover:shadow-kado-red/35 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 active:opacity-95 disabled:opacity-60"
              >
                {submitting ? 'Sending…' : (
                  <CmsStyledText
                    value={copy?.submitLabel ?? 'Request access'}
                    as="span"
                    {...cmsTextProps(cmsEditMode, 'kado-circle.submitLabel', 'Submit button', (v) =>
                      updateKadoCircle({ submitLabel: v }),
                    )}
                  />
                )}{' '}
                {!submitting ? <ArrowRight className="w-4 h-4" aria-hidden /> : null}
              </button>
            </form>
            {status === 'sent' ? (
              <p className="text-kado-cream/80 text-xs mt-3 text-center lg:text-left font-medium">
                Thanks — your request was sent. Our team will follow up by email, or you can{' '}
                <Link to="/auth/signup" className="text-kado-red hover:underline">
                  create an account
                </Link>{' '}
                now.
              </p>
            ) : status === 'error' ? (
              <p className="text-red-300 text-xs mt-3 text-center lg:text-left">{statusDetail}</p>
            ) : statusDetail ? (
              <p className="text-white/45 text-xs mt-3 text-center lg:text-left">{statusDetail}</p>
            ) : (
              <p className="text-white/35 text-xs mt-3 text-center lg:text-left">
                <CmsStyledText
                  value={copy?.disclaimer ?? 'No spam. Unsubscribe any time.'}
                  as="span"
                  {...cmsTextProps(cmsEditMode, 'kado-circle.disclaimer', 'Disclaimer', (v) =>
                    updateKadoCircle({ disclaimer: v }),
                  )}
                />
              </p>
            )}
          </div>
        </div>

        {/* Sponsor marquee */}
        <div className="mt-14 md:mt-16">
          <CmsStyledText
            value={copy?.marqueeLabel ?? 'Friends of the corner'}
            as="p"
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 text-center"
            defaultColorClass="text-white/35"
            {...cmsTextProps(cmsEditMode, 'kado-circle.marqueeLabel', 'Marquee label', (v) =>
              updateKadoCircle({ marqueeLabel: v }),
            )}
          />
          <div ref={marqueeRef} className="relative w-full py-2">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] py-4 md:py-5">
              <HorizontalMarquee speed={32} pauseOnHover className="w-full">
                {visibleSponsors.map((item, si) => (
                  <div
                    key={`${cmsTextPlain(item.label)}-${item.imageUrl ?? 'text'}`}
                    className="marquee-item-horizontal flex items-center justify-center px-6 sm:px-10 md:px-14 whitespace-nowrap min-h-[3rem] md:min-h-[4rem]"
                  >
                    {item.imageUrl?.trim() ? (
                      cmsEditMode ? (
                        <CmsEditableImage
                          cmsField={`kado-circle.sponsor.${si}.image`}
                          cmsLabel={`Sponsor ${si + 1} logo`}
                          src={item.imageUrl}
                          alt={cmsTextPlain(item.label)}
                          className="h-8 sm:h-10 md:h-12 w-auto max-w-[140px] md:max-w-[180px] object-contain opacity-90"
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
                          width={140}
                          height={48}
                          loading="lazy"
                          decoding="async"
                          className="h-8 sm:h-10 md:h-12 w-auto max-w-[140px] md:max-w-[180px] object-contain opacity-90"
                        />
                      )
                    ) : (
                      <CmsStyledText
                        value={item.label}
                        as="span"
                        className="font-display text-lg sm:text-2xl md:text-3xl lg:text-4xl font-medium tracking-tight"
                        defaultColorClass="text-white/90"
                        {...cmsTextProps(cmsEditMode, `kado-circle.sponsor.${si}.label`, `Sponsor ${si + 1}`, (v) =>
                          updateKadoCircleSponsor(si, { label: v }),
                        )}
                      />
                    )}
                  </div>
                ))}
              </HorizontalMarquee>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-20 md:w-32 bg-gradient-to-r from-kado-dark via-kado-dark/80 to-transparent z-10" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-20 md:w-32 bg-gradient-to-l from-kado-dark via-kado-dark/80 to-transparent z-10" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-10 sm:mt-12 md:mt-14 pt-8 sm:pt-10 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-8 sm:gap-8">
          {(copy?.stats?.length ? copy.stats : [
            { num: '2+', label: 'Branches' },
            { num: '50+', label: 'Menu items' },
            { num: '9', label: 'Stamp loyalty' },
            { num: '∞', label: 'Good vibes' },
          ]).map(({ num, label }, statIdx) => (
            <div key={cmsTextPlain(label)}>
              <CmsStyledText
                value={num}
                as="p"
                className="kado-h3 mb-1"
                defaultColorClass="text-white"
                {...cmsTextProps(cmsEditMode, `kado-circle.stat.${statIdx}.num`, `Stat ${statIdx + 1} number`, (v) => {
                  const stats = [...(copy?.stats?.length ? copy.stats : [
                    { num: '2+', label: 'Branches' },
                    { num: '50+', label: 'Menu items' },
                    { num: '9', label: 'Stamp loyalty' },
                    { num: '∞', label: 'Good vibes' },
                  ])];
                  stats[statIdx] = { ...stats[statIdx], num: v };
                  updateKadoCircle({ stats });
                })}
              />
              <CmsStyledText
                value={label}
                as="p"
                className="text-xs uppercase tracking-widest font-bold"
                defaultColorClass="text-white/40"
                {...cmsTextProps(cmsEditMode, `kado-circle.stat.${statIdx}.label`, `Stat ${statIdx + 1} label`, (v) => {
                  const stats = [...(copy?.stats?.length ? copy.stats : [
                    { num: '2+', label: 'Branches' },
                    { num: '50+', label: 'Menu items' },
                    { num: '9', label: 'Stamp loyalty' },
                    { num: '∞', label: 'Good vibes' },
                  ])];
                  stats[statIdx] = { ...stats[statIdx], label: v };
                  updateKadoCircle({ stats });
                })}
              />
            </div>
          ))}
        </div>

        <p className="mt-8 sm:mt-10 text-center">
          <Link
            to="/auth/signup"
            className="inline-flex min-h-[44px] items-center justify-center px-2 text-xs font-bold uppercase tracking-wider text-kado-red/90 hover:text-kado-cream transition-colors"
          >
            <CmsStyledText
              value={copy?.footerLinkLabel ?? 'Or go straight to create account →'}
              as="span"
              {...cmsTextProps(cmsEditMode, 'kado-circle.footerLinkLabel', 'Footer link', (v) =>
                updateKadoCircle({ footerLinkLabel: v }),
              )}
            />
          </Link>
        </p>
      </div>
    </section>
  );
}
