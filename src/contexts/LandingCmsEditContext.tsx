import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  applyInlineFormatToSelection,
  clampSizeToRole,
  getEditorHtml,
  selectionSummary,
  toggleInlineMarkOnSelection,
  type InlineFormat,
} from '../lib/cmsRichText';
import {
  patchCmsText,
  type CmsFontFamily,
  type CmsText,
  type CmsTextColor,
  type CmsTextSize,
} from '../lib/cmsTypography';

export type CmsTextBinding = {
  type: 'text';
  label: string;
  value: CmsText;
  onChange: (next: CmsText) => void;
  defaultSizeClass?: string;
};

export type CmsImageBinding = {
  type: 'image';
  label: string;
  value: string;
  onChange: (next: string) => void;
};

type Binding = CmsTextBinding | CmsImageBinding;

export type CmsTextFormatPatch = {
  text?: string;
  size?: CmsTextSize;
  color?: CmsTextColor;
  font?: CmsFontFamily;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

type LandingCmsEditContextValue = {
  editing: boolean;
  activeFieldId: string | null;
  setActiveFieldId: (id: string | null) => void;
  registerField: (id: string, binding: Binding) => void;
  unregisterField: (id: string) => void;
  getField: (id: string) => Binding | undefined;
  registerEditor: (id: string, el: HTMLElement | null) => void;
  getActiveEditor: () => HTMLElement | undefined;
  bindingRevision: number;
  selectionVersion: number;
  applyTextFormat: (patch: CmsTextFormatPatch) => void;
  onPickImage: (fieldId: string, file: File) => void | Promise<void>;
};

const LandingCmsEditContext = createContext<LandingCmsEditContextValue | null>(null);

function cmsTextKey(value: CmsText): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function bindingsEqual(a: Binding, b: Binding): boolean {
  if (a.type !== b.type || a.label !== b.label) return false;
  if (a.type === 'image' && b.type === 'image') return a.value === b.value;
  if (a.type === 'text' && b.type === 'text') {
    return a.defaultSizeClass === b.defaultSizeClass && cmsTextKey(a.value) === cmsTextKey(b.value);
  }
  return false;
}

export function LandingCmsEditProvider({
  editing,
  onPickImage,
  children,
}: {
  editing: boolean;
  onPickImage: (fieldId: string, file: File) => void | Promise<void>;
  children: ReactNode;
}) {
  const bindingsRef = useRef<Record<string, Binding>>({});
  const activeFieldIdRef = useRef<string | null>(null);
  const [activeFieldId, setActiveFieldIdState] = useState<string | null>(null);
  const [bindingRevision, setBindingRevision] = useState(0);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const editorsRef = useRef<Map<string, HTMLElement>>(new Map());
  const lastSelectionKeyRef = useRef('');
  const onPickImageRef = useRef(onPickImage);
  onPickImageRef.current = onPickImage;

  const setActiveFieldId = useCallback((id: string | null) => {
    activeFieldIdRef.current = id;
    setActiveFieldIdState(id);
  }, []);

  const registerField = useCallback((id: string, binding: Binding) => {
    const prev = bindingsRef.current[id];
    if (prev && bindingsEqual(prev, binding)) {
      bindingsRef.current[id] = binding;
      return;
    }
    bindingsRef.current[id] = binding;
    if (id === activeFieldIdRef.current) {
      setBindingRevision((v) => v + 1);
    }
  }, []);

  const unregisterField = useCallback((id: string) => {
    if (!(id in bindingsRef.current)) return;
    delete bindingsRef.current[id];
    editorsRef.current.delete(id);
    if (id === activeFieldIdRef.current) {
      setBindingRevision((v) => v + 1);
    }
  }, []);

  const getField = useCallback((id: string) => bindingsRef.current[id], []);

  const registerEditor = useCallback((id: string, el: HTMLElement | null) => {
    if (el) editorsRef.current.set(id, el);
    else editorsRef.current.delete(id);
  }, []);

  useEffect(() => {
    if (!editing) {
      bindingsRef.current = {};
      editorsRef.current.clear();
      activeFieldIdRef.current = null;
      setActiveFieldIdState(null);
      lastSelectionKeyRef.current = '';
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const bump = () => {
      const fieldId = activeFieldIdRef.current;
      if (!fieldId) return;
      const editor = editorsRef.current.get(fieldId);
      if (!editor) return;
      const summary = selectionSummary(editor);
      const key = `${summary.collapsed}:${summary.text}`;
      if (key === lastSelectionKeyRef.current) return;
      lastSelectionKeyRef.current = key;
      setSelectionVersion((v) => v + 1);
    };
    document.addEventListener('selectionchange', bump);
    return () => document.removeEventListener('selectionchange', bump);
  }, [editing]);

  const getActiveEditor = useCallback(() => {
    const fieldId = activeFieldIdRef.current;
    if (!fieldId) return undefined;
    return editorsRef.current.get(fieldId);
  }, []);

  const applyTextFormat = useCallback((patch: CmsTextFormatPatch) => {
    const fieldId = activeFieldIdRef.current;
    if (!fieldId) return;
    const binding = bindingsRef.current[fieldId];
    if (!binding || binding.type !== 'text') return;

    const editor = editorsRef.current.get(fieldId);
    const summary = editor ? selectionSummary(editor) : { hasRange: false, collapsed: true, text: '' };
    const inlineSelection = Boolean(editor && summary.hasRange && !summary.collapsed);

    if (inlineSelection && editor) {
      editor.focus();

      if (patch.bold !== undefined) {
        toggleInlineMarkOnSelection(editor, 'bold');
      } else if (patch.italic !== undefined) {
        toggleInlineMarkOnSelection(editor, 'italic');
      } else if (patch.underline !== undefined) {
        toggleInlineMarkOnSelection(editor, 'underline');
      } else {
        const inline: Partial<InlineFormat> = {};
        if (patch.color && patch.color !== 'inherit') inline.color = patch.color;
        if (patch.font && patch.font !== 'inherit') inline.font = patch.font;
        if (patch.size && patch.size !== 'inherit') {
          inline.size = clampSizeToRole(patch.size, binding.defaultSizeClass);
        }
        if (Object.keys(inline).length > 0) applyInlineFormatToSelection(editor, inline);
      }

      binding.onChange(patchCmsText(binding.value, { text: getEditorHtml(editor) }));
      setBindingRevision((v) => v + 1);
      setSelectionVersion((v) => v + 1);
      return;
    }

    const fieldPatch = { ...patch };
    if (fieldPatch.size && fieldPatch.size !== 'inherit') {
      fieldPatch.size = clampSizeToRole(fieldPatch.size, binding.defaultSizeClass);
    }
    binding.onChange(patchCmsText(binding.value, fieldPatch));
    setBindingRevision((v) => v + 1);
  }, []);

  const stableOnPickImage = useCallback((fieldId: string, file: File) => {
    return onPickImageRef.current(fieldId, file);
  }, []);

  const value = useMemo(
    () => ({
      editing,
      activeFieldId,
      setActiveFieldId,
      registerField,
      unregisterField,
      getField,
      registerEditor,
      getActiveEditor,
      bindingRevision,
      selectionVersion,
      applyTextFormat,
      onPickImage: stableOnPickImage,
    }),
    [
      editing,
      activeFieldId,
      registerField,
      unregisterField,
      getField,
      registerEditor,
      getActiveEditor,
      bindingRevision,
      selectionVersion,
      applyTextFormat,
      stableOnPickImage,
    ],
  );

  return <LandingCmsEditContext.Provider value={value}>{children}</LandingCmsEditContext.Provider>;
}

export function useLandingCmsEdit() {
  const ctx = useContext(LandingCmsEditContext);
  if (!ctx) {
    throw new Error('useLandingCmsEdit must be used within LandingCmsEditProvider');
  }
  return ctx;
}

export function useLandingCmsEditOptional() {
  return useContext(LandingCmsEditContext);
}
