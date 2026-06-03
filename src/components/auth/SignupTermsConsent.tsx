import { Link } from 'react-router-dom';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
};

export default function SignupTermsConsent({ checked, onChange, id = 'signup-terms' }: Props) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 sm:px-3.5 transition-colors touch-manipulation ${
        checked ? 'border-kado-red/25 bg-kado-red/[0.03]' : 'border-kado-dark/12 bg-kado-offwhite/40'
      }`}
    >
      <label
        htmlFor={id}
        className="flex items-start gap-3 cursor-pointer select-none min-h-[44px]"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-[18px] w-[18px] sm:h-4 sm:w-4 shrink-0 rounded border-kado-dark/25 text-kado-red focus:ring-2 focus:ring-kado-red/30 focus:ring-offset-0"
          required
          aria-describedby={`${id}-desc`}
        />
        <span id={`${id}-desc`} className="text-xs sm:text-[13px] text-kado-dark/70 leading-relaxed break-words">
          I have read and agree to the{' '}
          <Link
            to="/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-kado-red hover:underline underline-offset-2 inline-block py-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            to="/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-kado-red hover:underline underline-offset-2 inline-block py-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            Privacy Policy
          </Link>
          . I understand Kado Kohi will process my name, email, mobile number, and order-related information as
          described there.
        </span>
      </label>
    </div>
  );
}
