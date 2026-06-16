import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import {
  cmsTextPlain,
  cmsTextRaw,
  patchCmsText,
  resolveCmsTextClasses,
  type CmsText,
} from '../../lib/cmsTypography';
import { cmsTextHasHtml, getEditorHtml, sanitizeCmsHtml } from '../../lib/cmsRichText';
import { useLandingCmsEditOptional } from '../../contexts/LandingCmsEditContext';

type Props = {
  value: CmsText;
  as?: ElementType;
  className?: string;
  defaultSizeClass?: string;
  defaultColorClass?: string;
  style?: CSSProperties;
  children?: ReactNode;
  cmsField?: string;
  cmsLabel?: string;
  onCmsChange?: (next: CmsText) => void;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function editorHtmlFromValue(value: CmsText): string {
  const raw = cmsTextRaw(value);
  if (cmsTextHasHtml(raw)) return sanitizeCmsHtml(raw);
  return escapeHtml(cmsTextPlain(value));
}

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
  const plain = children ?? cmsTextPlain(value);
  const ctx = useLandingCmsEditOptional();
  const editable = Boolean(cmsField && onCmsChange && ctx?.editing);
  const elRef = useRef<HTMLElement>(null);
  const focusedRef = useRef(false);
  const onCmsChangeRef = useRef(onCmsChange);
  onCmsChangeRef.current = onCmsChange;

  const registerField = ctx?.registerField;
  const unregisterField = ctx?.unregisterField;

  useEffect(() => {
    if (!editable || !cmsField || !registerField || !unregisterField) return;
    const label = cmsLabel ?? cmsField;
    const onChange = (next: CmsText) => onCmsChangeRef.current?.(next);
    registerField(cmsField, {
      type: 'text',
      label,
      value,
      onChange,
      defaultSizeClass,
    });
    return () => unregisterField(cmsField);
  }, [editable, cmsField, cmsLabel, value, defaultSizeClass, registerField, unregisterField]);

  const syncEditorHtml = (node: HTMLElement | null) => {
    elRef.current = node;
    if (node && editable && !focusedRef.current) {
      node.innerHTML = editorHtmlFromValue(value);
    }
  };

  useEffect(() => {
    if (!editable || focusedRef.current || !elRef.current) return;
    elRef.current.innerHTML = editorHtmlFromValue(value);
  }, [value, editable]);

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
    const raw = cmsTextRaw(value);
    if (!children && cmsTextHasHtml(raw)) {
      return (
        <Tag
          style={style}
          className={classes}
          dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(raw) }}
        />
      );
    }
    return (
      <Tag style={style} className={classes}>
        {plain}
      </Tag>
    );
  }

  const setActiveFieldId = ctx?.setActiveFieldId;
  const registerEditor = ctx?.registerEditor;

  return (
    <Tag
      ref={syncEditorHtml}
      data-cms-field={cmsField}
      style={style}
      className={classes}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={Tag === 'p' || Tag === 'div'}
      aria-label={cmsLabel ?? cmsField}
      onFocus={(e) => {
        focusedRef.current = true;
        if (cmsField) {
          setActiveFieldId?.(cmsField);
          registerEditor?.(cmsField, e.currentTarget);
        }
      }}
      onBlur={(e) => {
        focusedRef.current = false;
        const nextText = getEditorHtml(e.currentTarget);
        const prevRaw = cmsTextRaw(value);
        if (nextText !== prevRaw && nextText !== sanitizeCmsHtml(prevRaw)) {
          onCmsChangeRef.current?.(patchCmsText(value, { text: nextText }));
        }
        if (cmsField) registerEditor?.(cmsField, null);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && Tag !== 'p' && Tag !== 'div') {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      }}
    />
  );
}
