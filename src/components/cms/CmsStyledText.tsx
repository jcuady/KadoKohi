import type { CSSProperties, ElementType, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { cmsTextPlain, resolveCmsTextClasses, type CmsText } from '../../lib/cmsTypography';

type Props = {
  value: CmsText;
  as?: ElementType;
  className?: string;
  defaultSizeClass?: string;
  defaultColorClass?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/** Renders CMS copy with optional brand-constrained size and color overrides. */
export default function CmsStyledText({
  value,
  as: Tag = 'span',
  className,
  defaultSizeClass,
  defaultColorClass,
  style,
  children,
}: Props) {
  const text = children ?? cmsTextPlain(value);
  return (
    <Tag
      style={style}
      className={cn(resolveCmsTextClasses(value, { sizeClass: defaultSizeClass, colorClass: defaultColorClass }), className)}
    >
      {text}
    </Tag>
  );
}
