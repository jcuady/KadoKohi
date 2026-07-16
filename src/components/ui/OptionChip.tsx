import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Check } from 'lucide-react';
import { optionChipClass } from '../../lib/overlayTheme';
import { cn } from '../../lib/utils';

type Props = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children' | 'className'>;

/** Brand option chip — active = kado-red + check (product sheet standard). */
export default function OptionChip({ active, onClick, children, className, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      aria-pressed={active}
      onClick={onClick}
      className={cn(optionChipClass(active), className)}
      {...rest}
    >
      {active ? <Check className="h-3.5 w-3.5 shrink-0 stroke-[3]" aria-hidden /> : null}
      {children}
    </button>
  );
}
