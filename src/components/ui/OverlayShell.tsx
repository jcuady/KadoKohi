import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import {
  OVERLAY_CLOSE,
  OVERLAY_HEADER,
  OVERLAY_HOST,
  OVERLAY_HOST_CENTER,
  OVERLAY_PANEL_DASH_LG,
  OVERLAY_PANEL_DASH_MD,
  OVERLAY_PANEL_DASH_XL,
  OVERLAY_PANEL_LG,
  OVERLAY_PANEL_MD,
  OVERLAY_PANEL_XL,
} from '../../lib/overlayTheme';
import { cn } from '../../lib/utils';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

type Size = 'md' | 'lg' | 'xl';
type Surface = 'brand' | 'dash';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Footer slot (CTAs). */
  footer?: ReactNode;
  size?: Size;
  surface?: Surface;
  /** Centered on mobile too (forms); default is bottom-sheet on mobile. */
  centered?: boolean;
  zClass?: string;
  labelledBy?: string;
  /** Hide default header chrome when title is omitted and this is false. */
  showClose?: boolean;
  className?: string;
  panelClassName?: string;
};

const PANEL: Record<Surface, Record<Size, string>> = {
  brand: { md: OVERLAY_PANEL_MD, lg: OVERLAY_PANEL_LG, xl: OVERLAY_PANEL_XL },
  dash: { md: OVERLAY_PANEL_DASH_MD, lg: OVERLAY_PANEL_DASH_LG, xl: OVERLAY_PANEL_DASH_XL },
};

/**
 * Canonical modal shell — scrim, radius, close, and optional footer.
 * Prefer this for new/simple modals; animated drawers can reuse overlayTheme classes.
 */
export default function OverlayShell({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  surface = 'brand',
  centered = false,
  zClass = 'z-[200]',
  labelledBy,
  showClose = true,
  className,
  panelClassName,
}: Props) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const titleId = labelledBy ?? (typeof title === 'string' ? 'overlay-shell-title' : undefined);

  return (
    <div
      className={cn(centered ? OVERLAY_HOST_CENTER : OVERLAY_HOST, zClass, className)}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(PANEL[surface][size], panelClassName)}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showClose) && (
          <div className={OVERLAY_HEADER}>
            <div className="min-w-0 pr-2">
              {title ? (
                <h2 id={titleId} className="font-display text-lg font-bold text-kado-dark sm:text-xl truncate">
                  {title}
                </h2>
              ) : null}
              {subtitle ? <p className="mt-0.5 text-xs text-kado-dark/55">{subtitle}</p> : null}
            </div>
            {showClose ? (
              <button type="button" onClick={onClose} className={OVERLAY_CLOSE} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
        {footer ? <div className="shrink-0 border-t border-kado-dark/5 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</div> : null}
      </div>
    </div>
  );
}
