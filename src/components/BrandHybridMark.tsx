import { LOGO } from '../lib/brandTokens';
import { cn } from '../lib/utils';

type Props = {
  /** Official hybrid 角 + KA/DO mark (brand book lockup). */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  alt?: string;
};

const SIZE = {
  sm: 'h-7 w-7',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
} as const;

/** Official hybrid mark — prefer this over a typed 角 box (BRANDING §1 / §5). */
export default function BrandHybridMark({ size = 'md', className, alt = 'Kado Kohi' }: Props) {
  return (
    <picture>
      <source srcSet={LOGO.hybridMarkWebp} type="image/webp" />
      <img
        src={LOGO.hybridMark}
        alt={alt}
        width={128}
        height={128}
        decoding="async"
        fetchPriority="low"
        className={cn('block shrink-0 object-contain', SIZE[size], className)}
      />
    </picture>
  );
}
