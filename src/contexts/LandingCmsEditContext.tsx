import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CmsText } from '../lib/cmsTypography';

export type CmsTextBinding = {
  type: 'text';
  label: string;
  value: CmsText;
  onChange: (next: CmsText) => void;
};

export type CmsImageBinding = {
  type: 'image';
  label: string;
  value: string;
  onChange: (next: string) => void;
};

type Binding = CmsTextBinding | CmsImageBinding;

type LandingCmsEditContextValue = {
  editing: boolean;
  activeFieldId: string | null;
  setActiveFieldId: (id: string | null) => void;
  registerField: (id: string, binding: Binding) => void;
  unregisterField: (id: string) => void;
  getField: (id: string) => Binding | undefined;
  onPickImage: (fieldId: string, file: File) => void | Promise<void>;
};

const LandingCmsEditContext = createContext<LandingCmsEditContextValue | null>(null);

export function LandingCmsEditProvider({
  editing,
  onPickImage,
  children,
}: {
  editing: boolean;
  onPickImage: (fieldId: string, file: File) => void | Promise<void>;
  children: ReactNode;
}) {
  const [bindings, setBindings] = useState<Record<string, Binding>>({});
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  const registerField = useCallback((id: string, binding: Binding) => {
    setBindings((prev) => (prev[id] === binding ? prev : { ...prev, [id]: binding }));
  }, []);

  const unregisterField = useCallback((id: string) => {
    setBindings((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const getField = useCallback((id: string) => bindings[id], [bindings]);

  const value = useMemo(
    () => ({
      editing,
      activeFieldId,
      setActiveFieldId,
      registerField,
      unregisterField,
      getField,
      onPickImage,
    }),
    [editing, activeFieldId, registerField, unregisterField, getField, onPickImage],
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
