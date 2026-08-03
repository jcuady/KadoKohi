import { useCallback, useState } from 'react';
import OverlayShell from './OverlayShell';
import { Button } from './button';

export type ConfirmRequest = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Defaults to danger (red) for deletes. */
  tone?: 'danger' | 'default';
};

type Pending = ConfirmRequest & {
  resolve: (ok: boolean) => void;
};

/**
 * In-app confirmation modal (replaces window.confirm).
 * Usage:
 *   const { confirm, confirmDialog } = useConfirmDialog();
 *   if (!(await confirm({ title: 'Delete item?', description: '…' }))) return;
 *   …destructive action…
 *   return (<>…{confirmDialog}</>);
 */
export function useConfirmDialog() {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback((req: ConfirmRequest) => {
    return new Promise<boolean>((resolve) => {
      setPending((prev) => {
        prev?.resolve(false);
        return { ...req, resolve };
      });
    });
  }, []);

  const settle = useCallback((ok: boolean) => {
    setPending((prev) => {
      prev?.resolve(ok);
      return null;
    });
  }, []);

  const confirmDialog = (
    <ConfirmDialog
      open={Boolean(pending)}
      title={pending?.title ?? 'Confirm'}
      description={pending?.description}
      confirmLabel={pending?.confirmLabel}
      cancelLabel={pending?.cancelLabel}
      tone={pending?.tone ?? 'danger'}
      onClose={() => settle(false)}
      onConfirm={() => settle(true)}
    />
  );

  return { confirm, confirmDialog };
}

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/** Stateless confirm modal — prefer useConfirmDialog for most call sites. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onClose,
  onConfirm,
}: DialogProps) {
  return (
    <OverlayShell
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={title}
      surface="dash"
      centered
      size="md"
      showClose={!busy}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose} className="min-h-11">
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'destructive' : 'default'}
            disabled={busy}
            onClick={onConfirm}
            className="min-h-11"
          >
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed dash-muted">
        {description?.trim() ||
          'Are you sure you want to continue? This cannot be undone from this screen.'}
      </p>
    </OverlayShell>
  );
}
