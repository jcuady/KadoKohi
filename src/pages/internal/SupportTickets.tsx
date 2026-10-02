import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, MessageSquare, Send, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { formatOrderTimestamp } from '../../lib/orderTime';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_IMAGE_MAX_BYTES,
  TICKET_PRIORITY_LABELS,
  ticketsRepo,
  type SupportTicket,
  type TicketCategory,
  type TicketPriority,
} from '../../lib/supabase/repositories/tickets';
import { TicketScreenshot, TicketStatusBadge } from '../../components/tickets/ticketUi';
import { dashChipClass } from '../../lib/overlayTheme';

type Props = { portalLabel: string };

const CATEGORIES = Object.keys(TICKET_CATEGORY_LABELS) as TicketCategory[];
const PRIORITIES = Object.keys(TICKET_PRIORITY_LABELS) as TicketPriority[];

export default function SupportTickets({ portalLabel }: Props) {
  const user = useAuthStore((s) => s.user);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('bug');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setTickets(await ticketsRepo.list());
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load your tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return ticketsRepo.subscribe(() => void load());
  }, [load]);

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const pickImage = (file: File | undefined) => {
    setFormError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Pick an image file (JPG, PNG, WebP or HEIC).');
      return;
    }
    if (file.size > TICKET_IMAGE_MAX_BYTES) {
      setFormError('That image is over 5 MB. Crop it or take a smaller screenshot.');
      return;
    }
    setImage(file);
  };

  const clearImage = () => {
    setImage(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);
    setSent(false);
    if (title.trim().length < 3) {
      setFormError('Give the ticket a short title (at least 3 characters).');
      return;
    }
    if (!description.trim()) {
      setFormError('Describe what happened so admin can reproduce it.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await ticketsRepo.create(user.id, { title, description, category, priority, image });
      setTickets((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
      setTitle('');
      setDescription('');
      setCategory('bug');
      setPriority('normal');
      clearImage();
      setSent(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not send the ticket. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dash-page mx-auto max-w-6xl">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-kado-red">{portalLabel}</p>
      <h1 className="mb-1 font-display text-2xl font-bold dash-heading sm:text-3xl md:text-4xl">Report a problem</h1>
      <p className="mb-6 max-w-prose text-sm dash-muted">
        Something broken or confusing? Send it to admin with a screenshot. You can follow the status here.
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
        <form onSubmit={submit} className="space-y-5 rounded-2xl border dash-card dash-border p-4 sm:p-6" noValidate>
          <div>
            <label htmlFor="ticket-title" className="mb-1.5 block text-xs font-bold dash-heading">
              Title
            </label>
            <input
              id="ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. POS freezes after Pay & Place"
              className="min-h-[44px] w-full rounded-xl border dash-input px-4 text-base focus:outline-none focus:ring-2 focus:ring-kado-red/30 md:text-sm"
            />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-xs font-bold dash-heading">Type</legend>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={dashChipClass(category === c)}
                >
                  {TICKET_CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="ticket-description" className="mb-1.5 block text-xs font-bold dash-heading">
              What happened?
            </label>
            <textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
              rows={5}
              placeholder="What were you doing, what did you expect, and what happened instead? Include the order code if there is one."
              className="w-full rounded-xl border dash-input px-4 py-3 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-kado-red/30 md:text-sm"
            />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-xs font-bold dash-heading">How urgent?</legend>
            <div className="grid grid-cols-3 gap-2 sm:flex">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={priority === p}
                  onClick={() => setPriority(p)}
                  className={dashChipClass(priority === p)}
                >
                  {TICKET_PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
            {priority === 'urgent' && (
              <p className="mt-2 text-xs dash-muted">Use Urgent only when it stops you from serving customers.</p>
            )}
          </fieldset>

          <div>
            <p className="mb-1.5 text-xs font-bold dash-heading">
              Screenshot <span className="font-normal dash-muted">(optional, max 5 MB)</span>
            </p>
            <input
              ref={fileRef}
              id="ticket-image"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => pickImage(e.target.files?.[0])}
            />
            {preview ? (
              <div className="relative overflow-hidden rounded-xl border dash-border">
                <img src={preview} alt="Screenshot preview" className="max-h-64 w-full bg-black/5 object-contain" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-kado-dark/80 text-white hover:bg-kado-red"
                  aria-label="Remove screenshot"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="ticket-image"
                className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed dash-border px-4 py-5 text-center transition-colors hover:border-kado-red/50 focus-within:ring-2 focus-within:ring-kado-red/30"
              >
                <ImagePlus className="h-6 w-6 text-kado-red" aria-hidden />
                <span className="text-sm font-bold dash-heading">Add a screenshot or photo</span>
                <span className="text-xs dash-muted">Deleted automatically once admin resolves the ticket.</span>
              </label>
            )}
          </div>

          {formError && (
            <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {formError}
            </p>
          )}
          {sent && (
            <p role="status" className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> Sent. It is now in the admin ticket list.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-kado-red px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-kado-red/25 transition-colors hover:bg-kado-red-hover disabled:opacity-60 sm:w-auto"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? 'Sending…' : 'Send ticket'}
          </button>
        </form>

        <section aria-labelledby="my-tickets-heading">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="my-tickets-heading" className="text-[11px] font-black uppercase tracking-widest dash-heading">
              My tickets
            </h2>
            <span className="text-xs dash-muted">{tickets.length}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border dash-card dash-border p-10">
              <Loader2 className="h-5 w-5 animate-spin dash-muted" aria-label="Loading tickets" />
            </div>
          ) : loadError ? (
            <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{loadError}</p>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl border dash-card dash-border p-8 text-center">
              <MessageSquare className="mx-auto mb-2 h-6 w-6 dash-muted" aria-hidden />
              <p className="text-sm font-semibold dash-heading">No tickets yet</p>
              <p className="mt-1 text-xs dash-muted">Anything you send shows up here with its status.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {tickets.map((t) => {
                const when = formatOrderTimestamp(t.createdAt);
                return (
                  <li key={t.id} className="space-y-3 rounded-2xl border dash-card dash-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold dash-heading [overflow-wrap:anywhere]">{t.title}</p>
                        <p className="mt-0.5 text-xs dash-muted">
                          {TICKET_CATEGORY_LABELS[t.category]} · {when.clock} · {when.relative}
                        </p>
                      </div>
                      <TicketStatusBadge status={t.status} />
                    </div>
                    <p className="line-clamp-3 whitespace-pre-line text-sm dash-muted [overflow-wrap:anywhere]">
                      {t.description}
                    </p>
                    <TicketScreenshot ticket={t} />
                    {t.adminNote && (
                      <div className="rounded-xl border border-kado-red/25 bg-kado-red/5 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-kado-red">Admin reply</p>
                        <p className="mt-1 whitespace-pre-line text-sm dash-heading [overflow-wrap:anywhere]">{t.adminNote}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
