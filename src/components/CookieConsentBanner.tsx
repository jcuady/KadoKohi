import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { CookieConsentChoice } from '../lib/cookieConsent';

type Props = {
  open: boolean;
  onDecide: (choice: CookieConsentChoice) => void;
};

export default function CookieConsentBanner({ open, onDecide }: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          key="cookie-consent"
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-desc"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="fixed z-[200] bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] sm:right-auto sm:max-w-md pointer-events-auto"
        >
          <div className="rounded-sm border border-kado-cream/25 bg-kado-dark text-kado-cream shadow-2xl shadow-black/40 p-5 sm:p-6">
            <h2 id="cookie-consent-title" className="font-display text-2xl sm:text-[1.65rem] font-bold leading-tight">
              Cookies
            </h2>
            <p id="cookie-consent-desc" className="mt-3 text-sm leading-relaxed text-kado-cream/90">
              This site uses cookies and local storage to run your cart, keep you signed in, and remember your
              preferences. Optional cookies help us improve the site. Learn more in our{' '}
              <Link
                to="/legal/privacy#cookies"
                className="font-semibold underline underline-offset-2 decoration-kado-cream/70 hover:text-white hover:decoration-white"
              >
                Privacy Policy
              </Link>
              , including how you can change your settings (RA 10173).
            </p>
            <div className="mt-5 grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onDecide('accepted')}
                className="min-h-[44px] rounded-sm border border-kado-cream px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-kado-cream transition-colors hover:bg-kado-cream hover:text-kado-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark"
              >
                I accept cookies
              </button>
              <button
                type="button"
                onClick={() => onDecide('rejected')}
                className="min-h-[44px] rounded-sm border border-kado-cream px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-kado-cream transition-colors hover:bg-kado-cream hover:text-kado-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-kado-cream focus-visible:ring-offset-2 focus-visible:ring-offset-kado-dark"
              >
                I refuse cookies
              </button>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
