import type { AccentHeadlineCopy } from '@/store/landingContentStore';

type Props = {
  copy: AccentHeadlineCopy;
  accentClassName?: string;
};

/** Renders a two-accent headline from CMS copy. */
export default function AccentHeadline({ copy, accentClassName = 'text-kado-red' }: Props) {
  return (
    <>
      {copy.beforeAccent1}
      <span className={accentClassName}>{copy.accent1}</span>
      {copy.middle}
      <span className={accentClassName}>{copy.accent2}</span>
      {copy.afterAccent2}
    </>
  );
}
