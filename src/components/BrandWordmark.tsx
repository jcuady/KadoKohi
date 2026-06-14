import { LOGO } from '../lib/brandTokens';

type Props = {
  variant?: 'nav' | 'sidebar';
  className?: string;
};

export default function BrandWordmark({ variant = 'nav', className = '' }: Props) {
  return (
    <img
      src={LOGO.wordmark}
      alt="Kado Kohi"
      decoding="async"
      className={[
        'block h-auto w-auto object-contain object-left brightness-0 invert',
        variant === 'sidebar'
          ? 'max-h-8 max-w-[min(176px,52vw)]'
          : 'max-h-7 sm:max-h-8 max-w-[min(152px,42vw)] md:max-w-[168px]',
        className,
      ].join(' ')}
    />
  );
}
