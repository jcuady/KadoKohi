type Props = {
  id: string;
  label?: string;
  value: string;
  onChange: (localDigits: string) => void;
  onBlur?: () => void;
  required?: boolean;
  hint?: string;
  error?: string | null;
  className?: string;
};

export default function PhilippinePhoneField({
  id,
  label = 'Mobile number',
  value,
  onChange,
  onBlur,
  required = true,
  hint = 'Philippine mobile only — used for order updates.',
  error,
  className = '',
}: Props) {
  const errorId = `${id}-error`;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [error ? errorId : null, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55 mb-1">
        {label}
        {required ? <span className="text-kado-red"> *</span> : null}
      </label>
      <div
        className={`flex rounded-xl border overflow-hidden bg-kado-offwhite/50 focus-within:ring-2 focus-within:ring-kado-red/25 focus-within:border-kado-red ${
          error ? 'border-red-400' : 'border-kado-dark/12'
        }`}
      >
        <span className="px-3 py-2.5 text-sm font-bold text-kado-dark/70 bg-kado-offwhite/80 border-r border-kado-dark/10 shrink-0">
          +63
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          onBlur={onBlur}
          placeholder="917 123 4567"
          required={required}
          autoComplete="tel-national"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="flex-1 px-3 py-2.5 lg:py-2 text-sm text-kado-dark placeholder:text-kado-dark/35 focus:outline-none bg-transparent"
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-600 leading-snug">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="text-[10px] text-kado-dark/40 mt-1 leading-snug">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
