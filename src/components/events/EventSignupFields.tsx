import type { EventFormAnswers, EventFormField } from '../../lib/eventForms';

type Props = {
  fields: EventFormField[];
  answers: EventFormAnswers;
  onChange: (fieldId: string, value: string | boolean) => void;
};

export default function EventSignupFields({ fields, answers, onChange }: Props) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.id}>
          <DynamicField field={field} value={answers[field.id]} onChange={onChange} />
        </div>
      ))}
    </div>
  );
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: EventFormField;
  value: string | boolean | number | undefined;
  onChange: (fieldId: string, value: string | boolean) => void;
}) {
  const label = (
    <label className="block text-[10px] font-black uppercase tracking-wider text-kado-dark/55 mb-1.5">
      {field.label}
      {field.required ? ' *' : ''}
    </label>
  );

  if (field.type === 'textarea') {
    return (
      <div>
        {label}
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          required={field.required}
          className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white focus:outline-none focus:ring-2 focus:ring-kado-red/25 resize-none"
        />
        {field.helpText && <p className="text-[10px] text-kado-dark/50 mt-1">{field.helpText}</p>}
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div>
        {label}
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          required={field.required}
          className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white focus:outline-none focus:ring-2 focus:ring-kado-red/25"
        >
          <option value="">Choose…</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-start gap-2 text-sm text-kado-dark/80">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(field.id, e.target.checked)}
          required={field.required}
          className="rounded mt-0.5"
        />
        <span>
          {field.label}
          {field.required ? ' *' : ''}
        </span>
      </label>
    );
  }

  if (field.type === 'phone') {
    const local = typeof value === 'string' ? value.replace(/^\+63/, '') : '';
    return (
      <div>
        {label}
        <div className="flex rounded-xl border border-kado-dark/15 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-kado-red/25">
          <span className="px-3 py-2.5 text-sm font-bold text-kado-dark/70 bg-kado-offwhite/80 border-r border-kado-dark/10 shrink-0">
            +63
          </span>
          <input
            type="tel"
            inputMode="numeric"
            value={local}
            onChange={(e) => onChange(field.id, e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder={field.placeholder ?? '917 123 4567'}
            required={field.required}
            autoComplete="tel-national"
            className="flex-1 px-3 py-2.5 text-sm text-kado-dark focus:outline-none"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {label}
      <input
        type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
        value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
        onChange={(e) => onChange(field.id, e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        autoComplete={
          field.mapsTo === 'contact_name' ? 'name' : field.mapsTo === 'contact_email' ? 'email' : undefined
        }
        className="w-full rounded-xl border border-kado-dark/15 px-4 py-2.5 text-sm text-kado-dark bg-white focus:outline-none focus:ring-2 focus:ring-kado-red/25"
      />
      {field.helpText && <p className="text-[10px] text-kado-dark/50 mt-1">{field.helpText}</p>}
    </div>
  );
}
