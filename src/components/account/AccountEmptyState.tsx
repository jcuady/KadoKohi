import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
};

export default function AccountEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
}: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-kado-dark/12 bg-white px-5 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-kado-cream/80 text-kado-red">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <p className="font-display text-lg font-bold text-kado-dark">{title}</p>
      <p className="mt-1.5 text-sm text-kado-dark/50 leading-relaxed max-w-xs mx-auto">{description}</p>
      {actionLabel && actionTo ? (
        <Link
          to={actionTo}
          className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-full bg-kado-red px-6 text-[11px] font-black uppercase tracking-wider text-kado-cream hover:bg-kado-dark transition-colors touch-manipulation"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
