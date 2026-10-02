import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, MessageSquare, PlayCircle, RotateCcw, Trash2, X, XCircle } from 'lucide-react';
import { useBranchStore } from '../../store/branchStore';
import { formatOrderTimestamp } from '../../lib/orderTime';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  isTicketFinal,
  ticketsRepo,
  type SupportTicket,
  type TicketStatus,
} from '../../lib/supabase/repositories/tickets';
import { TicketScreenshot, TicketStatusBadge } from '../../components/tickets/ticketUi';
import { dashChipClass, OVERLAY_HOST, OVERLAY_PANEL_DASH_LG } from '../../lib/overlayTheme';

type Filter = 'active' | TicketStatus | 'all';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'active', label: 'Needs action' },
  { id: 'open', label: TICKET_STATUS_LABELS.open },
  { id: 'in_progress', label: TICKET_STATUS_LABELS.in_progress },
  { id: 'resolved', label: TICKET_STATUS_LABELS.resolved },
  { id: 'closed', label: TICKET_STATUS_LABELS.closed },
  { id: 'all', label: 'All' },
];

function matches(filter: Filter, t: SupportTicket) {
  if (filter === 'all') return true;
  if (filter === 'active') return !isTicketFinal(t.status);
  return t.status === filter;
}

export default function AdminTickets() {
  const branches = useBranchStore((s) => s.branches);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('active');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setTickets(await ticketsRepo.list(500));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return ticketsRepo.subscribe(() => void load());
  }, [load]);

  const counts = useMemo(() => {
    const c = {} as Record<Filter, number>;
    for (const f of FILTERS) c[f.id] = tickets.filter((t) => matches(f.id, t)).length;
    return c;
  }, [tickets]);

  const shown = useMemo(() => tickets.filter((t) => matches(filter, t)), [tickets, filter]);
  const open = tickets.find((t) => t.id === openId) ?? null;
  const branchLabel = (id: string | null) => (id ? branches.find((b) => b.id === id)?.name ?? id : 'No branch');

  const replace = (next: SupportTicket) => setTickets((prev) => prev.map((t) => (t.id === next.id ? next : t)));

  const openTicket = (t: SupportTicket) => {
    setOpenId(t.id);
    if (!t.readAt) {
      void ticketsRepo.update(t, { markRead: true }).then(replace).catch(() => undefined);
    }
  };

  return (
    <div className="dash-page mx-auto max-w-5xl">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-kado-red">Administration</p>
      <h1 className="mb-1 font-display text-2xl font-bold dash-heading sm:text-3xl md:text-4xl">Tickets</h1>
      <p className="mb-6 max-w-prose text-sm dash-muted">
        Problems reported by baristas and staff. Resolving or closing a ticket permanently deletes its screenshot.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="tablist" aria-label="Filter tickets">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`${dashChipClass(filter === f.id)} whitespace-nowrap`}
          >
            {f.label}
            <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${filter === f.id ? 'bg-white/20' : 'dash-card'}`}>
              {counts[f.id]}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border dash-card dash-border p-12">
          <Loader2 className="h-5 w-5 animate-spin dash-muted" aria-label="Loading tickets" />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border dash-card dash-border p-10 text-center">
          <MessageSquare className="mx-auto mb-2 h-6 w-6 dash-muted" aria-hidden />
          <p className="text-sm font-semibold dash-heading">
            {filter === 'active' ? 'Nothing needs action' : 'No tickets here'}
          </p>
          <p className="mt-1 text-xs dash-muted">New reports from the barista and staff portals land here in real time.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {shown.map((t) => {
            const when = formatOrderTimestamp(t.createdAt);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => openTicket(t)}
                  className="flex w-full items-start gap-3 rounded-2xl border dash-card dash-border p-4 text-left transition-colors hover:border-kado-red/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kado-red/40"
                >
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${t.readAt ? 'bg-transparent' : 'bg-kado-red'}`}
                    aria-label={t.readAt ? undefined : 'Unread'}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={`font-semibold dash-heading [overflow-wrap:anywhere] ${t.readAt ? '' : 'font-bold'}`}>
                        {t.title}
                      </span>
                      {t.priority === 'urgent' && (
                        <span className="rounded-full bg-kado-red px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                          Urgent
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-xs dash-muted">
                      {t.reporterName ?? t.reporterEmail} · <span className="capitalize">{t.reporterRole}</span> ·{' '}
                      {branchLabel(t.branchId)}
                    </span>
                    <span className="mt-0.5 block text-xs dash-muted">
                      {TICKET_CATEGORY_LABELS[t.category]} · {when.clock} · {when.relative}
                      {t.imagePath ? ' · Screenshot' : ''}
                    </span>
                  </span>
                  <TicketStatusBadge status={t.status} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <TicketSheet
          ticket={open}
          branchLabel={branchLabel(open.branchId)}
          onClose={() => setOpenId(null)}
          onSaved={replace}
          onDeleted={(id) => {
            setTickets((prev) => prev.filter((t) => t.id !== id));
            setOpenId(null);
          }}
        />
      )}
    </div>
  );
}

function TicketSheet({
  ticket,
  branchLabel,
  onClose,
  onSaved,
  onDeleted,
}: {
  ticket: SupportTicket;
  branchLabel: string;
  onClose: () => void;
  onSaved: (t: SupportTicket) => void;
  onDeleted: (id: string) => void;
}) {
  const [note, setNote] = useState(ticket.adminNote ?? '');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const when = formatOrderTimestamp(ticket.createdAt);
  const final = isTicketFinal(ticket.status);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const run = async (label: string, status?: TicketStatus) => {
    if (status && isTicketFinal(status) && ticket.imagePath) {
      if (!window.confirm(`Mark as ${TICKET_STATUS_LABELS[status].toLowerCase()}? The screenshot will be permanently deleted.`)) return;
    }
    setBusy(label);
    setError(null);
    try {
      onSaved(await ticketsRepo.update(ticket, { status, adminNote: note }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the ticket.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this ticket and its screenshot? This cannot be undone.')) return;
    setBusy('delete');
    setError(null);
    try {
      await ticketsRepo.remove(ticket);
      onDeleted(ticket.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the ticket.');
      setBusy(null);
    }
  };

  const actionBtn =
    'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full px-4 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50 sm:flex-none';

  return (
    <div className={`${OVERLAY_HOST} z-[120]`} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-sheet-title"
        className={OVERLAY_PANEL_DASH_LG}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b dash-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <TicketStatusBadge status={ticket.status} />
              <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">
                {TICKET_CATEGORY_LABELS[ticket.category]} · {TICKET_PRIORITY_LABELS[ticket.priority]}
              </span>
            </div>
            <h2 id="ticket-sheet-title" className="font-display text-lg font-bold dash-heading [overflow-wrap:anywhere]">
              {ticket.title}
            </h2>
            <p className="mt-1 text-xs dash-muted">
              {ticket.reporterName ?? ticket.reporterEmail} · <span className="capitalize">{ticket.reporterRole}</span> ·{' '}
              {branchLabel} · {when.clock}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full dash-muted hover:bg-[var(--color-dash-hover)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          <p className="whitespace-pre-line text-sm leading-relaxed dash-heading [overflow-wrap:anywhere]">{ticket.description}</p>
          <TicketScreenshot ticket={ticket} />
          {ticket.imagePath && !final && (
            <p className="text-xs dash-muted">The screenshot is deleted as soon as you resolve or close this ticket.</p>
          )}
          <div>
            <label htmlFor="ticket-note" className="mb-1.5 block text-xs font-bold dash-heading">
              Reply to {ticket.reporterRole}
            </label>
            <textarea
              id="ticket-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="What you found or fixed. The reporter sees this on their tickets page."
              className="w-full rounded-xl border dash-input px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-kado-red/30 md:text-sm"
            />
          </div>
          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </p>
          )}
        </div>

        <div className="shrink-0 space-y-2 border-t dash-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="flex flex-wrap gap-2">
            {final ? (
              <button type="button" disabled={!!busy} onClick={() => run('reopen', 'in_progress')} className={`${actionBtn} border-2 dash-border dash-heading hover:border-kado-red/40`}>
                <RotateCcw className="h-4 w-4" /> Reopen
              </button>
            ) : (
              <>
                {ticket.status === 'open' && (
                  <button type="button" disabled={!!busy} onClick={() => run('start', 'in_progress')} className={`${actionBtn} border-2 dash-border dash-heading hover:border-kado-red/40`}>
                    {busy === 'start' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />} Start
                  </button>
                )}
                <button type="button" disabled={!!busy} onClick={() => run('resolve', 'resolved')} className={`${actionBtn} bg-kado-red text-white shadow-md shadow-kado-red/25 hover:bg-kado-red-hover`}>
                  {busy === 'resolve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Resolve
                </button>
                <button type="button" disabled={!!busy} onClick={() => run('close', 'closed')} className={`${actionBtn} border-2 dash-border dash-muted hover:text-[var(--color-dash-text)]`}>
                  {busy === 'close' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Close
                </button>
              </>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={!!busy || note === (ticket.adminNote ?? '')}
              onClick={() => run('note')}
              className="min-h-[44px] rounded-full px-3 text-xs font-bold uppercase tracking-wider text-kado-red disabled:opacity-40"
            >
              {busy === 'note' ? 'Saving…' : 'Save reply only'}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={remove}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
