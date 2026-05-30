import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Smartphone,
  Share2,
  MoreVertical,
  Plus,
  Chrome,
  ArrowLeft,
  CheckCircle2,
  Bell,
  BellRing,
  Zap,
  WifiOff,
  Coffee,
  ArrowRight,
  Download,
  AlertCircle,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { usePushToggle } from '../hooks/usePushToggle';

type OSTab = 'android' | 'ios';

const ANDROID_STEPS = [
  {
    icon: Chrome,
    title: 'Open in Chrome',
    body: 'Make sure you are using the Chrome browser on your Android device. Other browsers may not support installation.',
    tip: 'Chrome comes pre-installed on most Android phones.',
  },
  {
    icon: MoreVertical,
    title: 'Tap the three-dot menu',
    body: 'In the top-right corner of Chrome, tap the ⋮ (three-dot) menu icon.',
    tip: null,
  },
  {
    icon: Plus,
    title: 'Tap "Add to Home screen"',
    body: 'Scroll down the menu and select "Add to Home screen". A dialog will appear asking you to name the app.',
    tip: 'You may also see "Install app" depending on your Chrome version.',
  },
  {
    icon: CheckCircle2,
    title: 'Confirm and install',
    body: 'Tap "Add" in the dialog. Kado Kohi will appear on your home screen like a native app.',
    tip: null,
  },
];

const IOS_STEPS = [
  {
    icon: Smartphone,
    title: 'Open in Safari',
    body: 'On iPhone or iPad, you must use Safari to install PWAs. Chrome and other browsers on iOS do not support installation.',
    tip: 'Look for the blue compass icon — that is Safari.',
  },
  {
    icon: Share2,
    title: 'Tap the Share button',
    body: 'At the bottom of the screen, tap the Share icon (a box with an upward arrow). On iPad, it is at the top.',
    tip: null,
  },
  {
    icon: Plus,
    title: 'Tap "Add to Home Screen"',
    body: 'Scroll down in the Share sheet until you see "Add to Home Screen" and tap it.',
    tip: "If you don't see it, scroll right in the middle row of icons.",
  },
  {
    icon: CheckCircle2,
    title: 'Confirm and add',
    body: 'Edit the name if you like, then tap "Add" in the top-right corner. Kado Kohi appears on your home screen.',
    tip: null,
  },
];

const BENEFITS = [
  { icon: Zap, title: 'Fast ordering', body: 'Opens instantly — no browser bar, no loading.' },
  { icon: Bell, title: 'Push notifications', body: 'Know the moment your order is ready.' },
  { icon: WifiOff, title: 'Works offline', body: 'Browse the menu even without internet.' },
  { icon: Coffee, title: 'Native feel', body: 'Looks and feels like an app — not a website.' },
];

export default function HelpInstall() {
  const [tab, setTab] = useState<OSTab>('android');
  const { canInstall, isInstalled, install } = usePWAInstall();
  const { status: pushStatus, busy: pushBusy, enable: enablePush } = usePushToggle('customer');

  const steps = tab === 'android' ? ANDROID_STEPS : IOS_STEPS;

  return (
    <div className="min-h-screen bg-kado-offwhite font-sans selection:bg-kado-red selection:text-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-kado-dark/10 bg-kado-cream/90 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            to="/account"
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-kado-dark/50 hover:text-kado-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to account</span>
          </Link>
          <div className="flex-1 flex justify-center">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-kado-red text-white flex items-center justify-center font-display font-bold rounded-sm text-base">
                角
              </div>
              <img
                src="/logo/Logo1.png"
                alt="Kado Kohi"
                className="h-7 w-auto object-contain mix-blend-multiply contrast-[1.08]"
              />
            </Link>
          </div>
          <div className="w-24 hidden sm:block" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 sm:py-14">
        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-kado-red/10 border border-kado-red/20 px-4 py-1.5 mb-6">
            <Smartphone className="w-3.5 h-3.5 text-kado-red" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red">App Setup Guide</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-kado-dark tracking-tight mb-4 leading-[1.1]">
            Install Kado Kohi<br />
            <span className="text-kado-red">on your phone.</span>
          </h1>
          <p className="text-base text-kado-dark/55 max-w-md mx-auto leading-relaxed font-medium">
            Add Kado Kohi to your home screen in seconds. No App Store needed — it's faster,
            works offline, and sends you push notifications when your order is ready.
          </p>

          {/* Direct install if available */}
          {canInstall && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-6 inline-flex flex-col items-center gap-2"
            >
              <button
                type="button"
                onClick={() => void install()}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-kado-red text-white px-8 py-4 text-sm font-black uppercase tracking-wider hover:bg-kado-dark transition-colors shadow-lg shadow-kado-red/20"
              >
                <Download className="w-5 h-5" />
                Install Kado Kohi now
              </button>
              <p className="text-[11px] text-kado-dark/40 font-medium">Your browser supports direct install ↑</p>
            </motion.div>
          )}

          {isInstalled && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-5 py-2.5 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              Kado Kohi is already installed on this device
            </div>
          )}
        </motion.div>

        {/* ── Benefits ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12"
        >
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-kado-dark/8 bg-white p-4 text-center hover:border-kado-red/20 hover:shadow-sm transition-all"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-kado-red/8">
                <Icon className="w-5 h-5 text-kado-red" />
              </div>
              <p className="font-display font-black text-kado-dark text-sm mb-1">{title}</p>
              <p className="text-[11px] text-kado-dark/50 leading-snug">{body}</p>
            </div>
          ))}
        </motion.div>

        {/* ── OS tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="mb-8"
        >
          <h2 className="font-display font-black text-2xl text-kado-dark mb-5">Step-by-step guide</h2>
          <div className="flex gap-2 p-1 bg-kado-dark/5 rounded-2xl mb-8">
            {(['android', 'ios'] as const).map((os) => (
              <button
                key={os}
                type="button"
                onClick={() => setTab(os)}
                className={[
                  'flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black uppercase tracking-wider transition-all duration-200',
                  tab === os
                    ? 'bg-white text-kado-dark shadow-sm border border-kado-dark/8'
                    : 'text-kado-dark/50 hover:text-kado-dark',
                ].join(' ')}
              >
                <Smartphone className="w-4 h-4" />
                {os === 'android' ? 'Android' : 'iPhone / iPad'}
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-kado-dark/8 bg-white p-6 sm:p-8 shadow-sm">
            {tab === 'ios' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="mb-6 flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  <strong>Important:</strong> On iPhone and iPad, you must use <strong>Safari</strong> — not Chrome, Firefox, or any other browser — to install the app.
                </p>
              </motion.div>
            )}

            {tab === 'android' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="mb-6 flex items-start gap-3 rounded-2xl bg-sky-50 border border-sky-200 px-4 py-3"
              >
                <Chrome className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <p className="text-xs text-sky-800 font-medium leading-relaxed">
                  <strong>Best experience:</strong> Use <strong>Google Chrome</strong> on Android for the smoothest installation and full push notification support.
                </p>
              </motion.div>
            )}

            <div>
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 * i, duration: 0.4 }}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kado-red text-white font-display font-black text-sm shadow-sm">
                        {i + 1}
                      </div>
                      {i < 3 && <div className="mt-2 w-px flex-1 bg-kado-dark/8 min-h-[24px]" />}
                    </div>
                    <div className="pb-6 min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-kado-red shrink-0" />
                        <h3 className="font-display font-black text-kado-dark text-base">{step.title}</h3>
                      </div>
                      <p className="text-sm text-kado-dark/65 leading-relaxed">{step.body}</p>
                      {step.tip && (
                        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-kado-dark/45 bg-kado-cream/60 rounded-lg px-3 py-2 border border-kado-dark/5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-kado-dark/35" />
                          {step.tip}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-800">You're done!</p>
                <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                  Kado Kohi is now on your home screen. Open it anytime for instant access to ordering, your loyalty stamps, and order tracking.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Notification section ── */}
        {pushStatus !== 'subscribed' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            className="rounded-3xl border border-kado-red/20 bg-gradient-to-br from-kado-red/5 via-white to-kado-cream/40 p-6 sm:p-8 mb-12"
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-kado-red/10 text-kado-red">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display font-black text-xl text-kado-dark mb-1">Enable notifications</h2>
                <p className="text-sm text-kado-dark/55 leading-relaxed">
                  Once the app is installed, turn on push notifications. We'll alert you the moment your order is confirmed, brewing, and ready.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 mb-5">
              {[
                "✅ Order received — we've got it",
                '☕ Now brewing — barista is on it',
                '🎉 Ready for pickup — come collect your drink',
                '⭐ Order complete — stamp added to your account',
              ].map((item) => (
                <p key={item} className="text-sm text-kado-dark/70 font-medium">{item}</p>
              ))}
            </div>

            {pushStatus === 'denied' ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 font-medium">
                Notifications are blocked in your browser. Open site settings → Notifications → Allow for kado-kohi.vercel.app, then reload.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void enablePush()}
                disabled={pushBusy}
                className="flex items-center gap-2.5 rounded-xl bg-kado-red text-white px-6 py-3 text-[11px] font-black uppercase tracking-wider hover:bg-kado-dark transition-colors shadow-md disabled:opacity-50"
              >
                <BellRing className="w-4 h-4" />
                {pushBusy ? 'Enabling…' : 'Enable push notifications'}
              </button>
            )}
          </motion.div>
        )}

        {pushStatus === 'subscribed' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8 mb-12 flex items-center gap-4"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <p className="font-display font-black text-emerald-800 text-lg">Notifications are active</p>
              <p className="text-sm text-emerald-700 mt-0.5">You'll receive push alerts for every order status update on this device.</p>
            </div>
          </motion.div>
        )}

        {/* ── FAQ ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
        >
          <h2 className="font-display font-black text-2xl text-kado-dark mb-5">Common questions</h2>
          <div className="space-y-3">
            {[
              {
                q: 'Does installing use storage on my phone?',
                a: 'Barely — the app icon and cached assets use less than 5 MB. There is nothing to download from the App Store.',
              },
              {
                q: 'I don\'t see "Add to Home Screen" on iOS.',
                a: 'Make sure you are using Safari (the blue compass icon), not Chrome or Instagram browser. Tap the Share icon at the bottom, then scroll the sheet to find "Add to Home Screen".',
              },
              {
                q: 'Can I use the app without internet?',
                a: 'Yes — you can browse the menu and view past orders while offline. Placing new orders requires a connection.',
              },
              {
                q: 'How do I uninstall the app?',
                a: 'Long-press the Kado Kohi icon on your home screen and select "Remove" or "Uninstall", just like any other app.',
              },
              {
                q: 'Why am I not getting notifications?',
                a: 'Open your phone Settings → App notifications → find your browser (Chrome / Safari) → ensure Kado Kohi is allowed. Also confirm you toggled notifications on inside the app under Account → Profile.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-kado-dark/8 bg-white p-5">
                <p className="font-display font-black text-kado-dark text-sm mb-1.5">{q}</p>
                <p className="text-[13px] text-kado-dark/60 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── CTA back to account ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45 }}
          className="mt-12 flex flex-col sm:flex-row items-center gap-4 justify-center"
        >
          <Link
            to="/account"
            className="inline-flex items-center gap-2 rounded-full bg-kado-dark text-white px-8 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-kado-red transition-colors shadow-lg"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to dashboard
          </Link>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-full border-2 border-kado-dark text-kado-dark px-8 py-4 text-[11px] font-black uppercase tracking-widest hover:border-kado-red hover:text-kado-red transition-colors"
          >
            <Coffee className="w-4 h-4" />
            Order now
          </Link>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-12 border-t border-kado-dark/8 bg-kado-dark">
        <div className="max-w-3xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-kado-red text-white flex items-center justify-center font-display font-bold text-xs rounded-sm">角</div>
            <span className="text-xs font-bold text-white/55">Kado Kohi &copy; 2026</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-white/40">
            <Link to="/menu" className="hover:text-kado-red transition-colors">Menu</Link>
            <Link to="/branches" className="hover:text-kado-red transition-colors">Branches</Link>
            <Link to="/contact" className="hover:text-kado-red transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
