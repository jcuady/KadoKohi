import { useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, Gift, ToggleLeft, ToggleRight } from 'lucide-react';
import { useLoyaltyStore } from '../../store/loyaltyStore';
import type { LoyaltyReward, LoyaltyRewardType } from '../../types/domain';
import { newId } from '../../lib/id';

const REWARD_TYPE_LABELS: Record<LoyaltyRewardType, string> = {
  free_drink: 'Free Drink',
  discount_percent: '% Discount',
  discount_fixed: '₱ Discount',
  free_merch: 'Free Merch',
  custom: 'Custom',
};

const REWARD_TYPES: LoyaltyRewardType[] = [
  'free_drink',
  'discount_percent',
  'discount_fixed',
  'free_merch',
  'custom',
];

const EMPTY_FORM: Omit<LoyaltyReward, 'id'> = {
  name: '',
  description: '',
  stampsRequired: 5,
  type: 'free_drink',
  value: undefined,
  active: true,
};

export default function AdminLoyalty() {
  const config = useLoyaltyStore((s) => s.config);
  const updateConfig = useLoyaltyStore((s) => s.updateConfig);
  const addReward = useLoyaltyStore((s) => s.addReward);
  const updateReward = useLoyaltyStore((s) => s.updateReward);
  const removeReward = useLoyaltyStore((s) => s.removeReward);
  const toggleReward = useLoyaltyStore((s) => s.toggleReward);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<LoyaltyReward, 'id'>>(EMPTY_FORM);

  const activeCount = config.rewards.filter((r) => r.active).length;
  const showValue = form.type === 'discount_percent' || form.type === 'discount_fixed';

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (reward: LoyaltyReward) => {
    setEditingId(reward.id);
    setForm({
      name: reward.name,
      description: reward.description ?? '',
      stampsRequired: reward.stampsRequired,
      type: reward.type,
      value: reward.value,
      active: reward.active,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateReward(editingId, form);
    } else {
      addReward(form);
    }
    setShowModal(false);
  };

  const handleConfigSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="dash-page max-w-4xl">
      {/* Header */}
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-2">
        Loyalty Program
      </h1>
      <p className="dash-muted text-sm mb-8">
        {activeCount} active reward{activeCount !== 1 && 's'} configured
      </p>

      {/* Global Config */}
      <form onSubmit={handleConfigSubmit} className="mb-8">
        <div className="dash-card rounded-2xl border p-6 space-y-5">
          <h2 className="font-display font-bold text-lg dash-heading">Global Config</h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
              Stamps per order
            </label>
            <input
              type="number"
              min={1}
              value={config.stampsPerOrder}
              onChange={(e) => updateConfig({ stampsPerOrder: Number(e.target.value) })}
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider dash-muted">
              Earn stamps on merch orders
            </label>
            <button
              type="button"
              onClick={() => updateConfig({ stampOnMerch: !config.stampOnMerch })}
              className="transition-colors"
            >
              {config.stampOnMerch ? (
                <ToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 dash-muted" />
              )}
            </button>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-kado-red px-5 py-2.5 text-sm font-bold text-white hover:bg-kado-red/90 transition-colors"
          >
            Save Config
          </button>
        </div>
      </form>

      {/* Rewards Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg dash-heading">Rewards</h2>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-xl bg-kado-red px-4 py-2 text-sm font-bold text-white hover:bg-kado-red/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add reward
          </button>
        </div>

        {config.rewards.length === 0 ? (
          <div className="dash-card-alt rounded-2xl border dash-border p-8 text-center">
            <Gift className="w-10 h-10 mx-auto dash-muted mb-3" />
            <p className="dash-muted text-sm">No rewards yet — add one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {config.rewards.map((reward) => (
              <div
                key={reward.id}
                className="dash-card rounded-2xl border p-5 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold dash-heading truncate">
                      {reward.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-kado-red/10 text-kado-red px-2.5 py-0.5 text-xs font-bold">
                      {reward.stampsRequired} stamps
                    </span>
                  </div>
                  {reward.description && (
                    <p className="dash-muted text-sm mb-1">{reward.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs dash-muted">
                    <span>{REWARD_TYPE_LABELS[reward.type]}</span>
                    {reward.value !== undefined && <span>Value: {reward.value}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleReward(reward.id)}
                    title={reward.active ? 'Deactivate' : 'Activate'}
                    className="transition-colors"
                  >
                    {reward.active ? (
                      <ToggleRight className="w-6 h-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 dash-muted" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(reward)}
                    className="rounded-lg p-1.5 hover:bg-kado-red/10 transition-colors"
                  >
                    <Pencil className="w-4 h-4 dash-muted" />
                  </button>
                  <button
                    onClick={() => removeReward(reward.id)}
                    className="rounded-lg p-1.5 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Card */}
      <div className="dash-card-alt rounded-2xl border dash-border p-6">
        <h2 className="font-display font-bold text-lg dash-heading mb-4">Customer Preview</h2>
        <div className="mx-auto max-w-sm rounded-2xl bg-kado-dark text-kado-cream p-6 shadow-xl">
          <p className="font-display text-xl font-bold text-center mb-4">Kado Circle</p>
          <div className="grid grid-cols-5 gap-2 mb-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-xl flex items-center justify-center text-lg ${
                  i < 4
                    ? 'bg-kado-red text-white'
                    : 'bg-kado-cream/10 text-kado-cream/30'
                }`}
              >
                {i < 4 ? '★' : '☆'}
              </div>
            ))}
          </div>
          <p className="text-xs text-kado-cream/60 text-center mb-3">
            4 / 10 stamps collected
          </p>
          {config.rewards.filter((r) => r.active).length > 0 && (
            <div className="border-t border-kado-cream/10 pt-3 space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-kado-cream/50">
                Available rewards
              </p>
              {config.rewards
                .filter((r) => r.active)
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span>{r.name}</span>
                    <span className="text-kado-red font-bold">{r.stampsRequired}★</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="dash-card rounded-2xl border p-6 w-full max-w-md space-y-4 shadow-2xl"
          >
            <h2 className="font-display font-bold text-lg dash-heading">
              {editingId ? 'Edit Reward' : 'New Reward'}
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
                Name
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
                Stamps required
              </label>
              <input
                type="number"
                required
                min={1}
                value={form.stampsRequired}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stampsRequired: Number(e.target.value) }))
                }
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as LoyaltyRewardType }))
                }
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              >
                {REWARD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {REWARD_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            {showValue && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1.5">
                  Value
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.value ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, value: Number(e.target.value) }))
                  }
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reward-active"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="rounded accent-kado-red"
              />
              <label htmlFor="reward-active" className="text-sm dash-heading">
                Active
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-kado-red px-5 py-2.5 text-sm font-bold text-white hover:bg-kado-red/90 transition-colors"
              >
                {editingId ? 'Save Changes' : 'Add Reward'}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl dash-card-alt border dash-border px-5 py-2.5 text-sm font-bold dash-heading hover:opacity-80 transition-opacity"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
