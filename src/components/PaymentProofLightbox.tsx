import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type TouchEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

type PaymentProofLightboxProps = {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  subtitle?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pinchDistance(touches: TouchList) {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

export default function PaymentProofLightbox({
  open,
  onClose,
  imageUrl,
  title = 'Payment proof',
  subtitle,
}: PaymentProofLightboxProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);

  scaleRef.current = scale;
  offsetRef.current = offset;

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const applyScale = useCallback((next: number) => {
    const clamped = clamp(Number(next.toFixed(2)), MIN_SCALE, MAX_SCALE);
    setScale(clamped);
    if (clamped <= 1) setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!open) return;
    resetView();
  }, [open, imageUrl, resetView]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const zoomBy = (delta: number) => {
    applyScale(scaleRef.current + delta);
  };

  useEffect(() => {
    const el = viewportRef.current;
    if (!open || !el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      applyScale(scaleRef.current + delta);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinchRef.current) return;
      e.preventDefault();
      const dist = pinchDistance(e.touches);
      if (!dist || !pinchRef.current.dist) return;
      applyScale(pinchRef.current.scale * (dist / pinchRef.current.dist));
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [open, applyScale]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (scaleRef.current <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offsetRef.current.x,
      oy: offsetRef.current.y,
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.x),
      y: dragRef.current.oy + (e.clientY - dragRef.current.y),
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      pinchRef.current = { dist: pinchDistance(e.touches), scale: scaleRef.current };
    }
  };

  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) pinchRef.current = null;
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{title}</p>
          {subtitle ? <p className="truncate text-xs text-white/60">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => zoomBy(-0.25)}
            disabled={scale <= MIN_SCALE}
            className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-40"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="min-w-[3rem] text-center text-xs font-bold tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => zoomBy(0.25)}
            disabled={scale >= MAX_SCALE}
            className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-40"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="rounded-lg p-2 hover:bg-white/10"
            title="Reset zoom"
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-1 rounded-lg p-2 hover:bg-white/10"
            title="Close"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden touch-none"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ cursor: scale > 1 ? 'grab' : 'zoom-in' }}
      >
        <img
          src={imageUrl}
          alt={title}
          draggable={false}
          className="max-h-[85vh] max-w-[95vw] select-none object-contain"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
          onDoubleClick={() => {
            if (scaleRef.current > 1) resetView();
            else applyScale(2);
          }}
        />
      </div>

      <p className="shrink-0 px-4 py-2 text-center text-[10px] text-white/50">
        Scroll or pinch to zoom · drag when zoomed · double-tap to toggle · Esc to close
      </p>
    </div>,
    document.body,
  );
}
