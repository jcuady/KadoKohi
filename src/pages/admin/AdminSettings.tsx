import { type FormEvent } from 'react';
import { useSettingsStore, type DashTheme } from '../../store/settingsStore';

export default function AdminSettings() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="dash-page max-w-2xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">Settings</h1>
      <p className="dash-muted text-sm mb-8">Global configuration — persisted locally. Will sync to API when DB lands.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl dash-card border p-6 space-y-5">
          <h2 className="font-display font-bold text-lg dash-heading">General</h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Shop name</label>
            <input
              value={settings.shopName}
              onChange={(e) => updateSettings({ shopName: e.target.value })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Currency</label>
            <input
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">Tax rate (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={settings.taxRate}
              onChange={(e) => updateSettings({ taxRate: Number(e.target.value) })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
          </div>
        </div>

        <div className="rounded-2xl dash-card border p-6 space-y-5">
          <h2 className="font-display font-bold text-lg dash-heading">Default hours</h2>
          <div className="grid grid-cols-2 gap-4">
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
