import { useEffect, useState, type FormEvent } from 'react';
import {
  Tag, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  TrendingUp, Users, Gift, Check, AlertCircle, Copy,
} from 'lucide-react';
import { usePromoStore } from '../../store/promoStore';
import { useBranchStore } from '../../store/branchStore';
import { formatVoucherScopeLabel } from '../../lib/branchScope';
import type { PromoCode, PromoCodeType } from '../../types/domain';
import { newId } from '../../lib/id';
import { formatPhp } from '../../lib/money';

const TYPE_LABELS: Record<PromoCodeType, string> = {
  percent: '% Discount',
  fixed: '₱ Fixed Discount',
  free_drink: 'Free Drink (cheapest)',
  bogo_drink: 'Buy 1 Get 1 Drink',
};

const TYPE_OPTIONS: PromoCodeType[] = ['percent', 'fixed', 'free_drink', 'bogo_drink'];

function typeNeedsValue(t: PromoCodeType) {
  return t === 'percent' || t === 'fixed';
}

function promoSummary(code: PromoCode): string {
  if (code.type === 'percent') return `${code.value}% off`;
  if (code.type === 'fixed') return `₱${code.value.toFixed(2)} off`;
  if (code.type === 'free_drink') return 'Free cheapest drink';
  if (code.type === 'bogo_drink') return 'Buy 1 Get 1 drink';
  return '—';
}

function isExpired(code: PromoCode): boolean {
  if (!code.expiresAt) return false;
  return new Date(code.expiresAt).getTime() < Date.now();
}

function isNotYetActive(code: PromoCode): boolean {
  if (!code.startsAt) return false;
  return new Date(code.startsAt).getTime() > Date.now();
}

function codeStatus(code: PromoCode): { label: string; color: string } {
  if (!code.active) return { label: 'Inactive', color: 'text-kado-dark/40 bg-kado-dark/5' };
  if (isExpired(code)) return { label: 'Expired', color: 'text-red-500 bg-red-50' };
  if (isNotYetActive(code)) return { label: 'Scheduled', color: 'text-amber-600 bg-amber-50' };
  if (code.maxUses != null && code.uses >= code.maxUses) return { label: 'Exhausted', color: 'text-orange-600 bg-orange-50' };
  return { label: 'Active', color: 'text-emerald-700 bg-emerald-50' };
}

const EMPTY_FORM = {
  id: '',
  code: '',
  name: '',
  description: '',
  type: 'percent' as PromoCodeType,
  value: 10,
  minOrderAmount: 0,
  maxUses: '' as number | '',
  perCustomer: 1,
  active: true,
  startsAt: '',
  expiresAt: '',
  branchId: '',
};

type FormState = typeof EMPTY_FORM;

export default function AdminVouchers() {
  const branches = useBranchStore((s) => s.branches);
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name;
  const { codes, loading, fetchAll, createCode, updateCode, toggleCode, removeCode } = usePromoStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const totalUses = codes.reduce((s, c) => s + c.uses, 0);
  const activeCodes = codes.filter((c) => c.active && !isExpired(c) && !isNotYetActive(c) && (c.maxUses == null || c.uses < c.maxUses)).length;

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, id: newId() });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (code: PromoCode) => {
    setEditingId(code.id);
    setForm({
      id: code.id,
      code: code.code,
      name: code.name,
      description: code.description ?? '',
      type: code.type,
      value: code.value,
      minOrderAmount: code.minOrderAmount,
      maxUses: code.maxUses ?? '',
      perCustomer: code.perCustomer,
      active: code.active,
      startsAt: code.startsAt ? code.startsAt.slice(0, 16) : '',
      expiresAt: code.expiresAt ? code.expiresAt.slice(0, 16) : '',
      branchId: code.branchId ?? '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.code.trim()) { setFormError('Code is required.'); return; }
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (typeNeedsValue(form.type) && (!form.value || form.value <= 0)) {
      setFormError('Enter a valid discount value.'); return;
    }
    if (form.type === 'percent' && Number(form.value) > 100) {
      setFormError('Percentage cannot exceed 100.'); return;
    }

    const payload = {
      id: editingId ?? form.id,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      value: typeNeedsValue(form.type) ? Number(form.value) : 0,
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxUses: form.maxUses === '' || form.maxUses == null ? undefined : Number(form.maxUses),
      perCustomer: Number(form.perCustomer) || 1,
      active: form.active,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      branchId: form.branchId || undefined,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateCode(editingId, payload);
      } else {
        await createCode(payload);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return; }
    await removeCode(id);
    setDeleteConfirm(null);
  };

  const f = (k: keyof FormState, v: unknown) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="dash-page max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-1">
            Voucher Management
          </h1>
          <p className="dash-muted text-sm">
            Create promo codes customers type at checkout to receive discounts.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="shrink-0 flex items-center gap-2 rounded-xl bg-kado-red px-5 py-2.5 text-sm font-bold text-white hover:bg-kado-red/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total codes', value: codes.length, icon: Tag },
          { label: 'Currently active', value: activeCodes, icon: Gift },
          { label: 'Total redemptions', value: totalUses, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="dash-card rounded-2xl border p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-kado-red/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-kado-red" />
            </div>
            <div>
              <p className="font-display font-bold text-xl dash-heading">{value}</p>
              <p className="text-xs dash-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works info */}
      <div className="dash-card-alt rounded-2xl border dash-border p-5 mb-6">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-kado-red shrink-0 mt-0.5" />
          <div className="text-sm dash-muted space-y-1">
            <p className="font-semibold dash-heading">How promo codes work</p>
            <p>Customers enter codes in their cart at checkout — they see a live discount before placing the order. Only one discount applies per order (promo code or loyalty voucher, not both).</p>
          </div>
        </div>
      </div>

      {/* Codes table */}
      {loading ? (
        <div className="text-center py-16 dash-muted text-sm">Loading vouchers…</div>
      ) : codes.length === 0 ? (
        <div className="dash-card-alt rounded-2xl border dash-border p-12 text-center">
          <Tag className="w-10 h-10 mx-auto dash-muted mb-3" />
          <p className="dash-muted text-sm">No promo codes yet — create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map((code) => {
            const status = codeStatus(code);
            return (
              <div
                key={code.id}
                className="dash-card rounded-2xl border p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Code + name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-black text-base dash-heading tracking-wider">
                        {code.code}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm dash-muted">{code.name}</p>
                    {code.description && (
                      <p className="text-xs dash-muted/70 mt-0.5">{code.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <span className="text-xs font-semibold text-kado-red">{promoSummary(code)}</span>
                      <span className="text-xs dash-muted">{TYPE_LABELS[code.type]}</span>
                      {code.minOrderAmount > 0 && (
                        <span className="text-xs dash-muted">Min. {formatPhp(code.minOrderAmount)}</span>
                      )}
                      <span className="text-xs dash-muted">
                        {code.uses} used{code.maxUses != null ? ` / ${code.maxUses} max` : ''}
                      </span>
                      <span className="text-xs font-semibold text-kado-dark/70">
                        {formatVoucherScopeLabel(code.branchId, branchName)}
                      </span>
                      {code.expiresAt && (
                        <span className="text-xs dash-muted">
                          Expires {new Date(code.expiresAt).toLocaleDateString('en-PH')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => void handleCopy(code.id, code.code)}
                      title="Copy code"
                      className="rounded-lg p-1.5 hover:bg-kado-red/10 transition-colors"
                    >
                      {copiedId === code.id
                        ? <Check className="w-4 h-4 text-emerald-500" />
                        : <Copy className="w-4 h-4 dash-muted" />}
                    </button>
                    <button
                      onClick={() => void toggleCode(code.id)}
                      title={code.active ? 'Deactivate' : 'Activate'}
                      className="transition-colors"
                    >
                      {code.active
                        ? <ToggleRight className="w-6 h-6 text-green-500" />
                        : <ToggleLeft className="w-6 h-6 dash-muted" />}
                    </button>
                    <button
                      onClick={() => openEdit(code)}
                      className="rounded-lg p-1.5 hover:bg-kado-red/10 transition-colors"
                    >
                      <Pencil className="w-4 h-4 dash-muted" />
                    </button>
                    <button
                      onClick={() => void handleDelete(code.id)}
                      className={`rounded-lg p-1.5 transition-colors ${deleteConfirm === code.id ? 'bg-red-100 text-red-600' : 'hover:bg-red-500/10'}`}
                      title={deleteConfirm === code.id ? 'Click again to confirm delete' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="dash-card rounded-2xl border p-6 w-full max-w-lg space-y-4 shadow-2xl my-8"
          >
            <h2 className="font-display font-bold text-lg dash-heading">
              {editingId ? 'Edit Promo Code' : 'New Promo Code'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1.5">
                  Code *
                </label>
                <input
                  required
                  value={form.code}
                  onChange={(e) => f('code', e.target.value.toUpperCase())}
                  placeholder="e.g. KADO20"
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1.5">
                  Type *
                </label>
                <select
                  value={form.type}
                  onChange={(e) => f('type', e.target.value as PromoCodeType)}
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1.5">
                Display name *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => f('name', e.target.value)}
                placeholder="e.g. 20% Opening Week Promo"
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1.5">
                Description (shown to customer)
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => f('description', e.target.value)}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30 resize-none"
              />
            </div>

            {typeNeedsValue(form.type) && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1.5">
                  {form.type === 'percent' ? 'Discount %' : 'Discount amount (₱)'} *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={form.type === 'percent' ? 100 : undefined}
                  step={form.type === 'percent' ? 1 : 0.01}
                  value={form.value}
                  onChange={(e) => f('value', Number(e.target.value))}
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1.5">
                  Min. order (₱)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.minOrderAmount}
                  onChange={(e) => f('minOrderAmount', Number(e.target.value))}
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1.5">
                  Total usage limit
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.maxUses}
                  onChange={(e) => f('maxUses', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Unlimited"
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1.5">
                Uses per customer
              </label>
              <input
                type="number"
                min={1}
                value={form.perCustomer}
                onChange={(e) => f('perCustomer', Number(e.target.value))}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1.5">
                Valid at branch
              </label>
              <select
                value={form.branchId}
                onChange={(e) => f('branchId', e.target.value)}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              >
                <option value="">All branches (universal)</option>
                {branches.filter((b) => b.status === 'active').map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1.5">
                  Starts at
                </label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => f('startsAt', e.target.value)}
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1.5">
                  Expires at
                </label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => f('expiresAt', e.target.value)}
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="code-active"
                checked={form.active}
                onChange={(e) => f('active', e.target.checked)}
                className="rounded accent-kado-red"
              />
              <label htmlFor="code-active" className="text-sm dash-heading">Active</label>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-kado-red px-5 py-2.5 text-sm font-bold text-white hover:bg-kado-red/90 transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Code'}
              </button>
              <button
                type="button"
                onClick={() => { setShowModal(false); setFormError(''); }}
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
