import { useEffect, useMemo, useState } from 'react';
import { newId } from '../../lib/id';
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
  Eye,
  Save,
  Link2,
} from 'lucide-react';
import type { EventFormField, EventFormFieldType, EventFormTemplate } from '../../lib/eventForms';
import { DEFAULT_EVENT_SIGNUP_FIELDS, newFormField } from '../../lib/eventForms';
import { useEventFormStore } from '../../store/eventFormStore';
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
  assignedFormId?: string | null;
  onAssignForm?: (formId: string | null) => void;
  compact?: boolean;
  /** Full-page split layout for Admin Events → Form templates tab. */
  variant?: 'default' | 'page';
};

export default function EventFormBuilder({
  assignedFormId,
  onAssignForm,
  compact,
  variant = 'default',
}: Props) {
  const { confirm, confirmDialog } = useConfirmDialog();
  const forms = useEventFormStore((s) => s.forms);
  const hydrated = useEventFormStore((s) => s.hydrated);
  const hydrate = useEventFormStore((s) => s.hydrateFromRemote);
  const addForm = useEventFormStore((s) => s.addForm);
  const updateForm = useEventFormStore((s) => s.updateForm);
  const removeForm = useEventFormStore((s) => s.removeForm);

  const [editingId, setEditingId] = useState<string | null>(assignedFormId ?? forms[0]?.id ?? null);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftFields, setDraftFields] = useState<EventFormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const editing = useMemo(
    () => forms.find((f) => f.id === editingId) ?? null,
    [forms, editingId],
  );

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (assignedFormId && forms.some((f) => f.id === assignedFormId)) {
      const form = forms.find((f) => f.id === assignedFormId)!;
      loadDraft(form);
      return;
    }
    if (!editingId && forms[0]) {
      loadDraft(forms[0]);
    }
  }, [forms, assignedFormId]);

  const loadDraft = (form: EventFormTemplate) => {
    setEditingId(form.id);
    setDraftName(form.name);
    setDraftDescription(form.description ?? '');
    setDraftFields(form.fields.map((f) => ({ ...f })));
    setError('');
  };

  const startNew = async () => {
    setSaving(true);
    setError('');
    try {
      const created = await addForm();
      loadDraft(created);
      onAssignForm?.(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create form.');
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    if (!editingId) return;
    if (!draftName.trim()) {
      setError('Form name is required.');
      return;
    }
    if (draftFields.length === 0) {
      setError('Add at least one field.');
      return;
    }
    const hasName = draftFields.some((f) => f.mapsTo === 'contact_name');
    const hasEmail = draftFields.some((f) => f.mapsTo === 'contact_email');
    const hasPhone = draftFields.some((f) => f.mapsTo === 'contact_phone');
    if (!hasName || !hasEmail || !hasPhone) {
      setError('Include mapped fields for Full name, Email, and Phone (use “Maps to” on each field).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateForm(editingId, {
        name: draftName.trim(),
        description: draftDescription.trim(),
        fields: draftFields,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save form.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectForm = (id: string) => {
    const form = forms.find((f) => f.id === id);
    if (form) loadDraft(form);
  };

  const moveField = (index: number, dir: -1 | 1) => {
    const next = [...draftFields];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraftFields(next);
  };

  if (!hydrated) {
    return (
      <button
        type="button"
        onClick={() => void hydrate()}
        className="text-xs font-bold uppercase tracking-wider text-kado-red hover:underline"
      >
        Load form templates…
      </button>
    );
  }

  const formList = (
    <div className={variant === 'page' ? 'space-y-2' : 'flex flex-wrap gap-2'}>
      {forms.length === 0 ? (
        <p className="text-sm dash-muted px-1">No templates yet.</p>
      ) : (
        forms.map((f) =>
          variant === 'page' ? (
            <button
              key={f.id}
              type="button"
              onClick={() => loadDraft(f)}
              className={`w-full rounded-xl border p-3 text-left transition-colors ${
                editingId === f.id
                  ? 'border-kado-red bg-kado-red/5'
                  : 'dash-border hover:border-kado-red/30'
              }`}
            >
              <p className="font-display text-sm font-bold dash-heading truncate">{f.name}</p>
              <p className="text-[10px] dash-muted mt-0.5">
                {f.fields.length} field{f.fields.length === 1 ? '' : 's'}
                {f.description ? ` · ${f.description}` : ''}
              </p>
            </button>
          ) : (
            <button
              key={f.id}
              type="button"
              onClick={() => loadDraft(f)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                editingId === f.id
                  ? 'bg-kado-red text-white border-kado-red'
                  : 'dash-border dash-muted hover:border-kado-red/40'
              }`}
            >
              {f.name}
            </button>
          ),
        )
      )}
    </div>
  );

  const editorPanel = (
    <>
      {editing || draftFields.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Form name</label>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm"
                placeholder="e.g. Latte Art RSVP"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Description</label>
              <input
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm"
                placeholder="Optional note for admins"
              />
            </div>
          </div>

          <div className="space-y-2">
            {draftFields.map((field, index) => (
              <div key={field.id} className="rounded-xl border dash-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 dash-muted shrink-0" />
                  <input
                    value={field.label}
                    onChange={(e) =>
                      setDraftFields((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, label: e.target.value } : r)),
                      )
                    }
                    className="flex-1 rounded-lg dash-input px-3 py-1.5 text-sm font-semibold"
                  />
                  <button type="button" onClick={() => moveField(index, -1)} className="p-1 dash-muted hover:text-kado-red">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => moveField(index, 1)} className="p-1 dash-muted hover:text-kado-red">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      const label = draftFields[index]?.label?.trim() || `field ${index + 1}`;
                      if (
                        !(await confirm({
                          title: `Remove “${label}”?`,
                          description: 'This field is removed from the draft until you save.',
                          confirmLabel: 'Remove',
                        }))
                      ) {
                        return;
                      }
                      setDraftFields((rows) => rows.filter((_, i) => i !== index));
                    })();
                  }}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
                  <select
                    value={field.type}
                    onChange={(e) =>
                      setDraftFields((rows) =>
                        rows.map((r, i) =>
                          i === index
                            ? {
                                ...r,
                                type: e.target.value as EventFormFieldType,
                                options: e.target.value === 'select' ? r.options ?? ['Option 1'] : undefined,
                              }
                            : r,
                        ),
                      )
                    }
                    className="rounded-lg dash-input px-3 py-1.5 text-xs"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={field.mapsTo ?? ''}
                    onChange={(e) =>
                      setDraftFields((rows) =>
                        rows.map((r, i) =>
                          i === index
                            ? { ...r, mapsTo: (e.target.value || undefined) as EventFormField['mapsTo'] }
                            : r,
                        ),
                      )
                    }
                    className="rounded-lg dash-input px-3 py-1.5 text-xs"
                  >
                    <option value="">Custom field</option>
                    <option value="contact_name">Maps to: Full name</option>
                    <option value="contact_email">Maps to: Email</option>
                    <option value="contact_phone">Maps to: Phone</option>
                  </select>
                  <label className="flex items-center gap-2 text-xs dash-muted font-bold px-1">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        setDraftFields((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, required: e.target.checked } : r)),
                        )
                      }
                      className="rounded"
                    />
                    Required
                  </label>
                </div>
                {field.type === 'select' && (
                  <input
                    value={(field.options ?? []).join(', ')}
                    onChange={(e) =>
                      setDraftFields((rows) =>
                        rows.map((r, i) =>
                          i === index
                            ? {
                                ...r,
                                options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                              }
                            : r,
                        ),
                      )
                    }
                    placeholder="Options, comma-separated"
                    className="w-full rounded-lg dash-input px-3 py-1.5 text-xs"
                  />
                )}
                <input
                  value={field.placeholder ?? ''}
                  onChange={(e) =>
                    setDraftFields((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, placeholder: e.target.value } : r)),
                    )
                  }
                  placeholder="Placeholder (optional)"
                  className="w-full rounded-lg dash-input px-3 py-1.5 text-xs"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDraftFields((rows) => [...rows, newFormField('text')])}
              className="rounded-lg border dash-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider dash-muted hover:border-kado-red/40"
            >
              + Add field
            </button>
            <button
              type="button"
              onClick={() => setDraftFields(DEFAULT_EVENT_SIGNUP_FIELDS.map((f) => ({ ...f, id: newId() })))}
              className="rounded-lg border dash-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider dash-muted hover:border-kado-red/40"
            >
              Reset to standard
            </button>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="rounded-lg border dash-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-kado-red hover:border-kado-red/40 flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => void saveDraft()}
                disabled={saving}
                className="rounded-lg bg-kado-dark text-kado-cream px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-kado-red flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Save form
              </button>
            )}
            {editingId && onAssignForm && (
              <button
                type="button"
                onClick={() => onAssignForm(editingId)}
                className="rounded-lg border border-kado-red/30 text-kado-red px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Link2 className="w-3.5 h-3.5" /> Use for event
              </button>
            )}
            {editingId && editingId !== 'form_standard_signup' && (
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    if (
                      !(await confirm({
                        title: `Delete form “${draftName}”?`,
                        description: 'Events using it will fall back to standard fields.',
                        confirmLabel: 'Delete template',
                      }))
                    ) {
                      return;
                    }
                    try {
                      await removeForm(editingId);
                      setEditingId(forms.find((f) => f.id !== editingId)?.id ?? null);
                      const next = forms.find((f) => f.id !== editingId);
                      if (next) loadDraft(next);
                      else {
                        setDraftFields([]);
                        setDraftName('');
                      }
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Could not delete form.');
                    }
                  })();
                }}
                className="rounded-lg text-red-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
              >
                Delete template
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 px-3 py-2">{error}</p>}

          {showPreview && (
            <div className="rounded-xl border dash-border p-4 bg-kado-cream/30">
              <p className="text-[10px] font-bold uppercase tracking-wider dash-muted mb-3">Customer preview</p>
              <div className="space-y-3">
                {draftFields.map((field) => (
                  <div key={field.id}>
                    <PreviewField field={field} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm dash-muted">No form selected. Create a new form or pick a template.</p>
      )}
    </>
  );

  return (
    <div className={compact ? 'space-y-3' : variant === 'page' ? 'space-y-4' : 'rounded-2xl dash-card border p-5 space-y-4'}>
      {confirmDialog}
      {!compact && variant !== 'page' && (
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-xl dash-heading">Form maker</h2>
            <p className="text-xs dash-muted mt-1">
              Build reusable registration forms and assign them to events.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void startNew()}
            disabled={saving}
            className="rounded-xl bg-kado-dark text-kado-cream px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-kado-red flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New form
          </button>
        </div>
      )}

      {onAssignForm && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
            Assign to this event
          </label>
          <select
            value={assignedFormId ?? ''}
            onChange={(e) => {
              const id = e.target.value || null;
              onAssignForm(id);
              if (id) handleSelectForm(id);
            }}
            className="w-full rounded-xl dash-input px-4 py-2.5 text-sm"
          >
            <option value="">Standard (name, phone, email)</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.fields.length} fields)
              </option>
            ))}
          </select>
        </div>
      )}

      {!compact && variant === 'default' && formList}

      {variant === 'page' && !compact ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(14rem,17rem)_1fr]">
          <aside className="rounded-2xl dash-card border p-4 space-y-3 lg:sticky lg:top-4 lg:self-start">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider dash-muted">Templates</p>
              <button
                type="button"
                onClick={() => void startNew()}
                disabled={saving}
                className="rounded-lg bg-kado-dark text-kado-cream px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider hover:bg-kado-red flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            {formList}
          </aside>
          <div className="rounded-2xl dash-card border p-5 space-y-4 min-w-0">{editorPanel}</div>
        </div>
      ) : (
        editorPanel
      )}

      {compact && (
        <button
          type="button"
          onClick={() => void startNew()}
          className="text-[10px] font-bold uppercase tracking-wider text-kado-red hover:underline"
        >
          + New form template
        </button>
      )}
    </div>
  );
}

function PreviewField({ field }: { field: EventFormField }) {
  const label = (
    <label className="block text-[10px] font-black uppercase tracking-wider text-kado-dark/55 mb-1">
      {field.label}
      {field.required ? ' *' : ''}
    </label>
  );

  if (field.type === 'textarea') {
    return (
      <div>
        {label}
        <textarea rows={2} placeholder={field.placeholder} className="w-full rounded-xl border px-3 py-2 text-sm" readOnly />
      </div>
    );
  }
  if (field.type === 'select') {
    return (
      <div>
        {label}
        <select className="w-full rounded-xl border px-3 py-2 text-sm" disabled>
          <option>{field.options?.[0] ?? 'Choose…'}</option>
        </select>
      </div>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" disabled className="rounded" />
        {field.label}
      </label>
    );
  }
  if (field.type === 'phone') {
    return (
      <div>
        {label}
        <div className="flex rounded-xl border overflow-hidden">
          <span className="px-3 py-2 text-sm font-bold bg-gray-50 border-r">+63</span>
          <input className="flex-1 px-3 py-2 text-sm" placeholder="917 123 4567" readOnly />
        </div>
      </div>
    );
  }
  return (
    <div>
      {label}
      <input
        type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
        placeholder={field.placeholder}
        className="w-full rounded-xl border px-3 py-2 text-sm"
        readOnly
      />
    </div>
  );
}
