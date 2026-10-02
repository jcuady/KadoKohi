import { useEffect, useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import {
  TICKET_STATUS_BADGE,
  TICKET_STATUS_LABELS,
  ticketsRepo,
  type SupportTicket,
} from '../../lib/supabase/repositories/tickets';

export function TicketStatusBadge({ status }: { status: SupportTicket['status'] }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TICKET_STATUS_BADGE[status]}`}
    >
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}

/** Signed-URL screenshot; shows why it is missing once the ticket is resolved/closed. */
export function TicketScreenshot({ ticket }: { ticket: SupportTicket }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (!ticket.imagePath) return;
    setLoading(true);
    void ticketsRepo.imageUrl(ticket.imagePath).then((u) => {
      if (!alive) return;
      setUrl(u);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [ticket.imagePath]);

  if (!ticket.imagePath) {
    if (ticket.status !== 'resolved' && ticket.status !== 'closed') return null;
    return (
      <p className="flex items-center gap-2 text-xs dash-muted">
        <ImageOff className="h-4 w-4 shrink-0" aria-hidden />
        Any screenshot was deleted when this ticket was {ticket.status}.
      </p>
    );
  }
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border dash-border dash-card-alt">
        <Loader2 className="h-5 w-5 animate-spin dash-muted" aria-label="Loading screenshot" />
      </div>
    );
  }
  if (!url) {
    return <p className="text-xs dash-muted">Screenshot unavailable.</p>;
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border dash-border">
      <img src={url} alt={`Screenshot for “${ticket.title}”`} className="max-h-80 w-full bg-black/5 object-contain" />
    </a>
  );
}
