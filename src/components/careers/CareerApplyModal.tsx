import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, User, X } from 'lucide-react';
import type { CareerApplicationFormConfig, CareerListing } from '../../lib/careersPageContent';
import { useAuthStore } from '../../store/authStore';
import {
  type EventFormAnswers,
  validateEventFormAnswers,
} from '../../lib/eventForms';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { sendCareerApplicationEmail } from '../../lib/sendInboundEmail';
import { newId } from '../../lib/id';
import EventSignupFields from '../events/EventSignupFields';

interface Props {
  listing: CareerListing;
  formConfig: CareerApplicationFormConfig;
  onClose: () => void;
}

export default function CareerApplyModal({ listing, formConfig, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const [answers, setAnswers] = useState<EventFormAnswers>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const fields = formConfig.fields;

  useEffect(() => {
    const initial: EventFormAnswers = {};
    for (const field of fields) {
      if (field.mapsTo === 'contact_name' && user?.name) initial[field.id] = user.name;
      if (field.mapsTo === 'contact_email' && user?.email) initial[field.id] = user.email;
      if (field.mapsTo === 'contact_phone' && user?.phone) {
        initial[field.id] = user.phone.replace(/^\+63/, '');
      }
    }
    setAnswers(initial);
  }, [fields, user?.email, user?.name, user?.phone]);

  const signedInHint = useMemo(() => {
    if (!user) return null;
    if (user.role === 'customer') {
      return 'Signed in — we prefilled your profile. You can edit before submitting.';
    }
    return 'Signed in — apply as yourself or update the fields below.';
  }, [user]);

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
      await orderingRepo.submitCareerApplication({
        id: newId(),
        listingId: listing.id,
        contactName: checked.contactName,
        contactEmail: checked.contactEmail,
        contactPhone: checked.contactPhone,
        answers,
      });

      void sendCareerApplicationEmail({
        listingTitle: listing.title,
        name: checked.contactName,
        email: checked.contactEmail,
        phone: checked.contactPhone,
        answers,
        fields,
      });

      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not submit application. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title={done ? formConfig.successTitle : formConfig.title}>
      {done ? (
        <div className="py-4 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-600" aria-hidden />
          <p className="text-sm leading-relaxed text-kado-dark/70">{formConfig.successMessage}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-kado-red text-xs font-bold uppercase tracking-wider text-white hover:bg-kado-dark"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <p className="mb-2 text-sm text-kado-dark/65 leading-relaxed">
            Applying for <strong className="text-kado-dark">{listing.title}</strong>
          </p>
          <p className="mb-5 text-sm text-kado-dark/55 leading-relaxed">{formConfig.intro}</p>

          {signedInHint ? (
            <p className="mb-4 inline-flex items-start gap-2 rounded-xl border border-kado-red/15 bg-kado-red/5 px-3 py-2.5 text-xs text-kado-dark/70">
              <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-kado-red" aria-hidden />
              {signedInHint}
            </p>
          ) : (
            <p className="mb-4 text-xs text-kado-dark/50">
              No account needed.{' '}
              <Link to="/auth/login" state={{ from: '/careers' }} className="font-semibold text-kado-red hover:underline">
                Sign in
              </Link>{' '}
              to prefill your details.
            </p>
          )}

          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <EventSignupFields fields={fields} answers={answers} onChange={setAnswer} />
            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-kado-red text-xs font-bold uppercase tracking-wider text-white hover:bg-kado-dark disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending…
                </>
              ) : (
                listing.applyLabel || 'Submit application'
              )}
            </button>
          </form>
        </>
      )}
    </ModalShell>
  );
}

function ModalShell({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="career-apply-title"
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[1.5rem] bg-white p-6 shadow-2xl sm:rounded-[1.5rem] md:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="career-apply-title" className="font-display text-xl font-bold text-kado-dark">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-kado-dark/45 hover:bg-kado-offwhite hover:text-kado-dark"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
