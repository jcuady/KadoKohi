import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { X, LogIn } from 'lucide-react';
import type { Event } from '../../types/domain';
import { useAuthStore } from '../../store/authStore';
import { useEventFormStore } from '../../store/eventFormStore';
import {
  DEFAULT_EVENT_SIGNUP_FIELDS,
  type EventFormAnswers,
  type EventFormField,
  validateEventFormAnswers,
} from '../../lib/eventForms';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { newId } from '../../lib/id';
import EventSignupFields from './EventSignupFields';

interface Props {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EventSignupModal({ event, onClose, onSuccess }: Props) {
  const user = useAuthStore((s) => s.user);
  const isCustomer = user?.role === 'customer';
  const forms = useEventFormStore((s) => s.forms);
  const hydrateForms = useEventFormStore((s) => s.hydrateFromRemote);

  const [fields, setFields] = useState<EventFormField[]>(DEFAULT_EVENT_SIGNUP_FIELDS);
  const [answers, setAnswers] = useState<EventFormAnswers>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [loadingForm, setLoadingForm] = useState(true);

  useEffect(() => {
    void hydrateForms();
  }, [hydrateForms]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingForm(true);
      try {
        let nextFields = DEFAULT_EVENT_SIGNUP_FIELDS;
        if (event.signupFormId) {
          const cached = forms.find((f) => f.id === event.signupFormId);
          if (cached?.fields.length) {
            nextFields = cached.fields;
          } else {
            const remote = await orderingRepo.fetchEventForm(event.signupFormId);
            if (remote?.fields.length) nextFields = remote.fields;
          }
        }
        if (!cancelled) {
          setFields(nextFields);
          const initial: EventFormAnswers = {};
          for (const field of nextFields) {
            if (field.mapsTo === 'contact_name' && user?.name) initial[field.id] = user.name;
            if (field.mapsTo === 'contact_email' && user?.email) initial[field.id] = user.email;
          }
          setAnswers(initial);
        }
      } finally {
        if (!cancelled) setLoadingForm(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [event.signupFormId, forms, user?.email, user?.name]);

  const fieldSummary = useMemo(() => fields.map((f) => f.label).join(', '), [fields]);

  if (!isCustomer) {
    return (
      <ModalShell event={event} onClose={onClose}>
        <div className="text-center py-4">
          <p className="text-sm text-kado-dark/65 mb-6 leading-relaxed">
            Sign in to register for <strong>{event.title}</strong>. We need your account to confirm your spot.
          </p>
          <Link
            to="/auth/login"
            state={{ from: '/events', notice: `Sign in to register for ${event.title}.` }}
            className="inline-flex items-center justify-center gap-2 w-full min-h-[48px] bg-kado-red text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-kado-dark"
          >
            <LogIn className="w-4 h-4" /> Sign in to register
          </Link>
        </div>
      </ModalShell>
    );
  }

  const setAnswer = (fieldId: string, value: string | boolean) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const checked = validateEventFormAnswers(fields, answers);
    if (checked.ok === false) {
      setError(checked.error);
      return;
    }

    setSubmitting(true);
    try {
      await orderingRepo.registerForEvent({
        id: newId(),
        eventId: event.id,
        contactName: checked.contactName,
        contactEmail: checked.contactEmail,
        contactPhone: checked.contactPhone,
        customAnswers: checked.customAnswers,
        answers,
      });
      setDone(true);
      onSuccess();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
      setError(msg || 'Could not complete registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell event={event} onClose={onClose}>
      {done ? (
        <div className="text-center py-4">
          <p className="font-display text-xl font-bold text-kado-dark mb-2">You&apos;re registered!</p>
          <p className="text-sm text-kado-dark/60 mb-6">
            We&apos;ve saved your spot for <strong>{event.title}</strong>. See you there!
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-full bg-kado-dark text-kado-cream text-xs font-bold uppercase tracking-wider"
          >
            Done
          </button>
        </div>
      ) : loadingForm ? (
        <p className="text-sm text-kado-dark/60 py-6 text-center">Loading registration form…</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-kado-dark/60">
            Register for {event.title}
            <span className="block text-[10px] text-kado-dark/45 mt-1">{fieldSummary}</span>
          </p>
          <EventSignupFields fields={fields} answers={answers} onChange={setAnswer} />
          {error && (
            <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] rounded-full bg-kado-red text-white text-xs font-bold uppercase tracking-wider hover:bg-kado-dark disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Confirm registration'}
          </button>
        </form>
      )}
    </ModalShell>
  );
}

function ModalShell({
  event,
  onClose,
  children,
}: {
  event: Event;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/45 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white border border-kado-dark/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="font-display text-xl font-bold text-kado-dark pr-4">{event.title}</h2>
          <button type="button" onClick={onClose} className="text-kado-dark/40 hover:text-kado-dark p-1" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
