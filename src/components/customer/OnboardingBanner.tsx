import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  BellRing,
  Smartphone,
  X,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { usePushToggle } from '../../hooks/usePushToggle';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const DISMISS_KEY = 'kado_onboard_dismissed';
const NOTIF_DISMISS_KEY = 'kado_notif_banner_dismissed';

function isDismissed(key: string) {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
}
function dismiss(key: string) {
  try { localStorage.setItem(key, '1'); } catch { /* ignore */ }
}

export default function OnboardingBanner() {
  const { status, busy, enable } = usePushToggle('customer');
  const { canInstall, isInstalled, install } = usePWAInstall();

  const [notifVisible, setNotifVisible] = useState(false);
  const [installVisible, setInstallVisible] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [installDone, setInstallDone] = useState(isInstalled);

  useEffect(() => {
    if (isDismissed(DISMISS_KEY)) return;
    if (status !== 'loading') {
      const needsNotif = status === 'idle' && !isDismissed(NOTIF_DISMISS_KEY);
      const needsInstall = !isInstalled && !isDismissed(`${DISMISS_KEY}_install`);
      setNotifVisible(needsNotif);
      setInstallVisible(needsInstall);
    }
  }, [status, isInstalled]);

  const handleEnableNotif = async () => {
    await enable();
    setNotifSuccess(true);
    setTimeout(() => {
      setNotifVisible(false);
      dismiss(NOTIF_DISMISS_KEY);
    }, 2200);
  };

  const handleDismissNotif = () => {
    setNotifVisible(false);
    dismiss(NOTIF_DISMISS_KEY);
  };

  const handleInstall = async () => {
    const result = await install();
    if (result === 'accepted') {
      setInstallDone(true);
      setInstallVisible(false);
      dismiss(`${DISMISS_KEY}_install`);
    }
  };

  const handleDismissInstall = () => {
    setInstallVisible(false);
    dismiss(`${DISMISS_KEY}_install`);
  };

  if (!notifVisible && !installVisible) return null;

  return (
    <AnimatePresence>
      {(notifVisible || installVisible) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="mb-8 grid gap-3 sm:grid-cols-2"
        >
          {/* ── Notifications card ── */}
          <AnimatePresence>
            {notifVisible && (
              <motion.div
                key="notif-card"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.28 }}
                className="relative rounded-2xl border border-kado-red/20 bg-gradient-to-br from-kado-red/5 via-kado-cream/40 to-white overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={handleDismissNotif}
                  className="absolute top-3 right-3 p-1 rounded-full hover:bg-kado-dark/8 text-kado-dark/35 hover:text-kado-dark transition-colors z-10"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${notifSuccess ? 'bg-emerald-100' : 'bg-kado-red/10'}`}>
                      {notifSuccess
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        : <Bell className="w-5 h-5 text-kado-red" />}
                    </div>
                    <div className="min-w-0 flex-1 pr-6">
                      <p className="font-display font-black text-kado-dark text-sm leading-tight">
                        {notifSuccess ? 'Notifications enabled!' : 'Stay in the loop'}
                      </p>
                      <p className="text-[11px] text-kado-dark/55 mt-0.5 leading-relaxed">
                        {notifSuccess
                          ? "We'll notify you when your order is confirmed, brewing, and ready."
                          : 'Get push alerts when your order is confirmed, brewing, and ready for pickup.'}
                      </p>
                    </div>
                  </div>

                  {!notifSuccess && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleEnableNotif()}
                        disabled={busy || status === 'denied'}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-kado-red text-white px-3 py-2.5 text-[10px] font-black uppercase tracking-wider hover:bg-kado-dark transition-colors disabled:opacity-50"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        {busy ? 'Enabling…' : 'Enable alerts'}
                      </button>
                      <Link
                        to="/help/install"
                        className="flex items-center justify-center rounded-xl border border-kado-dark/12 text-kado-dark/60 hover:border-kado-red/30 hover:text-kado-red transition-colors px-3 py-2.5"
                        title="Help"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </Link>
                    </div>
                  )}

                  {status === 'denied' && !notifSuccess && (
                    <p className="mt-2 text-[10px] text-amber-700 leading-snug">
                      Notifications are blocked. Open your browser site settings, allow notifications, then try again.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Install card ── */}
          <AnimatePresence>
            {installVisible && (
              <motion.div
                key="install-card"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.28, delay: 0.06 }}
                className="relative rounded-2xl border border-kado-dark/12 bg-gradient-to-br from-kado-dark/3 via-white to-kado-cream/30 overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={handleDismissInstall}
                  className="absolute top-3 right-3 p-1 rounded-full hover:bg-kado-dark/8 text-kado-dark/35 hover:text-kado-dark transition-colors z-10"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-kado-dark/8">
                      <Smartphone className="w-5 h-5 text-kado-dark/70" />
                    </div>
                    <div className="min-w-0 flex-1 pr-6">
                      <p className="font-display font-black text-kado-dark text-sm leading-tight">Add to home screen</p>
                      <p className="text-[11px] text-kado-dark/55 mt-0.5 leading-relaxed">
                        Install Kado Kohi as an app for faster ordering and push notifications.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {canInstall ? (
                      <button
                        type="button"
                        onClick={() => void handleInstall()}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-kado-dark text-white px-3 py-2.5 text-[10px] font-black uppercase tracking-wider hover:bg-kado-red transition-colors"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        Install app
                      </button>
                    ) : (
                      <Link
                        to="/help/install"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-kado-dark text-white px-3 py-2.5 text-[10px] font-black uppercase tracking-wider hover:bg-kado-red transition-colors"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        How to install
                      </Link>
                    )}
                    <Link
                      to="/help/install"
                      className="flex items-center justify-center rounded-xl border border-kado-dark/12 text-kado-dark/60 hover:border-kado-red/30 hover:text-kado-red transition-colors px-3 py-2.5"
                      title="Installation guide"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
