import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Roman-arch gallery frame — reference layout, Kado cream/red palette. */
export function AboutArchFrame({
  children,
  className,
  aspect = 'portrait',
}: {
  children: ReactNode;
  className?: string;
  aspect?: 'portrait' | 'wide';
}) {
  return (
    <div
      className={cn(
        'about-arch-frame relative bg-kado-cream-deep shadow-[0_24px_60px_rgba(25,25,25,0.14)]',
        aspect === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/5] sm:aspect-[3/4]',
        className,
      )}
    >
      <div className="absolute inset-0">{children}</div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-kado-dark/10"
      />
    </div>
  );
}
