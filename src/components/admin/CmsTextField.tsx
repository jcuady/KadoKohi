import {
  CMS_TEXT_COLORS,
  CMS_TEXT_SIZES,
  cmsTextColor,
  cmsTextPlain,
  cmsTextSize,
  patchCmsText,
  type CmsText,
  type CmsTextColor,
  type CmsTextSize,
} from '../../lib/cmsTypography';

type Props = {
  label: string;
  value: CmsText;
  onChange: (next: CmsText) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
};

export default function CmsTextField({ label, value, onChange, multiline, rows = 3, required }: Props) {
  const text = cmsTextPlain(value);
  const size = cmsTextSize(value);
  const color = cmsTextColor(value);

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={text}
          rows={rows}
          required={required}
          onChange={(e) => onChange(patchCmsText(value, { text: e.target.value }))}
          className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm min-h-[5rem]"
        />
      ) : (
        <input
          type="text"
          value={text}
          required={required}
          onChange={(e) => onChange(patchCmsText(value, { text: e.target.value }))}
          className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
        />
      )}
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">Type size</span>
          <select
            value={size}
            onChange={(e) => onChange(patchCmsText(value, { size: e.target.value as CmsTextSize }))}
            className="mt-1 w-full rounded-lg dash-input border px-2 py-1.5 text-xs"
          >
            {CMS_TEXT_SIZES.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">Text color</span>
          <select
            value={color}
            onChange={(e) => onChange(patchCmsText(value, { color: e.target.value as CmsTextColor }))}
            className="mt-1 w-full rounded-lg dash-input border px-2 py-1.5 text-xs"
          >
            {CMS_TEXT_COLORS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {(size !== 'inherit' || color !== 'inherit') && text ? (
        <p className="mt-2 text-[10px] dash-muted">
          Preview:{' '}
          <span
            className={
              [
                size !== 'inherit' ? CMS_TEXT_SIZES.find((s) => s.id === size)?.className : '',
                color !== 'inherit' ? CMS_TEXT_COLORS.find((c) => c.id === color)?.className : 'text-kado-dark',
              ]
                .filter(Boolean)
                .join(' ') || 'text-kado-dark text-sm'
            }
          >
            {text}
          </span>
        </p>
      ) : null}
    </div>
  );
}
