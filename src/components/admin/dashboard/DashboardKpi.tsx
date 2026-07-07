import type { LucideIcon } from 'lucide-react';
import { Card } from '../../ui/card';
import { cn } from '../../../lib/utils';

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  highlight?: boolean;
  alert?: boolean;
};

export default function DashboardKpi({ label, value, hint, icon: Icon, highlight, alert }: Props) {
  return (
    <Card
      className={cn(
        'p-3 md:p-4',
        highlight && 'border-kado-red/20 bg-kado-red/[0.03]',
        alert && 'border-amber-200/70 dark:border-amber-900/50',
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className={cn('h-3.5 w-3.5 shrink-0', alert ? 'text-amber-600' : 'text-kado-red')} />
        <span className="text-[9px] font-bold uppercase tracking-widest dash-muted">{label}</span>
      </div>
      <p
        className={cn(
          'font-display text-xl font-bold tabular-nums md:text-2xl',
          highlight ? 'text-kado-red' : 'dash-heading',
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[10px] leading-snug dash-muted">{hint}</p> : null}
    </Card>
  );
}
