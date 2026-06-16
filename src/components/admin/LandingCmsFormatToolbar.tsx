import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  Bold,
  Italic,
  Underline,
  ImagePlus,
  Settings2,
  Undo2,
  Redo2,
} from 'lucide-react';
import { useLandingCmsEdit } from '../../contexts/LandingCmsEditContext';
import { allowedSizeStepsForDefault, selectionSummary } from '../../lib/cmsRichText';
import {
  CMS_FONT_FAMILIES,
  CMS_TEXT_COLORS,
  CMS_TEXT_SIZES,
  cmsTextColor,
  cmsTextFont,
  cmsTextMarks,
  cmsTextPlain,
  cmsTextSize,
  type CmsFontFamily,
  type CmsTextColor,
  type CmsTextSize,
} from '../../lib/cmsTypography';
import { useLandingContentStore } from '../../store/landingContentStore';

const FONT_TOOLBAR_LABELS: Record<CmsFontFamily, string> = {
  inherit: 'Default',
  display: 'Display',
  body: 'Body',
};

type Props = {
  onAdvancedSettings?: () => void;
  advancedOpen?: boolean;
};

function ToolbarDivider() {
  return <span className="mx-1 h-8 w-px shrink-0 bg-[var(--color-dash-border)]" aria-hidden />;
}

function ToolbarBtn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={[
        'flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-sm transition-colors',
        disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-[var(--color-dash-hover)]',
        active ? 'bg-[var(--color-dash-hover)] text-kado-red' : 'text-[var(--color-dash-text)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function LabeledSelect<T extends string>({
  label,
  value,
  disabled,
  onChange,
  options,
}: {
  label: string;
  value: T;
  disabled?: boolean;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col">
      <label htmlFor={id} className="mb-0.5 px-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-dash-text-muted)]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-8 min-w-[5.5rem] max-w-[8.5rem] truncate rounded-md border border-[var(--color-dash-border)] bg-white px-2 text-xs font-medium text-[var(--color-dash-text)] disabled:opacity-40 sm:max-w-[9.5rem]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ColorPicker({
  disabled,
  activeColor,
  hasInlineSelection,
  onPick,
}: {
  disabled?: boolean;
  activeColor: CmsTextColor;
  hasInlineSelection: boolean;
  onPick: (color: CmsTextColor) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const reposition = () => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({ top: rect.bottom + 6, left: rect.left });
    };
    reposition();
    document.addEventListener('mousedown', close);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  const swatch =
    activeColor === 'inherit'
      ? 'var(--color-dash-text)'
      : (CMS_TEXT_COLORS.find((c) => c.id === activeColor)?.swatch ?? '#191919');

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        title={hasInlineSelection ? 'Color for selection' : 'Text color'}
        aria-label="Text color"
        aria-expanded={open}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex h-8 items-center gap-1.5 rounded-md px-2 text-sm',
          disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-[var(--color-dash-hover)]',
          open ? 'bg-[var(--color-dash-hover)]' : '',
        ].join(' ')}
      >
        <span className="font-serif text-base font-bold leading-none">A</span>
        <span className="h-1.5 w-5 rounded-sm" style={{ background: swatch }} />
      </button>
      {open && !disabled
        ? createPortal(
            <div
              role="listbox"
              aria-label="Brand text colors"
              className="fixed z-[9999] grid grid-cols-4 gap-1.5 rounded-xl border border-[var(--color-dash-border)] bg-white p-2.5 shadow-xl"
              style={{ top: pos.top, left: pos.left }}
            >
              {CMS_TEXT_COLORS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={activeColor === opt.id}
                  title={opt.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(opt.id as CmsTextColor);
                    setOpen(false);
                  }}
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                    activeColor === opt.id
                      ? 'border-kado-red ring-2 ring-kado-red/25'
                      : 'border-transparent hover:border-[var(--color-dash-border)]',
                  ].join(' ')}
                >
                  {opt.id === 'inherit' ? (
                    <span className="text-[9px] font-bold text-[var(--color-dash-text-muted)]">Auto</span>
                  ) : (
                    <span className="h-6 w-6 rounded-full border border-black/10" style={{ background: opt.swatch }} />
                  )}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export default function LandingCmsFormatToolbar({ onAdvancedSettings, advancedOpen }: Props) {
  const { activeFieldId, getField, onPickImage, applyTextFormat, selectionVersion, bindingRevision, getActiveEditor } =
    useLandingCmsEdit();
  const undoDraft = useLandingContentStore((s) => s.undoDraft);
  const redoDraft = useLandingContentStore((s) => s.redoDraft);
  const canUndo = useLandingContentStore((s) => s.undoStack.length > 0);
  const canRedo = useLandingContentStore((s) => s.redoStack.length > 0);
  const imageInputId = useId();

  const binding = useMemo(() => {
    void bindingRevision;
    return activeFieldId ? getField(activeFieldId) : undefined;
  }, [activeFieldId, getField, bindingRevision]);
  const isText = binding?.type === 'text';
  const isImage = binding?.type === 'image';
  const value = isText ? binding.value : undefined;
  const marks = value ? cmsTextMarks(value) : { bold: false, italic: false, underline: false };
  const size = value ? cmsTextSize(value) : 'inherit';
  const color = value ? cmsTextColor(value) : 'inherit';
  const font = value ? cmsTextFont(value) : 'inherit';

  const sizeSteps = useMemo(
    () => allowedSizeStepsForDefault(isText ? binding.defaultSizeClass : undefined),
    [isText, binding],
  );

  const sizeOptions = useMemo(
    () =>
      CMS_TEXT_SIZES.filter((opt) => opt.id === 'inherit' || sizeSteps.includes(opt.id)).map((opt) => ({
        value: opt.id,
        label: opt.id === 'inherit' ? 'Default' : opt.label.replace(/ \(.*\)/, ''),
      })),
    [sizeSteps],
  );

  const fontOptions = useMemo(
    () =>
      CMS_FONT_FAMILIES.map((opt) => ({
        value: opt.id,
        label: FONT_TOOLBAR_LABELS[opt.id],
      })),
    [],
  );

  const hasInlineSelection = useMemo(() => {
    if (!isText) return false;
    void selectionVersion;
    const editor = getActiveEditor();
    if (!editor) return false;
    const summary = selectionSummary(editor);
    return summary.hasRange && !summary.collapsed;
  }, [isText, selectionVersion, getActiveEditor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (target?.isContentEditable) return;
      e.preventDefault();
      if (e.shiftKey) {
        if (canRedo) redoDraft();
      } else if (canUndo) {
        undoDraft();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [canUndo, canRedo, undoDraft, redoDraft]);

  const formatTarget = hasInlineSelection ? 'highlighted text' : isText ? 'whole field' : '';

  return (
    <div className="relative z-30 border-b border-[var(--color-dash-border)] bg-[#f8f9fa] px-2 py-2 sm:px-3">
      <div className="flex flex-wrap items-end gap-x-1 gap-y-2">
        <div className="flex items-center gap-0.5 self-end">
          <ToolbarBtn disabled={!canUndo} title="Undo (Ctrl+Z)" onClick={() => undoDraft()}>
            <Undo2 className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" onClick={() => redoDraft()}>
            <Redo2 className="h-4 w-4" />
          </ToolbarBtn>
        </div>

        <ToolbarDivider />

        <LabeledSelect
          label="Font"
          value={font}
          disabled={!isText}
          options={fontOptions}
          onChange={(v) => applyTextFormat({ font: v })}
        />

        <LabeledSelect
          label="Size"
          value={size}
          disabled={!isText}
          options={sizeOptions}
          onChange={(v) => applyTextFormat({ size: v as CmsTextSize })}
        />

        <ToolbarDivider />

        <div className="flex flex-col self-end">
          <span className="mb-0.5 px-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-dash-text-muted)]">
            Style
          </span>
          <div className="flex items-center rounded-md border border-[var(--color-dash-border)] bg-white">
            <ToolbarBtn
              active={marks.bold}
              disabled={!isText}
              title={hasInlineSelection ? 'Bold selection' : 'Bold'}
              onClick={() => applyTextFormat({ bold: !marks.bold })}
            >
              <Bold className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn
              active={marks.italic}
              disabled={!isText}
              title={hasInlineSelection ? 'Italic selection' : 'Italic'}
              onClick={() => applyTextFormat({ italic: !marks.italic })}
            >
              <Italic className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn
              active={marks.underline}
              disabled={!isText}
              title={hasInlineSelection ? 'Underline selection' : 'Underline'}
              onClick={() => applyTextFormat({ underline: !marks.underline })}
            >
              <Underline className="h-4 w-4" />
            </ToolbarBtn>
            <ColorPicker
              disabled={!isText}
              activeColor={color}
              hasInlineSelection={hasInlineSelection}
              onPick={(c) => applyTextFormat({ color: c })}
            />
          </div>
        </div>

        <ToolbarDivider />

        <div className="flex flex-col self-end">
          <span className="mb-0.5 px-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-dash-text-muted)]">
            Image
          </span>
          <ToolbarBtn
            disabled={!isImage || !activeFieldId}
            title="Replace image"
            onClick={() => document.getElementById(imageInputId)?.click()}
          >
            <ImagePlus className="h-4 w-4" />
          </ToolbarBtn>
        </div>
        <input
          id={imageInputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && activeFieldId) void onPickImage(activeFieldId, file);
            e.target.value = '';
          }}
        />

        {onAdvancedSettings ? (
          <>
            <ToolbarDivider />
            <div className="flex flex-col self-end">
              <span className="mb-0.5 px-0.5 text-[9px] font-bold uppercase tracking-wider text-transparent select-none">
                ·
              </span>
              <ToolbarBtn
                active={advancedOpen}
                title="Section settings (paths, slides, products)"
                onClick={onAdvancedSettings}
              >
                <Settings2 className="h-4 w-4" />
              </ToolbarBtn>
            </div>
          </>
        ) : null}

        <div className="ml-auto flex min-w-0 max-w-full flex-col items-end gap-0.5 pl-2 sm:max-w-[42%]">
          {hasInlineSelection ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">
              Selection mode
            </span>
          ) : null}
          {binding ? (
            <p className="max-w-full truncate text-right text-[10px] font-medium text-[var(--color-dash-text-muted)]">
              <span className="font-bold text-[var(--color-dash-text)]">{binding.label}</span>
              {formatTarget ? <span className="hidden sm:inline"> · {formatTarget}</span> : null}
              {isText && value && !hasInlineSelection ? (
                <span className="hidden md:inline"> · {cmsTextPlain(value).slice(0, 36)}</span>
              ) : null}
            </p>
          ) : (
            <p className="text-[10px] text-[var(--color-dash-text-muted)]">Click text or an image in the preview</p>
          )}
        </div>
      </div>
    </div>
  );
}
