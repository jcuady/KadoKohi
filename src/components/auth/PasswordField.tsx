import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  variant?: 'customer' | 'internal';
};

export default function PasswordField({
  label,
  id,
  variant = 'customer',
  className,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const isInternal = variant === 'internal';

  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          'block text-[10px] font-black uppercase tracking-[0.18em] mb-1.5',
          isInternal ? 'text-white/70' : 'text-kado-dark/55',
        )}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={cn(
            'w-full rounded-xl border px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 focus:border-kado-red transition-shadow',
            isInternal
              ? 'border-white/15 bg-[#232323] text-white placeholder:text-white/35'
              : 'border-kado-dark/12 bg-white text-kado-dark placeholder:text-kado-dark/35',
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors',
            isInternal ? 'text-white/50 hover:text-white' : 'text-kado-dark/40 hover:text-kado-dark',
          )}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
