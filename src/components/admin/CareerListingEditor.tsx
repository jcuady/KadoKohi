import { useMemo, useState, type FormEvent } from 'react';
import {
  branchLocationLabel,
  CAREER_EMPLOYMENT_PRESETS,
  CAREER_CATEGORY_LABELS,
  defaultApplyLabelForCategory,
  type CareerApplyMode,
  type CareerListing,
  type CareerListingCategory,
} from '../../lib/careersPageContent';
import { useBranchStore } from '../../store/branchStore';
import CareerJobCard from '../careers/CareerJobCard';

export type CareerListingFormState = {
  title: string;
  category: CareerListingCategory;
  branchId: string;
  location: string;
  employmentType: string;
  description: string;
  applyLabel: string;
  applyMode: CareerApplyMode;
  applyHref: string;
  visible: boolean;
};

export const EMPTY_CAREER_LISTING_FORM: CareerListingFormState = {
  title: '',
  category: 'careers',
  branchId: '',
  location: '',
  employmentType: '',
  description: '',
  applyLabel: 'Apply now',
  applyMode: 'form',
  applyHref: '',
  visible: true,
};

export function listingToForm(listing: CareerListing): CareerListingFormState {
  return {
    title: listing.title,
    category: listing.category,
    branchId: listing.branchId ?? '',
    location: listing.location ?? '',
    employmentType: listing.employmentType ?? '',
    description: listing.description,
    applyLabel: listing.applyLabel,
    applyMode: listing.applyMode,
    applyHref: listing.applyHref ?? '',
    visible: listing.visible,
  };
}

type Props = {
  form: CareerListingFormState;
  onChange: (next: CareerListingFormState) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  editing: boolean;
  previewListing?: CareerListing;
};

export default function CareerListingEditor({
  form,
  onChange,
  onSubmit,
  onCancel,
  editing,
  previewListing,
}: Props) {
  const branches = useBranchStore((s) => s.branches);
  const [customEmployment, setCustomEmployment] = useState(false);

  const sortedBranches = useMemo(
    () => [...branches].sort((a, b) => a.name.localeCompare(b.name)),
    [branches],
  );

  const employmentValue = form.employmentType;
  const isPreset = CAREER_EMPLOYMENT_PRESETS.includes(
    employmentValue as (typeof CAREER_EMPLOYMENT_PRESETS)[number],
  );

  const setField = <K extends keyof CareerListingFormState>(key: K, value: CareerListingFormState[K]) => {
    onChange({ ...form, [key]: value });
  };

  const onCategoryChange = (category: CareerListingCategory) => {
    onChange({
      ...form,
      category,
      applyLabel: defaultApplyLabelForCategory(category),
    });
  };

  const onBranchChange = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    onChange({
      ...form,
      branchId,
      location: branch ? branchLocationLabel(branch) : form.location,
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <h3 className="font-display text-lg font-bold dash-heading">
          {editing ? 'Edit listing' : 'New listing'}
        </h3>

        <Field label="Title" value={form.title} onChange={(v) => setField('title', v)} required />

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">Category</label>
          <select
            value={form.category}
            onChange={(e) => onCategoryChange(e.target.value as CareerListingCategory)}
            className="w-full rounded-xl border dash-input px-4 py-2.5 text-sm"
          >
            {(Object.keys(CAREER_CATEGORY_LABELS) as CareerListingCategory[]).map((key) => (
              <option key={key} value={key}>
                {CAREER_CATEGORY_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">Branch</label>
          <select
            value={form.branchId}
            onChange={(e) => onBranchChange(e.target.value)}
            className="w-full rounded-xl border dash-input px-4 py-2.5 text-sm"
          >
            <option value="">No branch / custom location</option>
            {sortedBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.city}
              </option>
            ))}
          </select>
        </div>

        <Field label="Location" value={form.location} onChange={(v) => setField('location', v)} />

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">Employment type</label>
          {!customEmployment && isPreset ? (
            <select
              value={employmentValue}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setCustomEmployment(true);
                  return;
                }
                setField('employmentType', e.target.value);
              }}
              className="w-full rounded-xl border dash-input px-4 py-2.5 text-sm"
            >
              <option value="">—</option>
              {CAREER_EMPLOYMENT_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
              <option value="__custom__">Custom…</option>
            </select>
          ) : (
            <input
              type="text"
              value={form.employmentType}
              onChange={(e) => setField('employmentType', e.target.value)}
              placeholder="Full-time, Part-time, etc."
              className="w-full rounded-xl border dash-input px-4 py-2.5 text-sm"
            />
          )}
        </div>

        <Field
          label="Description"
          value={form.description}
          onChange={(v) => setField('description', v)}
          multiline
          required
        />

        <Field label="Apply button label" value={form.applyLabel} onChange={(v) => setField('applyLabel', v)} />

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">Apply method</label>
          <select
            value={form.applyMode}
            onChange={(e) => setField('applyMode', e.target.value as CareerApplyMode)}
            className="w-full rounded-xl border dash-input px-4 py-2.5 text-sm"
          >
            <option value="form">In-page application form</option>
            <option value="link">External link (mailto or URL)</option>
          </select>
        </div>

        {form.applyMode === 'link' ? (
          <Field
            label="Apply link (mailto: or URL)"
            value={form.applyHref}
            onChange={(v) => setField('applyHref', v)}
            required
          />
        ) : null}

        <label className="flex items-center gap-2 text-xs dash-muted">
          <input
            type="checkbox"
            checked={form.visible}
            onChange={(e) => setField('visible', e.target.checked)}
          />
          Visible on public page
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border dash-border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-kado-red px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-kado-cream"
          >
            {editing ? 'Update' : 'Create'}
          </button>
        </div>
      </div>

      {previewListing ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider dash-muted">Live preview</p>
          <CareerJobCard
            listing={previewListing}
            branches={branches}
            onOpen={() => {}}
            onApply={() => {}}
            compact
          />
        </div>
      ) : null}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          required={required}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[100px] w-full rounded-xl border dash-input px-4 py-2.5 text-sm"
        />
      ) : (
        <input
          type="text"
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border dash-input px-4 py-2.5 text-sm"
        />
      )}
    </div>
  );
}
