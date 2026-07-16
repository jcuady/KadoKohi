import type { ReactNode } from 'react';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export default function AccountPageHeader({ eyebrow, title, subtitle, action }: Props) {
  return (
    <header className="mb-[var(--account-section-gap,1rem)] flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-kado-red">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-[1.5rem] font-black leading-tight tracking-tight text-kado-dark sm:text-3xl [@media(orientation:landscape)_and_(max-height:480px)]:text-xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm leading-relaxed text-kado-dark/50 max-w-md line-clamp-2 sm:line-clamp-none">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
    </header>
  );
}
