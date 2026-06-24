import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore, type BoothPaymentConfig, type DashTheme } from '../../store/settingsStore';
import { authRepo } from '../../lib/supabase/repositories/auth';
import { orderingRepo } from '../../lib/supabase/repositories/ordering';
import { refreshOperationsData } from '../../lib/supabase/operationsRealtime';
import { useBranchStore } from '../../store/branchStore';
import { useAuthStore } from '../../store/authStore';
import { useOnlineOrderHours } from '../../hooks/useOnlineOrderHours';
import { AlertTriangle, Check, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { clampTaxRate } from '../../lib/validation';

const RESET_PHRASE = 'RESET ALL DATA';

export default function AdminSettings() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const hydrateFromRemote = useSettingsStore((s) => s.hydrateFromRemote);
  const orderHours = useOnlineOrderHours();
  const fileRef = useRef<HTMLInputElement>(null);
  const boothQrRef = useRef<HTMLInputElement>(null);
  const [hydrating, setHydrating] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [gcashSaving, setGcashSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPhrase, setResetPhrase] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  useEffect(() => {
    void hydrateFromRemote().finally(() => setHydrating(false));
  }, [hydrateFromRemote]);

  const flashSaved = () => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  const patch = (partial: Parameters<typeof updateSettings>[0]) => {
    setSaveError(null);
    setSettingsSaving(true);
    void updateSettings(partial)
      .then(() => flashSaved())
      .catch((err) => {
        setSaveError(err instanceof Error ? err.message : 'Could not save settings to the database.');
      })
      .finally(() => setSettingsSaving(false));
  };

  const handleGcashQr = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setSaveError(null);
    setGcashSaving(true);
    try {
      const publicUrl = await orderingRepo.uploadGcashShopQr(file);
      await updateSettings({ gcashQrImage: publicUrl });
      flashSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save GCash QR.';
      setUploadError(message);
    } finally {
      setGcashSaving(false);
    }
  };

  const patchBoothPayment = (partial: Partial<BoothPaymentConfig>) => {
    patch({ boothPayment: { ...settings.boothPayment, ...partial } });
  };

  const handleBoothGcashQr = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setGcashSaving(true);
    try {
      const publicUrl = await orderingRepo.uploadGcashShopQr(file);
      patchBoothPayment({ gcashQrImage: publicUrl });
      flashSaved();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not save booth GCash QR.');
    } finally {
      setGcashSaving(false);
    }
  };

  const handleResetAllData = async (e: FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    if (resetPhrase.trim() !== RESET_PHRASE) {
      setResetError(`Type "${RESET_PHRASE}" exactly to confirm.`);
      return;
    }
    setResetBusy(true);
    try {
      const result = await authRepo.resetAllData(RESET_PHRASE);
      useBranchStore.getState().setAdminPosBranchId(null);
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === 'admin') {
        useAuthStore.setState({ user: { ...currentUser, branchId: undefined, loyaltyStamps: undefined } });
      }
      await refreshOperationsData();
      setResetOpen(false);
      setResetPhrase('');
      const d = result.deleted;
      const orders = Number(d.kk_orders ?? 0);
      const branches = Number(d.kk_branches ?? 0);
      const usersRemoved = Number(d.usersRemoved ?? 0);
      const adminsKept = Number(d.adminsPreserved ?? 0);
      setResetSuccess(
        `Reset complete — cleared ${orders} orders, ${branches} branches, and ${usersRemoved} non-admin accounts. ${adminsKept} admin login(s) preserved with access to all branches. Shop settings restored to defaults.`,
      );
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Unable to reset data. Try again or redeploy the admin edge function.');
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="dash-page max-w-2xl">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="dash-muted text-xs font-bold uppercase tracking-[0.2em] mb-1">Admin · Administration</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Settings</h1>
          <p className="dash-muted text-sm">
            Global shop configuration — synced to Supabase for all devices and customer-facing pages.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {hydrating && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider dash-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
            </span>
          )}
          {settingsSaving && !gcashSaving && !hydrating && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider dash-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
            </span>
          )}
          {savedFlash && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
              <Check className="w-3.5 h-3.5" /> Saved to database
            </span>
          )}
        </div>
      </div>

      {saveError && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700" role="alert">
          {saveError}
        </p>
      )}

      <div className="space-y-6">

        <div className="rounded-2xl dash-card border p-6 space-y-5">
          <h2 className="font-display font-bold text-lg dash-heading">Store & tax</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Shop name</label>
              <input
                type="text"
                value={settings.shopName}
                onChange={(e) => patch({ shopName: e.target.value })}
                disabled={hydrating}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 disabled:opacity-60"
              />
              <p className="text-[10px] dash-muted mt-1">Stored for branded outputs and internal references.</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Tax rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={settings.taxRate}
                onChange={(e) => patch({ taxRate: clampTaxRate(Number(e.target.value)) })}
                disabled={hydrating}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 disabled:opacity-60"
              />
              <p className="text-[10px] dash-muted mt-1">Applied to online cart, QR, takeout, and POS totals.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl dash-card border p-6 space-y-5">
          <h2 className="font-display font-bold text-lg dash-heading">Online order hours</h2>
          <p className="text-xs dash-muted leading-relaxed">
            Controls when customers can checkout from the menu cart, QR dine-in, and takeout. Checkout closes{' '}
            <span className="font-semibold text-kado-dark">10 minutes before close</span>.
          </p>
          <div
            className={`rounded-xl border px-4 py-3 text-xs ${
              orderHours.reason === 'invalid_hours'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : orderHours.isOpen
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-kado-dark/10 bg-kado-cream/40 dash-muted'
            }`}
          >
            <p className="font-bold uppercase tracking-wider text-[10px] mb-1">
              {orderHours.reason === 'invalid_hours'
                ? 'Invalid hours'
                : orderHours.isOpen
                  ? 'Checkout open now'
                  : 'Checkout closed now'}
            </p>
            <p>{orderHours.message}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Open</label>
              <input
                type="time"
                value={settings.defaultOpenTime}
                onChange={(e) => patch({ defaultOpenTime: e.target.value })}
                disabled={hydrating}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Close</label>
              <input
                type="time"
                value={settings.defaultCloseTime}
                onChange={(e) => patch({ defaultCloseTime: e.target.value })}
                disabled={hydrating}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl dash-card border p-6 space-y-5">
          <h2 className="font-display font-bold text-lg dash-heading">GCash QR</h2>
          <p className="text-xs dash-muted">
            Shown on QR dine-in/takeout, online cart, and My Orders. Uploads to Supabase Storage and saves the
            public URL on the settings row.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleGcashQr(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {settings.gcashQrImage ? (
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <img
                src={settings.gcashQrImage}
                alt="GCash QR preview"
                className="w-full max-w-[200px] sm:w-40 sm:h-40 aspect-square rounded-xl border dash-border object-contain bg-white p-2 mx-auto sm:mx-0"
              />
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={gcashSaving}
                  onClick={() => fileRef.current?.click()}
                  className="w-full sm:w-auto min-h-[44px] rounded-xl border dash-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider dash-heading hover:border-kado-red/40 touch-manipulation disabled:opacity-50"
                >
                  {gcashSaving ? 'Uploading…' : 'Replace image'}
                </button>
                <button
                  type="button"
                  disabled={gcashSaving}
                  onClick={() => void updateSettings({ gcashQrImage: '' }).then(() => flashSaved()).catch((err) => setUploadError(err instanceof Error ? err.message : 'Could not remove GCash QR.'))}
                  className="w-full sm:w-auto min-h-[44px] rounded-xl border border-red-200 text-red-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-red-50 touch-manipulation disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={gcashSaving}
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed dash-border py-10 text-xs font-bold uppercase tracking-wider dash-muted hover:border-kado-red/40 hover:text-kado-red transition-colors disabled:opacity-50"
            >
              {gcashSaving ? 'Uploading to Supabase…' : 'Upload GCash QR image'}
            </button>
          )}
          {uploadError && <p className="text-xs text-red-600 font-medium">{uploadError}</p>}
        </div>

        <div className="rounded-2xl dash-card border p-6 space-y-5">
          <h2 className="font-display font-bold text-lg dash-heading">Booth payment details</h2>
          <p className="text-xs dash-muted">
            Shown in quote emails and on customer event bookings. Falls back to shop GCash QR when booth QR is empty.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.boothPayment.gcashEnabled}
              onChange={(e) => patchBoothPayment({ gcashEnabled: e.target.checked })}
            />
            Accept GCash for events
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.boothPayment.bankEnabled}
              onChange={(e) => patchBoothPayment({ bankEnabled: e.target.checked })}
            />
            Accept bank transfer for events
          </label>
          <input
            ref={boothQrRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleBoothGcashQr(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {(settings.boothPayment.gcashQrImage || settings.gcashQrImage) && settings.boothPayment.gcashEnabled && (
            <img
              src={settings.boothPayment.gcashQrImage || settings.gcashQrImage}
              alt="Booth GCash QR"
              className="w-40 h-40 rounded-xl border dash-border object-contain bg-white p-2"
            />
          )}
          <button
            type="button"
            disabled={gcashSaving}
            onClick={() => boothQrRef.current?.click()}
            className="rounded-xl border dash-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            {gcashSaving ? 'Uploading…' : 'Upload booth GCash QR (optional)'}
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Bank name</label>
              <input
                value={settings.boothPayment.bankName ?? ''}
                onChange={(e) => patchBoothPayment({ bankName: e.target.value })}
                className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Account name</label>
              <input
                value={settings.boothPayment.bankAccountName ?? ''}
                onChange={(e) => patchBoothPayment({ bankAccountName: e.target.value })}
                className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Account number</label>
            <input
              value={settings.boothPayment.bankAccountNumber ?? ''}
              onChange={(e) => patchBoothPayment({ bankAccountNumber: e.target.value })}
              className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Bank instructions</label>
            <textarea
              rows={2}
              value={settings.boothPayment.bankInstructions ?? ''}
              onChange={(e) => patchBoothPayment({ bankInstructions: e.target.value })}
              className="w-full rounded-xl dash-input border px-4 py-2.5 text-sm resize-none"
              placeholder="e.g. BPI Savings · send proof after transfer"
            />
          </div>
        </div>

        <div className="rounded-2xl dash-card border p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="font-display font-bold text-lg dash-heading">Contact page & footer</h2>
            <a
              href="/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-kado-red hover:underline"
            >
              Preview <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-xs dash-muted">
            Shown on <Link to="/contact" className="text-kado-red font-semibold hover:underline">/contact</Link> and the site footer.
          </p>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Public email</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => patch({ contactEmail: e.target.value })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              placeholder="kadocoffeeph@gmail.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Phone</label>
            <input
              type="tel"
              value={settings.contactPhone}
              onChange={(e) => patch({ contactPhone: e.target.value })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Address</label>
            <input
              type="text"
              value={settings.contactAddress}
              onChange={(e) => patch({ contactAddress: e.target.value })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Hours line</label>
            <input
              type="text"
              value={settings.contactHours}
              onChange={(e) => patch({ contactHours: e.target.value })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
              Google Maps embed URL
            </label>
            <input
              type="url"
              value={settings.mapsEmbedUrl}
              onChange={(e) => patch({ mapsEmbedUrl: e.target.value })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
          </div>
          <div className="pt-2 border-t dash-border space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider dash-muted">Social links</p>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Instagram</label>
              <input
                type="url"
                value={settings.socialInstagram}
                onChange={(e) => patch({ socialInstagram: e.target.value })}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                placeholder="https://instagram.com/kadokohi"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Facebook</label>
              <input
                type="url"
                value={settings.socialFacebook}
                onChange={(e) => patch({ socialFacebook: e.target.value })}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">TikTok</label>
              <input
                type="url"
                value={settings.socialTiktok}
                onChange={(e) => patch({ socialTiktok: e.target.value })}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                placeholder="https://tiktok.com/@kadokohi"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl dash-card border p-6 space-y-5">
          <h2 className="font-display font-bold text-lg dash-heading">Events / booth contact</h2>
          <p className="text-xs dash-muted">
            Shown on customer booth bookings for estimates and official quotes.
          </p>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
              Contact name
            </label>
            <input
              type="text"
              value={settings.boothContactName ?? ''}
              onChange={(e) => patch({ boothContactName: e.target.value })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              placeholder="Kado Kohi Events"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
              Phone (click-to-call)
            </label>
            <input
              type="tel"
              value={settings.boothContactPhone}
              onChange={(e) => patch({ boothContactPhone: e.target.value })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              placeholder="+63 9XX XXX XXXX"
            />
          </div>
        </div>

        <div className="rounded-2xl dash-card border p-6 space-y-5">
          <h2 className="font-display font-bold text-lg dash-heading">Admin dashboard theme</h2>
          <p className="text-xs dash-muted">
            Affects the admin, barista, and staff portals only. Customer-facing pages always use brand light mode.
          </p>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Brand mode</label>
            <select
              value={settings.brandMode}
              onChange={(e) => patch({ brandMode: e.target.value as DashTheme })}
              disabled={hydrating}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 disabled:opacity-60"
            >
              <option value="light">Light (default)</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-red-200 bg-red-50/40 p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-red-900">Reset all data</h2>
              <p className="text-xs text-red-800/80 mt-1 leading-relaxed">
                Wipes the entire shop back to a clean slate. Your admin email and password stay — everything else in the database is removed or reset to defaults.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-white/70 p-4 text-xs text-red-900/80 space-y-2">
            <p className="font-bold uppercase tracking-wider text-[10px] text-red-700">Will be deleted</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>All orders, customers, baristas, and staff accounts</li>
              <li>All branches, menu items, tables, and QR codes</li>
              <li>Audit logs, push subscriptions, vouchers, and GCash QR</li>
              <li>Shop settings restored to factory defaults</li>
            </ul>
            <p className="font-bold uppercase tracking-wider text-[10px] text-emerald-700 pt-2">Will be kept</p>
            <ul className="list-disc pl-4 space-y-1 text-emerald-900/80">
              <li>Admin login (email + password) — you stay signed in</li>
              <li>Super admin access to all branches (no branch lock)</li>
            </ul>
          </div>

          {resetSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 font-medium flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              {resetSuccess}
            </div>
          )}

          {!resetOpen ? (
            <button
              type="button"
              onClick={() => {
                setResetOpen(true);
                setResetError('');
                setResetSuccess('');
                setResetPhrase('');
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 text-white px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Reset all data
            </button>
          ) : (
            <form onSubmit={(e) => void handleResetAllData(e)} className="space-y-3 rounded-xl border border-red-300 bg-white p-4">
              <p className="text-xs text-red-900 font-medium">
                This cannot be undone. Type <span className="font-black">{RESET_PHRASE}</span> below to confirm.
              </p>
              <input
                type="text"
                value={resetPhrase}
                onChange={(e) => setResetPhrase(e.target.value)}
                placeholder={RESET_PHRASE}
                autoComplete="off"
                className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              {resetError && <p className="text-xs text-red-600 font-medium">{resetError}</p>}
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={resetBusy || resetPhrase.trim() !== RESET_PHRASE}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {resetBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {resetBusy ? 'Resetting…' : 'Confirm reset'}
                </button>
                <button
                  type="button"
                  disabled={resetBusy}
                  onClick={() => {
                    setResetOpen(false);
                    setResetPhrase('');
                    setResetError('');
                  }}
                  className="rounded-xl border border-red-200 text-red-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-xs dash-muted">
          Changes save to Supabase when you edit a field. GCash QR uploads to the <strong>kado-gcash-qr</strong>{' '}
          storage bucket (public read). Contact and hours live in the settings row alongside tax rate.
        </p>
      </div>
    </div>
  );
}
