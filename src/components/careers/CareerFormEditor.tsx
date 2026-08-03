import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import {
  DEFAULT_EVENT_SIGNUP_FIELDS,
  newFormField,
  type EventFormField,
  type EventFormFieldType,
} from '../../lib/eventForms';
import EventSignupFields from '../events/EventSignupFields';
import { useConfirmDialog } from '../ui/ConfirmDialog';

const FIELD_TYPES: { value: EventFormFieldType; label: string }[] = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone (+63)' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
];

type Props = {
  fields: EventFormField[];
  onChange: (fields: EventFormField[]) => void;
};

export default function CareerFormEditor({ fields, onChange }: Props) {
  const { confirm, confirmDialog } = useConfirmDialog();
  const move = (index: number, dir: -1 | 1) => {
    const next = [...fields];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const updateField = (index: number, patch: Partial<EventFormField>) => {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeField = (index: number) => {
    void (async () => {
      const label = fields[index]?.label?.trim() || `field ${index + 1}`;
      if (
        !(await confirm({
          title: `Remove “${label}”?`,
          description: 'This field is removed from the draft until you save the listing.',
          confirmLabel: 'Remove',
        }))
      ) {
        return;
      }
      onChange(fields.filter((_, i) => i !== index));
    })();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm dash-muted">Fields shown on every in-page application. Name, phone, and email are recommended.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_EVENT_SIGNUP_FIELDS.map((f) => ({ ...f, id: newFormField(f.type).id })))}
            className="rounded-lg border dash-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider dash-muted hover:text-kado-red"
          >
            Reset defaults
          </button>
          <button
            type="button"
            onClick={() => onChange([...fields, newFormField()])}
            className="rounded-lg bg-kado-dark text-kado-cream px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Field
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-xl border dash-border p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-0.5 pt-1">
                <button type="button" onClick={() => move(index, -1)} className="p-0.5 dash-muted hover:text-kado-red" aria-label="Move up">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => move(index, 1)} className="p-0.5 dash-muted hover:text-kado-red" aria-label="Move down">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1">Label</label>
                  <input
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    className="w-full rounded-lg dash-input border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1">Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(index, { type: e.target.value as EventFormFieldType, options: e.target.value === 'select' ? ['Option 1', 'Option 2'] : undefined })}
                    className="w-full rounded-lg dash-input border px-3 py-2 text-sm"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1">Placeholder</label>
                  <input
                    value={field.placeholder ?? ''}
                    onChange={(e) => updateField(index, { placeholder: e.target.value || undefined })}
                    className="w-full rounded-lg dash-input border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1">Maps to profile</label>
                  <select
                    value={field.mapsTo ?? ''}
                    onChange={(e) =>
                      updateField(index, {
                        mapsTo: (e.target.value || undefined) as EventFormField['mapsTo'],
                      })
                    }
                    className="w-full rounded-lg dash-input border px-3 py-2 text-sm"
                  >
                    <option value="">Custom field</option>
                    <option value="contact_name">Full name</option>
                    <option value="contact_email">Email</option>
                    <option value="contact_phone">Phone</option>
                  </select>
                </div>
                {field.type === 'select' ? (
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1">Options (one per line)</label>
                    <textarea
                      value={(field.options ?? []).join('\n')}
                      onChange={(e) =>
                        updateField(index, {
                          options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      rows={3}
                      className="w-full rounded-lg dash-input border px-3 py-2 text-sm"
                    />
                  </div>
                ) : null}
                <label className="sm:col-span-2 text-xs dash-muted flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                  />
                  Required
                </label>
              </div>
              <button type="button" onClick={() => removeField(index)} className="p-1.5 text-red-400 hover:text-red-600" aria-label="Remove field">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {fields.length > 0 ? (
        <div className="rounded-xl border border-dashed dash-border p-4 bg-kado-offwhite/40">
          <p className="text-[10px] font-bold uppercase tracking-wider dash-muted mb-3">Preview</p>
          <EventSignupFields fields={fields} answers={{}} onChange={() => undefined} />
        </div>
      ) : null}
      {confirmDialog}
    </div>
  );
}
