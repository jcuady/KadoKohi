import * as React from 'react';
import { cn } from '../../lib/utils';

type Variant = 'default' | 'outline' | 'muted' | 'success' | 'warning' | 'danger';

const VARIANT: Record<Variant, string> = {
  default: 'bg-kado-red/12 text-kado-red border-kado-red/20',
  outline: 'dash-card-alt dash-heading border dash-border',
  muted: 'dash-card-alt dash-muted border dash-border',
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-900 border-amber-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
};

export type BadgeProps = React.ComponentProps<'span'> & {
  variant?: Variant;
};

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest',
        VARIANT[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
