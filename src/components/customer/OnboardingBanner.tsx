import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { BellRing, CheckCircle2, Smartphone, X } from 'lucide-react';
import { usePushToggle } from '../../hooks/usePushToggle';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const NOTIF_DISMISS_KEY = 'kado_notif_banner_dismissed';
const INSTALL_DISMISS_KEY = 'kado_install_banner_dismissed';

function isDismissed(key: string) {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}
function dismiss(key: string) {
  try {
    localStorage.setItem(key, '1');
  } catch {
    /* ignore */
  }
}

type Props = {
  isNewUser?: boolean;
};

/** Compact account-shell prompts — single-row actions, not stacked marketing cards. */
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
    window.setTimeout(() => {
      setNotifVisible(false);
      dismiss(NOTIF_DISMISS_KEY);
    }, 1800);
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

  if (!notifVisible && !installVisible) return null;

  return (
    <div className="space-y-2" role="region" aria-label="Setup tips">
      {isNewUser ? (
        <p className="rounded-xl bg-kado-red/8 px-3 py-2 text-[11px] font-semibold leading-snug text-kado-dark/70">
          Welcome — enable alerts and install for the full app experience.
        </p>
      ) : null}

      <AnimatePresence initial={false}>
        {notifVisible ? (
          <motion.div
            key="notif"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2.5 rounded-2xl border border-kado-red/15 bg-white px-3 py-2.5">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  notifSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-kado-red/10 text-kado-red'
                }`}
              >
                {notifSuccess ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                ) : (
                  <BellRing className="h-4 w-4" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-kado-dark leading-tight">
                  {notifSuccess ? 'Alerts on' : 'Order alerts'}
                </p>
                <p className="text-[11px] text-kado-dark/50 leading-snug line-clamp-1 sm:line-clamp-2">
                  {notifSuccess
                    ? 'We’ll ping you when it’s brewing and ready.'
                    : status === 'denied'
                      ? 'Blocked in browser settings — allow notifications, then retry.'
                      : status === 'unsupported'
                        ? 'Install the app for reliable push.'
                        : 'Know when your drink is ready.'}
                </p>
              </div>
              {!notifSuccess ? (
                status === 'unsupported' ? (
                  <Link
                    to="/help/install"
                    className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full bg-kado-red px-3.5 text-[10px] font-black uppercase tracking-wider text-kado-cream hover:bg-kado-dark touch-manipulation"
                  >
                    Guide
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleEnableNotif()}
                    disabled={busy || status === 'denied'}
                    className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full bg-kado-red px-3.5 text-[10px] font-black uppercase tracking-wider text-kado-cream hover:bg-kado-dark disabled:opacity-45 touch-manipulation cursor-pointer"
                  >
                    {busy ? '…' : 'Enable'}
                  </button>
                )
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setNotifVisible(false);
                  dismiss(NOTIF_DISMISS_KEY);
                }}
                className="inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full text-kado-dark/35 hover:bg-kado-dark/5 hover:text-kado-dark touch-manipulation cursor-pointer"
                aria-label="Dismiss notification tip"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </motion.div>
        ) : null}

        {installVisible ? (
          <motion.div
            key="install"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2.5 rounded-2xl border border-kado-dark/10 bg-white px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-kado-dark/6 text-kado-dark/70">
                <Smartphone className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-kado-dark leading-tight">Install app</p>
                <p className="text-[11px] text-kado-dark/50 leading-snug line-clamp-1 sm:line-clamp-2">
                  Home-screen icon · faster orders · better alerts
                </p>
              </div>
              {canInstall ? (
                <button
                  type="button"
                  onClick={() => void handleInstall()}
                  className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full bg-kado-dark px-3.5 text-[10px] font-black uppercase tracking-wider text-kado-cream hover:bg-kado-red touch-manipulation cursor-pointer"
                >
                  Install
                </button>
              ) : (
                <Link
                  to="/help/install"
                  className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full bg-kado-dark px-3.5 text-[10px] font-black uppercase tracking-wider text-kado-cream hover:bg-kado-red touch-manipulation"
                >
                  How
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setInstallVisible(false);
                  dismiss(INSTALL_DISMISS_KEY);
                }}
                className="inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full text-kado-dark/35 hover:bg-kado-dark/5 hover:text-kado-dark touch-manipulation cursor-pointer"
                aria-label="Dismiss install tip"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
