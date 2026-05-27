import { type FormEvent, useRef, useState } from 'react';
import { useSettingsStore, type DashTheme } from '../../store/settingsStore';
import { readImageDataUrl } from '../../lib/readImageDataUrl';

export default function AdminSettings() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  const handleGcashQr = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    const res = await readImageDataUrl(file);
    if (res.ok === false) {
      setUploadError(res.error);
      return;
    }
    updateSettings({ gcashQrImage: res.dataUrl });
  };

  return (
    <div className="dash-page max-w-2xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Settings</h1>
      <p className="dash-muted text-sm mb-8">Global configuration — persisted locally. Will sync to API when DB lands.</p>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="rounded-2xl dash-card border p-6 space-y-5">
          <h2 className="font-display font-bold text-lg dash-heading">Default hours</h2>
          <p className="text-xs dash-muted leading-relaxed">
            Online pickup orders follow these hours. Checkout closes{' '}
            <span className="font-semibold text-kado-dark">10 minutes before close</span>
            {' '}(e.g. close 11:00 PM → last order 10:50 PM; 10:51 PM onwards cannot order).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Open</label>
              <input
                type="time"
                value={settings.defaultOpenTime}
                onChange={(e) => updateSettings({ defaultOpenTime: e.target.value })}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Close</label>
              <input
                type="time"
                value={settings.defaultCloseTime}
                onChange={(e) => updateSettings({ defaultCloseTime: e.target.value })}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl dash-card border p-6 space-y-5">
          <h2 className="font-display font-bold text-lg dash-heading">GCash QR</h2>
          <p className="text-xs dash-muted">
            Shown to customers after checkout and on My Orders. Upload your shop GCash QR image.
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
                  onClick={() => fileRef.current?.click()}
                  className="w-full sm:w-auto min-h-[44px] rounded-xl border dash-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider dash-heading hover:border-kado-red/40 touch-manipulation"
                >
                  Replace image
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ gcashQrImage: '' })}
                  className="w-full sm:w-auto min-h-[44px] rounded-xl border border-red-200 text-red-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-red-50 touch-manipulation"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed dash-border py-10 text-xs font-bold uppercase tracking-wider dash-muted hover:border-kado-red/40 hover:text-kado-red transition-colors"
            >
              Upload GCash QR image
            </button>
          )}
          {uploadError && <p className="text-xs text-red-600 font-medium">{uploadError}</p>}
        </div>

        <div className="rounded-2xl dash-card border p-6 space-y-5">
          <h2 className="font-display font-bold text-lg dash-heading">Contact page & footer</h2>
          <p className="text-xs dash-muted">
            Shown on /contact and the site footer. Contact form opens the visitor&apos;s email app to the address below.
          </p>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Public email</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => updateSettings({ contactEmail: e.target.value })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              placeholder="kadocoffeeph@gmail.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Phone</label>
            <input
              type="tel"
              value={settings.contactPhone}
              onChange={(e) => updateSettings({ contactPhone: e.target.value })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Address</label>
            <input
              type="text"
              value={settings.contactAddress}
              onChange={(e) => updateSettings({ contactAddress: e.target.value })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Hours line</label>
            <input
              type="text"
              value={settings.contactHours}
              onChange={(e) => updateSettings({ contactHours: e.target.value })}
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
              onChange={(e) => updateSettings({ mapsEmbedUrl: e.target.value })}
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
                onChange={(e) => updateSettings({ socialInstagram: e.target.value })}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                placeholder="https://instagram.com/kadokohi"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Facebook</label>
              <input
                type="url"
                value={settings.socialFacebook}
                onChange={(e) => updateSettings({ socialFacebook: e.target.value })}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">TikTok</label>
              <input
                type="url"
                value={settings.socialTiktok}
                onChange={(e) => updateSettings({ socialTiktok: e.target.value })}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                placeholder="https://tiktok.com/@kadokohi"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl dash-card border p-6 space-y-5">
          <h2 className="font-display font-bold text-lg dash-heading">Events / booth contact</h2>
          <p className="text-xs dash-muted">
            Shown on customer Events Bookings so they can call about estimates and official quotes.
          </p>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
              Contact name
            </label>
            <input
              type="text"
              value={settings.boothContactName ?? ''}
              onChange={(e) => updateSettings({ boothContactName: e.target.value })}
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
              onChange={(e) => updateSettings({ boothContactPhone: e.target.value })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              placeholder="+63 9XX XXX XXXX"
            />
          </div>
        </div>

        <div className="rounded-2xl dash-card border p-6 space-y-5">
          <h2 className="font-display font-bold text-lg dash-heading">Brand</h2>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Brand mode</label>
            <select
              value={settings.brandMode}
              onChange={(e) => updateSettings({ brandMode: e.target.value as DashTheme })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            >
              <option value="light">Light (default)</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>

        <p className="text-xs dash-muted">Settings auto-save on change (Zustand persist).</p>
      </form>
    </div>
  );
}
