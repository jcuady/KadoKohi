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
  Sparkles,
} from 'lucide-react';
import { usePushToggle } from '../../hooks/usePushToggle';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const NOTIF_DISMISS_KEY = 'kado_notif_banner_dismissed';
const INSTALL_DISMISS_KEY = 'kado_install_banner_dismissed';

function isDismissed(key: string) {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
}
function dismiss(key: string) {
  try { localStorage.setItem(key, '1'); } catch { /* ignore */ }
}

type Props = {
  isNewUser?: boolean;
};

export default function OnboardingBanner({ isNewUser = false }: Props) {
  const { status, busy, enable } = usePushToggle('customer');
  const { canInstall, isInstalled, install } = usePWAInstall();

  const [notifVisible, setNotifVisible] = useState(false);
  const [installVisible, setInstallVisible] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    const needsNotif = status === 'idle' && (!isDismissed(NOTIF_DISMISS_KEY) || isNewUser);
    const needsInstall = !isInstalled && (!isDismissed(INSTALL_DISMISS_KEY) || isNewUser);
    setNotifVisible(needsNotif);
    setInstallVisible(needsInstall);
  }, [status, isInstalled, isNewUser]);

  const handleEnableNotif = async () => {
    const ok = await enable();
    if (!ok) return;
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
      setInstallVisible(false);
      dismiss(INSTALL_DISMISS_KEY);
      return;
    }
    if (result === 'unavailable') {
      window.location.href = '/help/install';
    }
  };

  const handleDismissInstall = () => {
    setInstallVisible(false);
    dismiss(INSTALL_DISMISS_KEY);
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
          className="space-y-3"
        >
          {isNewUser && (
            <div className="flex items-center gap-2 rounded-xl bg-kado-red/8 border border-kado-red/15 px-4 py-2.5">
              <Sparkles className="w-4 h-4 text-kado-red shrink-0" />
              <p className="text-[11px] font-bold text-kado-dark/70">
                Account created — set up notifications and install the app to get the full Kado Kohi experience.
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
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
                    aria-label="Dismiss notification prompt"
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
                          {notifSuccess ? 'Notifications enabled!' : 'Turn on order alerts'}
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
                          disabled={busy || status === 'denied' || status === 'unsupported'}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-kado-red text-white px-3 py-2.5 text-[10px] font-black uppercase tracking-wider hover:bg-kado-dark transition-colors disabled:opacity-50"
                        >
                          <BellRing className="w-3.5 h-3.5" />
                          {busy ? 'Enabling…' : 'Enable alerts'}
                        </button>
                        <Link
                          to="/help/install"
                          className="flex items-center justify-center rounded-xl border border-kado-dark/12 text-kado-dark/60 hover:border-kado-red/30 hover:text-kado-red transition-colors px-3 py-2.5"
                          title="Setup help"
                          aria-label="Open setup help"
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
                    {status === 'unsupported' && !notifSuccess && (
                      <p className="mt-2 text-[10px] text-kado-dark/50 leading-snug">
                        Push is not supported here. Install the app first — see the guide for steps.
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
                    aria-label="Dismiss install prompt"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-kado-dark/8">
                        <Smartphone className="w-5 h-5 text-kado-dark/70" />
                      </div>
                      <div className="min-w-0 flex-1 pr-6">
                        <p className="font-display font-black text-kado-dark text-sm leading-tight">Install on your device</p>
                        <p className="text-[11px] text-kado-dark/55 mt-0.5 leading-relaxed">
                          Add Kado Kohi to your home screen for faster ordering and reliable push notifications.
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
                        aria-label="Open installation guide"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
