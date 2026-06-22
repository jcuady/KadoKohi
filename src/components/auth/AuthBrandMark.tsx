import { cn } from '../../lib/utils';

type AuthBrandMarkProps = {
  variant?: 'customer' | 'internal';
  subtitle?: string;
};

export default function AuthBrandMark({ variant = 'customer', subtitle }: AuthBrandMarkProps) {
  const isInternal = variant === 'internal';

  return (
    <div className="text-center lg:text-left">
      <div className={cn('inline-flex items-center gap-2.5', isInternal ? 'mb-5' : 'mb-4')}>
        <div className="w-11 h-11 bg-kado-red text-kado-cream flex items-center justify-center font-display font-bold text-xl rounded-sm shadow-lg shadow-kado-red/20">
          角
        </div>
        <div className="text-left">
          <p
            className={cn(
              'font-display font-bold text-lg leading-tight',
              isInternal ? 'text-kado-cream' : 'text-kado-dark',
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
        <p className={cn('text-sm leading-relaxed', isInternal ? 'text-white/60' : 'text-kado-dark/60')}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
