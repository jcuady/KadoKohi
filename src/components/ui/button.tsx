import * as React from 'react';
import { cn } from '../../lib/utils';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
type Size = 'default' | 'sm' | 'icon';

const VARIANT: Record<Variant, string> = {
  default: 'bg-kado-red text-kado-cream hover:bg-kado-dark shadow-sm',
  outline: 'border dash-border dash-card-alt dash-heading hover:border-kado-red/40 hover:text-kado-red',
  ghost: 'dash-muted hover:dash-card-alt hover:dash-heading',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  secondary: 'dash-card-alt dash-heading border dash-border hover:border-kado-red/30',
};

const SIZE: Record<Size, string> = {
  default: 'h-10 px-4 py-2 text-xs font-bold uppercase tracking-wider',
  sm: 'h-8 px-3 text-[10px] font-bold uppercase tracking-wider',
  icon: 'h-9 w-9',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red/30 disabled:pointer-events-none disabled:opacity-50',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export { Button };
