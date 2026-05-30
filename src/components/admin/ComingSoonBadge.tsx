import { Clock } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
  className?: string;
}

/** Compact coming-soon callout for admin / internal surfaces. */
export default function ComingSoonBadge({
  title = 'Coming soon',
  description = 'This feature is in development and will be enabled in a future release.',
  className = '',
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-kado-red/25 bg-kado-red/5 px-5 py-6 text-center ${className}`}
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-kado-red/10 mb-3">
        <Clock className="w-5 h-5 text-kado-red" />
      </div>
      <p className="font-display font-bold text-lg dash-heading">{title}</p>
      <p className="text-xs dash-muted mt-2 max-w-sm mx-auto leading-relaxed">{description}</p>
    </div>
  );
}
