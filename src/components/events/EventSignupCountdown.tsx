import { useCountdown, formatCountdown } from '../../hooks/useCountdown';
import { Clock } from 'lucide-react';
import type { EventSignupPhase } from '../../lib/eventTiming';

interface Props {
  targetIso: string | undefined;
  phase: EventSignupPhase;
  label: string;
}

export default function EventSignupCountdown({ targetIso, phase, label }: Props) {
  const parts = useCountdown(targetIso);
  const active = phase === 'open' || phase === 'not_yet_open';

  if (!targetIso || !active) {
    if (phase === 'closed') {
      return (
        <p className="text-xs font-bold uppercase tracking-wider text-kado-dark/50">Sign-ups closed</p>
      );
    }
    if (phase === 'full') {
      return (
        <p className="text-xs font-bold uppercase tracking-wider text-kado-red">Event is full</p>
      );
    }
    return null;
  }

  const ended = parts.days === 0 && parts.hours === 0 && parts.minutes === 0 && parts.seconds === 0;

  return (
    <div className="rounded-xl border border-kado-red/20 bg-kado-red/5 px-3 py-2.5 flex items-center gap-2">
      <Clock className="w-4 h-4 text-kado-red shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-kado-red">{label}</p>
        <p className="text-sm font-bold text-kado-dark tabular-nums">
          {ended ? 'Closing now…' : formatCountdown(parts)}
        </p>
      </div>
    </div>
  );
}
