import CmsStyledText from '@/components/cms/CmsStyledText';
import { resolveCmsTextClasses, type CmsText } from '@/lib/cmsTypography';
import type { AccentHeadlineCopy } from '@/store/landingContentStore';

type Props = {
  copy: AccentHeadlineCopy;
  accentClassName?: string;
};

function accentClass(value: CmsText, fallback: string): string {
  const colorId = typeof value === 'object' ? value.color : undefined;
  if (colorId && colorId !== 'inherit') {
    return resolveCmsTextClasses(value);
  }
  return fallback;
}

/** Renders a two-accent headline from CMS copy. */
export default function AccentHeadline({ copy, accentClassName = 'text-kado-red' }: Props) {
  return (
    <>
      <CmsStyledText value={copy.beforeAccent1} as="span" />
      <CmsStyledText value={copy.accent1} as="span" className={accentClass(copy.accent1, accentClassName)} />
      <CmsStyledText value={copy.middle} as="span" />
      <CmsStyledText value={copy.accent2} as="span" className={accentClass(copy.accent2, accentClassName)} />
      <CmsStyledText value={copy.afterAccent2} as="span" />
    </>
  );
}
