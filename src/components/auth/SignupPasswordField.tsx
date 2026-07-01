import { useId, useMemo, useState } from 'react';
import { Check, Eye, EyeOff, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  evaluatePasswordStrength,
  passwordStrengthBarClass,
  passwordStrengthLabel,
  passwordStrengthScore,
} from '@/lib/passwordStrength';

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string | null;
};

export default function SignupPasswordField({ id: idProp, value, onChange, onBlur, disabled, error }: Props) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const [visible, setVisible] = useState(false);

  const strength = useMemo(() => evaluatePasswordStrength(value), [value]);
  const strengthScore = useMemo(() => passwordStrengthScore(value), [value]);

  return (
    <div className="min-w-0">
      <div className="space-y-2">
        <Label
          htmlFor={id}
          className="block text-[10px] font-black uppercase tracking-[0.18em] text-kado-dark/55"
        >
          Password
        </Label>
        <div className="relative">
          <Input
            id={id}
            className={cn(
              'h-auto rounded-xl bg-white py-3 pe-9 text-kado-dark shadow-none focus-visible:ring-kado-red/25',
              error ? 'border-red-400' : 'border-kado-dark/12',
            )}
            placeholder="Password"
            type={visible ? 'text' : 'password'}
            autoComplete="new-password"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            aria-invalid={error || strengthScore < 4 ? true : undefined}
            aria-describedby={error ? `${descriptionId} ${errorId}` : descriptionId}
            disabled={disabled}
            required
            minLength={8}
          />
          <button
            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-xl text-kado-dark/40 outline-offset-2 transition-colors hover:text-kado-dark focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-kado-red/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            aria-controls={id}
            disabled={disabled}
          >
            {visible ? (
              <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Eye size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div
        className="mb-3 mt-3 h-1 w-full overflow-hidden rounded-full bg-kado-dark/10"
        role="progressbar"
        aria-valuenow={strengthScore}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label="Password strength"
      >
        <div
          className={cn('h-full transition-all duration-500 ease-out', passwordStrengthBarClass(strengthScore))}
          style={{ width: `${(strengthScore / 4) * 100}%` }}
        />
      </div>

      <p id={descriptionId} className="mb-2 text-sm font-medium text-kado-dark">
        {passwordStrengthLabel(strengthScore)}. Must contain:
      </p>

      <ul className="space-y-1.5" aria-label="Password requirements">
        {strength.map((req) => (
          <li key={req.text} className="flex items-center gap-2">
            {req.met ? (
              <Check size={16} className="text-emerald-500" aria-hidden="true" />
            ) : (
              <X size={16} className="text-kado-dark/40" aria-hidden="true" />
            )}
            <span className={cn('text-xs', req.met ? 'text-emerald-600' : 'text-kado-dark/55')}>
              {req.text}
              <span className="sr-only">{req.met ? ' - Requirement met' : ' - Requirement not met'}</span>
            </span>
          </li>
        ))}
      </ul>

      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-xs font-medium text-red-600 leading-snug">
          {error}
        </p>
      ) : null}
    </div>
  );
}
