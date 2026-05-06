import { useEffect, useState, type FormEvent } from 'react';
import type { BoothBookingOccasion } from '../../types/domain';

export interface BookingFormValues {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  eventName: string;
  occasion: BoothBookingOccasion;
  guestCount: number;
  eventDate: string;
  startTime: string;
  endTime: string;
  specialRequests?: string;
}

interface BookingFormProps {
  defaultGuestCount: number;
  guestCount: number;
  onGuestCountChange: (count: number) => void;
  onSubmit: (values: BookingFormValues) => Promise<void> | void;
}

const OCCASIONS: { id: BoothBookingOccasion; label: string }[] = [
  { id: 'birthday', label: 'Birthday' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'private_party', label: 'Private Party' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'other', label: 'Other' },
];

export default function BookingForm({ defaultGuestCount, guestCount, onGuestCountChange, onSubmit }: BookingFormProps) {
  const [form, setForm] = useState<BookingFormValues>({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    eventName: '',
    occasion: 'birthday',
    guestCount: Math.max(1, defaultGuestCount),
    eventDate: '',
    startTime: '18:00',
    endTime: '21:00',
    specialRequests: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const minEventDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  useEffect(() => {
    setForm((s) => ({ ...s, guestCount: Math.max(1, guestCount) }));
  }, [guestCount]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.contactName.trim() || !form.contactEmail.trim() || !form.contactPhone.trim()) {
      setError('Please complete your contact details.');
      return;
    }
    if (!form.eventName.trim()) {
      setError('Please provide your event name.');
      return;
    }
    if (!form.eventDate || !form.startTime || !form.endTime) {
      setError('Please set your event date and time.');
      return;
    }
    if (form.eventDate < minEventDate) {
      setError('Please book at least 24 hours in advance.');
      return;
    }
    if (form.guestCount < 1) {
      setError('Guest count must be at least 1.');
      return;
    }
    if (form.endTime <= form.startTime) {
      setError('End time must be later than start time.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit booking right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white border border-kado-dark/10 p-6 md:p-7 shadow-sm">
      <h3 className="font-display text-2xl font-bold text-kado-dark mb-2">Book Your Booth</h3>
      <p className="text-sm text-kado-dark/60 mb-6">
        Submit your booking request and our team will get back to you with confirmation details.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <Field
          label="Contact Name"
          value={form.contactName}
          onChange={(v) => setForm((s) => ({ ...s, contactName: v }))}
          required
        />
        <Field
          label="Contact Email"
          type="email"
          value={form.contactEmail}
          onChange={(v) => setForm((s) => ({ ...s, contactEmail: v }))}
          required
        />
        <Field
          label="Phone Number"
          value={form.contactPhone}
          onChange={(v) => setForm((s) => ({ ...s, contactPhone: v }))}
          required
        />
        <Field
          label="Event Name"
          value={form.eventName}
          onChange={(v) => setForm((s) => ({ ...s, eventName: v }))}
          required
        />

        <div>
          <Label>Occasion</Label>
          <select
            value={form.occasion}
            onChange={(e) => setForm((s) => ({ ...s, occasion: e.target.value as BoothBookingOccasion }))}
            className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white focus:outline-none focus:ring-2 focus:ring-kado-red/25"
          >
            {OCCASIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Guest Count</Label>
          <input
            type="number"
            min={1}
            value={guestCount}
            onChange={(e) => onGuestCountChange(Math.max(1, Number(e.target.value || 1)))}
            className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white focus:outline-none focus:ring-2 focus:ring-kado-red/25"
          />
        </div>

        <Field
          label="Event Date"
          type="date"
          value={form.eventDate}
          onChange={(v) => setForm((s) => ({ ...s, eventDate: v }))}
          min={minEventDate}
          required
        />
        <Field
          label="Start Time"
          type="time"
          value={form.startTime}
          onChange={(v) => setForm((s) => ({ ...s, startTime: v }))}
          required
        />
        <Field
          label="End Time"
          type="time"
          value={form.endTime}
          onChange={(v) => setForm((s) => ({ ...s, endTime: v }))}
          required
        />
      </div>

      <div className="mt-4">
        <Label>Special Requests</Label>
        <textarea
          rows={4}
          value={form.specialRequests}
          onChange={(e) => setForm((s) => ({ ...s, specialRequests: e.target.value }))}
          placeholder="Theme, setup notes, dietary considerations, timeline notes..."
          className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white resize-none focus:outline-none focus:ring-2 focus:ring-kado-red/25"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-full bg-kado-red text-kado-cream py-3.5 text-sm font-black uppercase tracking-wider hover:bg-kado-dark transition-colors disabled:opacity-60"
      >
        {submitting ? 'Submitting...' : 'Submit Booking Request'}
      </button>
    </form>
  );
}

function Label({ children }: { children: string }) {
  return (
    <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1.5">
      {children}
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: 'text' | 'email' | 'date' | 'time';
  min?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        required={required}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white focus:outline-none focus:ring-2 focus:ring-kado-red/25"
      />
    </div>
  );
}
