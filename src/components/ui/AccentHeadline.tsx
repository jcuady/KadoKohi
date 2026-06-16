import CmsStyledText from '@/components/cms/CmsStyledText';
import { resolveCmsTextClasses, type CmsText } from '@/lib/cmsTypography';
import type { AccentHeadlineCopy } from '@/store/landingContentStore';
import { cmsTextProps } from '@/lib/cmsFieldBind';

type Props = {
  copy: AccentHeadlineCopy;
  accentClassName?: string;
  cmsEditMode?: boolean;
  fieldPrefix?: string;
  onPartChange?: (key: keyof AccentHeadlineCopy, value: CmsText) => void;
};

function accentClass(value: CmsText, fallback: string): string {
  const colorId = typeof value === 'object' ? value.color : undefined;
  if (colorId && colorId !== 'inherit') {
    return resolveCmsTextClasses(value);
  }
  return fallback;
}

function partProps(
  cmsEditMode: boolean | undefined,
  fieldPrefix: string | undefined,
  key: keyof AccentHeadlineCopy,
  onPartChange: Props['onPartChange'],
) {
  if (!cmsEditMode || !fieldPrefix || !onPartChange) return {};
  const labels: Record<keyof AccentHeadlineCopy, string> = {
    beforeAccent1: 'Before accent 1',
    accent1: 'Accent 1',
    middle: 'Middle',
    accent2: 'Accent 2',
    afterAccent2: 'After accent 2',
  };
  return cmsTextProps(cmsEditMode, `${fieldPrefix}.${key}`, labels[key], (v) => onPartChange(key, v));
}

/** Renders a two-accent headline from CMS copy. */
export default function AccentHeadline({
  copy,
  accentClassName = 'text-kado-red',
  cmsEditMode,
  fieldPrefix,
  onPartChange,
}: Props) {
  return (
    <>
      <CmsStyledText
        value={copy.beforeAccent1}
        as="span"
        {...partProps(cmsEditMode, fieldPrefix, 'beforeAccent1', onPartChange)}
      />
      <CmsStyledText
        value={copy.accent1}
        as="span"
        className={accentClass(copy.accent1, accentClassName)}
        {...partProps(cmsEditMode, fieldPrefix, 'accent1', onPartChange)}
      />
      <CmsStyledText
        value={copy.middle}
        as="span"
        {...partProps(cmsEditMode, fieldPrefix, 'middle', onPartChange)}
      />
      <CmsStyledText
        value={copy.accent2}
        as="span"
        className={accentClass(copy.accent2, accentClassName)}
        {...partProps(cmsEditMode, fieldPrefix, 'accent2', onPartChange)}
      />
      <CmsStyledText
        value={copy.afterAccent2}
        as="span"
        {...partProps(cmsEditMode, fieldPrefix, 'afterAccent2', onPartChange)}
      />
    </>
  );
}
