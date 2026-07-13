import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode, AlertCircle } from 'lucide-react';
import { formatPhp } from '../lib/money';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

type Props = {
  open: boolean;
  onClose: () => void;
  shortCode: string;
  total: number;
  qrImageUrl: string;
  /** Primary button label (default: Close) */
  actionLabel?: string;
};

export default function GcashQrModal({
  open,
  onClose,
  shortCode,
  total,
  qrImageUrl,
  actionLabel = 'Close',
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

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="gcash-qr-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gcash-qr-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-kado-dark/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            className="w-full max-w-md max-h-[min(92dvh,720px)] flex flex-col rounded-t-[1.75rem] sm:rounded-[1.75rem] bg-kado-offwhite border border-kado-dark/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-kado-dark/10 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <QrCode className="w-5 h-5 text-kado-red shrink-0" />
                <h2 id="gcash-qr-title" className="font-display font-bold text-base sm:text-lg text-kado-dark truncate">
                  Pay with GCash
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-kado-dark/50 hover:bg-kado-dark/8 hover:text-kado-dark touch-manipulation"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 sm:py-6 text-center space-y-4">
              <p className="text-sm text-kado-dark/60 leading-relaxed">
                Order <span className="font-bold text-kado-dark">{shortCode}</span>
                <br className="sm:hidden" />
                <span className="hidden sm:inline"> · </span>
                Pay <span className="font-display font-bold text-kado-red">{formatPhp(total)}</span>
              </p>

              {qrImageUrl ? (
                <div className="mx-auto w-full max-w-[min(280px,72vw)] aspect-square rounded-2xl border-2 border-kado-dark/10 bg-white p-3 sm:p-4 shadow-inner">
                  <img
                    src={qrImageUrl}
                    alt="GCash QR code — scan to pay"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="mx-auto w-full max-w-[min(280px,72vw)] aspect-square rounded-2xl border-2 border-dashed border-amber-300/80 bg-amber-50/50 flex flex-col items-center justify-center gap-2 p-4 sm:p-6">
                  <AlertCircle className="w-8 h-8 text-amber-600 shrink-0" />
                  <p className="text-xs sm:text-sm text-kado-dark/55 font-medium leading-relaxed">
                    GCash QR is not set up yet. Please ask the barista or try again later.
                  </p>
                </div>
              )}

              <ol className="text-left text-xs text-kado-dark/55 space-y-2 max-w-sm mx-auto list-decimal list-inside leading-relaxed px-1">
                <li>Scan the QR and pay the exact total shown above.</li>
                <li>Save your GCash receipt screenshot.</li>
                <li>Upload proof on this order, then wait for staff to confirm payment.</li>
              </ol>
            </div>

            <div className="shrink-0 px-4 sm:px-6 py-4 border-t border-kado-dark/10 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[48px] rounded-2xl bg-kado-red text-kado-cream py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors touch-manipulation"
              >
                {actionLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
