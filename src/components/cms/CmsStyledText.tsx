import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { cmsTextPlain, patchCmsText, resolveCmsTextClasses, type CmsText } from '../../lib/cmsTypography';
import { useLandingCmsEditOptional } from '../../contexts/LandingCmsEditContext';

type Props = {
  value: CmsText;
  as?: ElementType;
  className?: string;
  defaultSizeClass?: string;
  defaultColorClass?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** When set inside an active CMS edit preview, enables click-to-edit inline text. */
  cmsField?: string;
  cmsLabel?: string;
  onCmsChange?: (next: CmsText) => void;
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
  cmsField,
  cmsLabel,
  onCmsChange,
}: Props) {
  const text = children ?? cmsTextPlain(value);
  const ctx = useLandingCmsEditOptional();
  const editable = Boolean(cmsField && onCmsChange && ctx?.editing);
  const registered = useRef(false);

  useEffect(() => {
    if (!editable || !cmsField || !onCmsChange) return;
    const label = cmsLabel ?? cmsField;
    ctx!.registerField(cmsField, { type: 'text', label, value, onChange: onCmsChange });
    registered.current = true;
    return () => {
      registered.current = false;
      ctx!.unregisterField(cmsField);
    };
  }, [editable, cmsField, cmsLabel, value, onCmsChange, ctx]);

  useEffect(() => {
    if (!editable || !cmsField || !onCmsChange) return;
    const label = cmsLabel ?? cmsField;
    ctx!.registerField(cmsField, { type: 'text', label, value, onChange: onCmsChange });
  }, [value, editable, cmsField, cmsLabel, onCmsChange, ctx]);

  const classes = cn(
    resolveCmsTextClasses(value, { sizeClass: defaultSizeClass, colorClass: defaultColorClass }),
    className,
    editable && 'cursor-text rounded-sm outline-none transition-shadow',
    editable &&
      (ctx?.activeFieldId === cmsField
        ? 'ring-2 ring-amber-400 ring-offset-2'
        : 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-amber-400/70'),
  );

  if (!editable) {
    return (
      <Tag style={style} className={classes}>
        {text}
      </Tag>
    );
  }

  return (
    <Tag
      style={style}
      className={classes}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={cmsLabel ?? cmsField}
      onFocus={() => cmsField && ctx?.setActiveFieldId(cmsField)}
      onBlur={(e) => {
        const nextText = e.currentTarget.textContent ?? '';
        if (nextText !== cmsTextPlain(value)) {
          onCmsChange!(patchCmsText(value, { text: nextText }));
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && Tag !== 'p' && Tag !== 'div') {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
    >
      {text}
    </Tag>
  );
}
