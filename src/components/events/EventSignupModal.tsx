import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { X, LogIn } from 'lucide-react';
import type { Event } from '../../types/domain';
import { useAuthStore } from '../../store/authStore';
import { isValidEmail } from '../../lib/validation';
import { requirePhilippinePhone } from '../../lib/validation';
import { normalizePhilippinePhone } from '../../lib/phonePhilippines';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { newId } from '../../lib/id';

interface Props {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EventSignupModal({ event, onClose, onSuccess }: Props) {
  const user = useAuthStore((s) => s.user);
  const isCustomer = user?.role === 'customer';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user) {
      setName((v) => v || user.name || '');
      setEmail((v) => v || user.email || '');
    }
  }, [user]);

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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    const phoneErr = requirePhilippinePhone(phoneLocal);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }
    const phone = normalizePhilippinePhone(phoneLocal);

    setSubmitting(true);
    try {
      await orderingRepo.registerForEvent({
        id: newId(),
        eventId: event.id,
        contactName: name.trim(),
        contactEmail: email.trim(),
        contactPhone: phone,
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
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-kado-dark/60">Register for {event.title}</p>
          <Field label="Full name" value={name} onChange={setName} required autoComplete="name" />
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-kado-dark/55 mb-1.5">
              Phone number
            </label>
            <div className="flex rounded-xl border border-kado-dark/15 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-kado-red/25">
              <span className="px-3 py-2.5 text-sm font-bold text-kado-dark/70 bg-kado-offwhite/80 border-r border-kado-dark/10 shrink-0">
                +63
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={phoneLocal}
                onChange={(e) => setPhoneLocal(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="917 123 4567"
                className="flex-1 px-3 py-2.5 text-sm text-kado-dark focus:outline-none"
                required
                autoComplete="tel-national"
              />
            </div>
          </div>
          <Field label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" />
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
        className="w-full max-w-md rounded-2xl bg-white border border-kado-dark/10 p-6 shadow-2xl"
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

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-wider text-kado-dark/55 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white focus:outline-none focus:ring-2 focus:ring-kado-red/25"
      />
    </div>
  );
}
