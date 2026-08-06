import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { KUKIDO_BLUE, KUKIDO_BLUE_DEEP } from '../../lib/kukido';

type Accent = 'brand' | 'kukido';

type Props = {
  /** Vertical ribbon / mobile watermark (e.g. MENU, KUKIDO). */
  ribbon: string;
  eyebrow: string;
  title: string;
  subhead: string;
  children: ReactNode;
  className?: string;
  /** Extra classes on the content column (after ribbon offset). */
  contentClassName?: string;
  /** brand = Kado red; kukido = collab royal blue. */
  accent?: Accent;
};

/**
 * Shared chrome for customer catalog pages (/menu, /pastries).
 * Desktop: fixed accent ribbon + cream header. Mobile: accent hero block.
 */
export default function CatalogPageFrame({
  ribbon,
  eyebrow,
  title,
  subhead,
  children,
  className,
  contentClassName,
  accent = 'brand',
}: Props) {
  const isKukido = accent === 'kukido';
  const ribbonBg = isKukido ? KUKIDO_BLUE : undefined;
  const ribbonShadow = isKukido
    ? 'shadow-[10px_0_30px_rgba(27,79,204,0.22)]'
    : 'shadow-[10px_0_30px_rgba(158,24,29,0.15)]';

  return (
    <div
      className={cn('customer-menu-page relative w-full font-sans', className)}
      data-catalog-accent={accent}
      style={
        isKukido
          ? ({
              ['--catalog-accent' as string]: KUKIDO_BLUE,
              ['--catalog-accent-deep' as string]: KUKIDO_BLUE_DEEP,
            } as CSSProperties)
          : undefined
      }
    >
      <div
        className={cn(
          'catalog-side-ribbon pointer-events-none fixed bottom-0 left-0 top-[var(--public-nav-height,4rem)] z-[30] hidden w-28 overflow-hidden md:block lg:w-36',
          ribbonShadow,
          !isKukido && 'bg-kado-red',
        )}
        style={isKukido ? { backgroundColor: ribbonBg } : undefined}
        aria-hidden
      >
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <p className="catalog-side-ribbon-label -rotate-90 opacity-95">{ribbon}</p>
        </div>
      </div>

      <div className={cn('flex min-w-0 flex-col overflow-x-clip md:pl-28 lg:pl-36', contentClassName)}>
        <header
          className={cn(
            'relative overflow-hidden px-4 pb-7 pt-8 shadow-md sm:px-6 sm:pb-8 sm:pt-10 md:hidden [@media(orientation:landscape)_and_(max-height:30rem)]:px-4 [@media(orientation:landscape)_and_(max-height:30rem)]:pb-4 [@media(orientation:landscape)_and_(max-height:30rem)]:pt-5',
            !isKukido && 'bg-kado-red',
          )}
          style={isKukido ? { backgroundColor: KUKIDO_BLUE } : undefined}
        >
          <div className="pointer-events-none absolute right-0 top-0 opacity-10" aria-hidden>
            <p className="-mt-2 select-none font-display text-[clamp(3.5rem,22vw,6rem)] font-black leading-none tracking-tighter text-white">
              {ribbon}
            </p>
          </div>
          <p className="relative z-10 mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
            {eyebrow}
          </p>
          <h1 className="relative z-10 mb-2 font-display text-[clamp(1.75rem,8vw,3rem)] font-black uppercase tracking-tighter text-white sm:text-5xl">
            {title}
          </h1>
          <p className="relative z-10 max-w-sm text-sm leading-relaxed text-white/80">{subhead}</p>
        </header>

        <section className="hidden px-8 pb-6 pt-10 md:block lg:px-16">
          <div className="mx-auto max-w-6xl">
            <p
              className={cn(
                'mb-3 text-[10px] font-bold uppercase tracking-[0.22em]',
                !isKukido && 'text-kado-red',
              )}
              style={isKukido ? { color: KUKIDO_BLUE } : undefined}
            >
              {eyebrow}
            </p>
            <h1 className="mb-3 font-display text-4xl font-black uppercase tracking-tighter text-kado-dark lg:text-5xl">
              {title}
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-kado-dark/60">{subhead}</p>
          </div>
        </section>

        {children}
      </div>
    </div>
  );
}
