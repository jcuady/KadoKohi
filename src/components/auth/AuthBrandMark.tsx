import { LOGO } from '../../lib/brandTokens';
import { cn } from '../../lib/utils';

type AuthBrandMarkProps = {
  variant?: 'customer' | 'internal';
  subtitle?: string;
  /** Cream text on dark panels (mobile hero, desktop aside). */
  onDark?: boolean;
};

export default function AuthBrandMark({ variant = 'customer', subtitle, onDark = false }: AuthBrandMarkProps) {
  const isInternal = variant === 'internal';
  const lightOnDark = onDark || isInternal;

  return (
    <div className="text-left">
      <div className={cn('inline-flex items-center gap-2.5', isInternal ? 'mb-5' : 'mb-0')}>
        <img
          src={LOGO.hybridMark}
          alt=""
          decoding="async"
          className={cn(
            'h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11',
            lightOnDark && 'brightness-0 invert',
          )}
          aria-hidden
        />
        <div className="text-left">
          <p
            className={cn(
              'font-display text-base font-bold leading-tight tracking-tight sm:text-lg',
              lightOnDark ? 'text-kado-cream' : 'text-kado-dark',
            )}
          >
            Kado Kohi
          </p>
          {isInternal && (
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-kado-red">
              Operations
            </p>
          )}
        </div>
      </div>
      {subtitle && (
        <p
          className={cn(
            'mt-3 text-sm leading-relaxed',
            lightOnDark ? 'text-kado-cream/65' : 'text-kado-dark/60',
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
