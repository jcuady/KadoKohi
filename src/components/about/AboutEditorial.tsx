import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { HorizontalMarquee } from '@/components/ui/marquee';
import { ABOUT_EDITORIAL } from '@/content/aboutPage';

export type EditorialPart = { readonly text: string; readonly accent?: boolean };
export type EditorialLine = readonly EditorialPart[];

/** Vertical grid lines — editorial layout shell (Hatton-style, Kado tokens). */
export function AboutEditorialGrid({
  children,
  className,
  dark = false,
}: {
  children?: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        'about-editorial-grid relative',
        dark ? 'about-editorial-grid-dark' : 'about-editorial-grid-light',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Massive stacked display headline with brand accent spans. */
export function EditorialHeadline({
  lines,
  parts,
  as: Tag = 'h2',
  dark = false,
  className,
  size = 'display',
}: {
  lines?: readonly EditorialLine[];
  parts?: readonly EditorialPart[];
  as?: 'h1' | 'h2' | 'h3' | 'p';
  dark?: boolean;
  className?: string;
  size?: 'display' | 'section' | 'sidebar' | 'inline';
}) {
  const sizeClass =
    size === 'display'
      ? 'about-editorial-headline-display'
      : size === 'section'
        ? 'about-editorial-headline-section'
        : size === 'sidebar'
          ? 'about-editorial-headline-sidebar'
          : 'about-editorial-headline-inline';

  const renderParts = (row: readonly EditorialPart[]) =>
    row.map((part, i) => (
      <span
        key={`${part.text}-${i}`}
        className={cn(part.accent && (dark ? 'text-kado-red' : 'text-kado-red'))}
      >
        {part.text}
      </span>
    ));

  if (parts) {
    return (
      <Tag
        className={cn(
          'about-editorial-headline max-w-full',
          size === 'display' ? '' : 'break-words',
          sizeClass,
          dark ? 'text-kado-cream' : 'text-kado-dark',
          className,
        )}
      >
        {renderParts(parts)}
      </Tag>
    );
  }

  return (
    <Tag
      className={cn(
        'about-editorial-headline max-w-full',
        size === 'display' ? '' : 'break-words',
        sizeClass,
        dark ? 'text-kado-cream' : 'text-kado-dark',
        className,
      )}
    >
      {lines?.map((line, i) => (
        <span key={i} className={size === 'display' ? 'about-editorial-line' : 'block'}>
          {renderParts(line)}
        </span>
      ))}
    </Tag>
  );
}

/** Two-column editorial body (specialty café about pages). */
export function EditorialColumns({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-6 text-kado-dark/75 md:grid-cols-2 md:gap-10 lg:gap-14',
        'kado-body-sm md:kado-body leading-relaxed',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Scrolling brand marquee band. */
export function AboutMarqueeBand({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className="border-y border-kado-dark/10 bg-kado-red py-3 sm:py-4" aria-hidden>
      <HorizontalMarquee speed={32} reverse={reverse} className="select-none">
        {ABOUT_EDITORIAL.marqueeWords.map((word) => (
          <span
            key={word}
            className="mx-6 flex shrink-0 items-center gap-6 font-display text-[clamp(1.75rem,6vw,3.5rem)] font-extrabold uppercase tracking-tight text-kado-cream sm:mx-10"
          >
            {word}
            <span className="text-kado-cream/35">•</span>
          </span>
        ))}
      </HorizontalMarquee>
    </div>
  );
}

export function EditorialCtaLink({
  to,
  label,
  dark = false,
}: {
  to: string;
  label: string;
  dark?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'kado-label inline-flex min-h-[44px] items-center border px-6 py-3 transition-colors',
        dark
          ? 'border-kado-cream/30 text-kado-cream hover:bg-kado-cream hover:text-kado-dark'
          : 'border-kado-dark/20 text-kado-dark hover:bg-kado-dark hover:text-kado-cream',
      )}
    >
      {label}
    </Link>
  );
}
