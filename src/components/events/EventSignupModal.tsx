import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
import OverlayShell from '../ui/OverlayShell';
import { OVERLAY_CTA_DARK } from '../../lib/overlayTheme';
import { notifyEventRegistration } from '../../lib/notify';

interface Props {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EventSignupModal({ event, onClose, onSuccess }: Props) {
  const user = useAuthStore((s) => s.user);
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
      notifyEventRegistration({
        customerId: user?.role === 'customer' ? user.id : undefined,
        eventId: event.id,
        eventTitle: event.title,
        contactName: checked.contactName,
        branchId: event.branchId,
      });
      setDone(true);
      onSuccess();
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
      setError(msg || 'Could not complete registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OverlayShell open onClose={onClose} title={event.title} centered zClass="z-[300]" labelledBy="event-signup-title">
      {done ? (
        <div className="text-center py-2">
          <p className="font-display text-xl font-bold text-kado-dark mb-2">You&apos;re registered!</p>
          <p className="text-sm text-kado-dark/60 mb-6">
            We&apos;ve saved your spot for <strong>{event.title}</strong>. See you there!
          </p>
          <button type="button" onClick={onClose} className={OVERLAY_CTA_DARK}>
            Done
          </button>
        </div>
      ) : loadingForm ? (
        <p className="text-sm text-kado-dark/60 py-8 text-center">Loading form…</p>
      ) : (
        <form onSubmit={(ev) => void submit(ev)} className="space-y-4">
          <p className="text-xs text-kado-dark/55">
            {fieldSummary ? `Fields: ${fieldSummary}` : 'Complete the form to reserve your spot.'}
            {!user ? ' Guests welcome — no account required.' : null}
          </p>
          <EventSignupFields fields={fields} answers={answers} onChange={setAnswer} />
          {error ? <p className="text-sm font-semibold text-kado-red">{error}</p> : null}
          <button type="submit" disabled={submitting} className={OVERLAY_CTA_DARK}>
            {submitting ? 'Submitting…' : 'Register'}
          </button>
        </form>
      )}
    </OverlayShell>
  );
}
