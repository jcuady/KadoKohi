import { newId } from './id';
import { normalizePhilippinePhone } from './phonePhilippines';
import { isValidEmail, requirePhilippinePhone } from './validation';

export type EventFormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'number';

export type EventFormFieldMap = 'contact_name' | 'contact_email' | 'contact_phone';

export interface EventFormField {
  id: string;
  type: EventFormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
  mapsTo?: EventFormFieldMap;
}

export interface EventFormTemplate {
  id: string;
  name: string;
  description?: string;
  fields: EventFormField[];
  createdAt: string;
  updatedAt: string;
}

export type EventFormAnswers = Record<string, string | boolean | number>;

export const DEFAULT_EVENT_SIGNUP_FIELDS: EventFormField[] = [
  {
    id: 'f_name',
    type: 'text',
    label: 'Full name',
    placeholder: 'Your name',
    required: true,
    mapsTo: 'contact_name',
  },
  {
    id: 'f_phone',
    type: 'phone',
    label: 'Phone number',
    required: true,
    mapsTo: 'contact_phone',
  },
  {
    id: 'f_email',
    type: 'email',
    label: 'Email',
    placeholder: 'you@email.com',
    required: true,
    mapsTo: 'contact_email',
  },
];

export function createDefaultEventFormTemplate(name = 'Standard sign-up'): EventFormTemplate {
  const t = new Date().toISOString();
  return {
    id: newId(),
    name,
    description: 'Name, Philippine mobile, and email',
    fields: DEFAULT_EVENT_SIGNUP_FIELDS.map((f) => ({ ...f, id: newId() })),
    createdAt: t,
    updatedAt: t,
  };
}

export function newFormField(type: EventFormFieldType = 'text'): EventFormField {
  return {
    id: newId(),
    type,
    label: type === 'phone' ? 'Phone number' : type === 'email' ? 'Email' : 'New question',
    required: false,
    options: type === 'select' ? ['Option 1', 'Option 2'] : undefined,
  };
}

export function parseFormFields(raw: unknown): EventFormField[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const f = row as Record<string, unknown>;
      const type = f.type as EventFormFieldType;
      if (!f.id || !f.label || !type) return null;
      const parsed: EventFormField = {
        id: String(f.id),
        type,
        label: String(f.label),
        placeholder: f.placeholder ? String(f.placeholder) : undefined,
        required: Boolean(f.required),
        options: Array.isArray(f.options) ? f.options.map(String) : undefined,
        helpText: f.helpText ? String(f.helpText) : undefined,
        mapsTo: f.mapsTo as EventFormFieldMap | undefined,
      };
      return parsed;
    })
    .filter((f): f is EventFormField => f !== null);
}

export function validateEventFormAnswers(
  fields: EventFormField[],
  answers: EventFormAnswers,
): { ok: true; contactName: string; contactEmail: string; contactPhone: string; customAnswers: EventFormAnswers } | { ok: false; error: string } {
  const customAnswers: EventFormAnswers = {};
  let contactName = '';
  let contactEmail = '';
  let contactPhone = '';

  for (const field of fields) {
    const raw = answers[field.id];
    const empty =
      raw === undefined ||
      raw === null ||
      (typeof raw === 'string' && !raw.trim()) ||
      (field.type === 'checkbox' && raw !== true && raw !== false);

    if (empty) {
      if (field.required) return { ok: false, error: `${field.label} is required.` };
      continue;
    }

    if (field.type === 'checkbox') {
      const val = raw === true || raw === 'true';
      customAnswers[field.id] = val;
      continue;
    }

    const text = String(raw).trim();

    if (field.type === 'email' || field.mapsTo === 'contact_email') {
      if (!isValidEmail(text)) return { ok: false, error: `Enter a valid email for ${field.label}.` };
      if (field.mapsTo === 'contact_email') contactEmail = text.toLowerCase();
      else customAnswers[field.id] = text.toLowerCase();
      continue;
    }

    if (field.type === 'phone' || field.mapsTo === 'contact_phone') {
      const phoneErr = requirePhilippinePhone(text.replace(/^\+63/, ''));
      if (phoneErr) return { ok: false, error: phoneErr };
      const phone = normalizePhilippinePhone(text.replace(/^\+63/, ''));
      if (field.mapsTo === 'contact_phone') contactPhone = phone;
      else customAnswers[field.id] = phone;
      continue;
    }

    if (field.type === 'number') {
      const n = Number(text);
      if (Number.isNaN(n)) return { ok: false, error: `${field.label} must be a number.` };
      customAnswers[field.id] = n;
      continue;
    }

    if (field.type === 'select') {
      const opts = field.options ?? [];
      if (!opts.includes(text)) return { ok: false, error: `Choose a valid option for ${field.label}.` };
      customAnswers[field.id] = text;
      continue;
    }

    if (field.mapsTo === 'contact_name') {
      if (text.length > 120) return { ok: false, error: 'Name is too long (max 120 characters).' };
      contactName = text;
    } else {
      customAnswers[field.id] = text;
    }
  }

  if (!contactName) return { ok: false, error: 'Full name is required.' };
  if (!contactEmail) return { ok: false, error: 'Email is required.' };
  if (!contactPhone) return { ok: false, error: 'Phone number is required.' };

  return { ok: true, contactName, contactEmail, contactPhone, customAnswers };
}
