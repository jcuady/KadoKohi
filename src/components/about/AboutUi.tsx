import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** HeroUI-inspired surface primitives — brand tokens, no extra UI library. */

export function AboutChip({
  children,
  className,
  variant = 'cream',
}: {
  children: ReactNode;
  className?: string;
  variant?: 'cream' | 'red' | 'ghost';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2 kado-label backdrop-blur-md',
        variant === 'cream' && 'border border-kado-cream/35 bg-kado-cream/15 text-kado-cream',
        variant === 'red' && 'border border-kado-red/20 bg-kado-red/10 text-kado-red',
        variant === 'ghost' && 'border border-kado-dark/10 bg-white/60 text-kado-dark/80',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AboutCard({
  children,
  className,
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-kado-dark/8 bg-white/80 p-6 shadow-[0_8px_30px_rgba(25,25,25,0.06)] backdrop-blur-sm',
        hover && 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(25,25,25,0.1)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AboutSectionHeader({
  eyebrow,
  title,
  intro,
  align = 'center',
  dark = false,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  align?: 'left' | 'center';
  dark?: boolean;
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      <p className={cn('kado-label mb-3', dark ? 'text-kado-cream/75' : 'text-kado-red')}>{eyebrow}</p>
      <h2 className={cn('kado-h2 mb-4', dark ? 'text-kado-cream' : 'text-kado-dark')}>{title}</h2>
      {intro ? (
        <p className={cn('kado-body', dark ? 'text-kado-cream/75' : 'text-kado-dark/70')}>{intro}</p>
      ) : null}
    </div>
  );
}

export function AboutKanjiWatermark({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute font-display font-black leading-none text-white/[0.06] select-none',
        className,
      )}
    >
      角
    </div>
  );
}

/** Consistent safe-area padding for all About sections. */
export const AboutSectionShell = forwardRef<
  HTMLElement,
  {
    children: ReactNode;
    className?: string;
    innerClassName?: string;
    id?: string;
  }
>(function AboutSectionShell({ children, className, innerClassName, id }, ref) {
  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        'border-b border-kado-dark/8 px-[max(1rem,env(safe-area-inset-left))] py-14 sm:px-6 sm:py-16 md:py-24',
        'pr-[max(1rem,env(safe-area-inset-right))]',
        className,
      )}
    >
      <div className={cn('mx-auto w-full min-w-0 max-w-6xl', innerClassName)}>{children}</div>
    </section>
  );
});
