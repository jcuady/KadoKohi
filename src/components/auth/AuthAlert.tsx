import type { ReactNode } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

type AuthAlertProps = {
  variant: 'error' | 'success';
  tone?: 'customer' | 'internal';
  children: ReactNode;
};

export default function AuthAlert({ variant, tone = 'customer', children }: AuthAlertProps) {
  const isError = variant === 'error';
  const isInternal = tone === 'internal';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-xl px-4 py-3 mb-4 text-xs font-medium',
        isError
          ? isInternal
            ? 'bg-red-950/40 border border-red-500/30 text-red-200'
            : 'bg-red-50 border border-red-200 text-red-700'
          : isInternal
            ? 'bg-emerald-950/30 border border-emerald-500/25 text-emerald-100'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-800',
      )}
    >
      {isError ? (
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      ) : (
        <Check className="w-4 h-4 shrink-0 mt-0.5" />
      )}
      <span>{children}</span>
    </div>
  );
}
