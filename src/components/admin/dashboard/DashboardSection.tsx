import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export default function DashboardSection({ title, description, action, children }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 border-b dash-border pb-2">
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wider dash-heading">{title}</h2>
          {description ? <p className="mt-0.5 text-xs dash-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
