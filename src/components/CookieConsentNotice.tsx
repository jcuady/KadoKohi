import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

type Props = {
  message: string | null;
  onDismiss: () => void;
};

/** Brief confirmation after the visitor saves cookie preferences. */
export default function CookieConsentNotice({ message, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          key="cookie-notice"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="fixed z-[201] top-[max(4.5rem,calc(3.5rem+env(safe-area-inset-top)))] left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] sm:left-auto sm:max-w-sm pointer-events-auto"
        >
          <div className="flex items-start gap-3 rounded-sm border border-kado-red/30 bg-kado-cream px-4 py-3 shadow-lg shadow-kado-dark/15">
            <p className="flex-1 text-sm font-medium leading-snug text-kado-dark">{message}</p>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded-sm p-1 text-kado-dark/50 hover:text-kado-red focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-red"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
