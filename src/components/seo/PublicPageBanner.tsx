import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Props = {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  /** Centered marketing pages (Features, Contact, Branches, Events). */
  align?: 'center' | 'start';
  /** Wider content column (Careers job board). */
  wide?: boolean;
  /** Optional filters, badges, or CTAs under the description. */
  children?: ReactNode;
  className?: string;
  titleId?: string;
};

/**
 * Shared customer-facing page banner — brand cream field, Zalando display H1,
 * M Plus body (BRANDING_SYSTEM_AND_PROJECT_CONTEXT.md §1).
 */
export default function PublicPageBanner({
  eyebrow,
  title,
  description,
  align = 'center',
  wide = false,
  children,
  className,
  titleId,
}: Props) {
  const centered = align === 'center';

  return (
    <section
      className={cn(
        'public-page-banner border-b border-kado-dark/5 bg-kado-cream',
        'px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]',
        'pb-10 pt-[calc(var(--public-nav-height)+1.25rem)] sm:pb-12 sm:pt-[calc(var(--public-nav-height)+1.5rem)]',
        '[@media(orientation:landscape)_and_(max-height:32rem)]:pb-6 [@media(orientation:landscape)_and_(max-height:32rem)]:pt-[calc(var(--public-nav-height)+0.75rem)]',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto w-full min-w-0',
          wide ? 'max-w-6xl' : 'max-w-5xl',
          centered ? 'text-center' : 'text-left',
        )}
      >
        <p className="kado-label mb-2 text-kado-red sm:mb-3">{eyebrow}</p>
        <h1
          id={titleId}
          className={cn(
            'kado-h1 text-balance uppercase tracking-tight text-kado-dark',
            'text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.05]',
            centered ? 'mx-auto max-w-3xl' : 'max-w-3xl',
          )}
        >
          {title}
        </h1>
        {description ? (
          <div
            className={cn(
              'mt-4 kado-body leading-relaxed text-kado-dark/65',
              centered ? 'mx-auto max-w-xl' : 'max-w-2xl',
            )}
          >
            {description}
          </div>
        ) : null}
        {children ? (
          <div className={cn('mt-6 sm:mt-8', centered && 'flex flex-col items-center')}>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
