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
        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-kado-red text-kado-cream flex items-center justify-center font-display font-bold text-lg sm:text-xl rounded-sm shadow-lg shadow-kado-red/25">
          角
        </div>
        <div className="text-left">
          <p
            className={cn(
              'font-display font-bold text-base sm:text-lg leading-tight tracking-tight',
              lightOnDark ? 'text-kado-cream' : 'text-kado-dark',
            )}
          >
            Kado Kohi
          </p>
          {isInternal && (
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-kado-red mt-0.5">
              Operations
            </p>
          )}
        </div>
      </div>
      {subtitle && (
        <p
          className={cn(
            'text-sm leading-relaxed mt-3',
            lightOnDark ? 'text-kado-cream/65' : 'text-kado-dark/60',
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
