import { useState, useMemo, type FormEvent } from 'react';
import type { Role } from '../../types/domain';
import { useUserStore } from '../../store/userStore';
import { hasAllBranchAccess, isInternalRole, matchesUserSearch } from '../../lib/roles';
import { useBranchStore } from '../../store/branchStore';
import { Plus, Pencil, Trash2, Shield, AlertCircle, KeyRound, Stamp, Search, Filter } from 'lucide-react';
import { authRepo } from '../../lib/supabase/repositories/auth';
import { useAuthStore } from '../../store/authStore';

const CREATABLE_ROLES: Role[] = ['admin', 'barista', 'staff', 'customer'];
const ALL_DISPLAY_ROLES: Role[] = ['admin', 'barista', 'staff', 'customer'];

type RoleFilter = 'team' | Role | 'all';

type FormData = { name: string; email: string; role: Role; branchId: string };
const emptyForm: FormData = { name: '', email: '', role: 'barista', branchId: '' };

export default function AdminUsers() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const users = useUserStore((s) => s.users);
  const addUser = useUserStore((s) => s.addUser);
  const updateUser = useUserStore((s) => s.updateUser);
  const removeUser = useUserStore((s) => s.removeUser);
  const hydrateUsers = useUserStore((s) => s.hydrateFromRemote);
  const adjustLoyaltyStamps = useUserStore((s) => s.adjustLoyaltyStamps);
  const branches = useBranchStore((s) => s.branches);

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('team');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const [stampUserId, setStampUserId] = useState<string | null>(null);
  const [stampDelta, setStampDelta] = useState(1);
  const [stampReason, setStampReason] = useState('');
  const stampUser = users.find((u) => u.id === stampUserId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeBranches = useMemo(() => branches.filter((b) => b.status === 'active'), [branches]);
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? id;

  const teamCount = useMemo(
    () => users.filter((u) => isInternalRole(u.role)).length,
    [users],
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim();
    let list = users;

    if (q) {
      list = list.filter((u) => matchesUserSearch(u, q));
    } else if (roleFilter === 'team') {
      list = list.filter((u) => isInternalRole(u.role));
    } else if (roleFilter !== 'all') {
      list = list.filter((u) => u.role === roleFilter);
    }

    if (branchFilter !== 'all') {
      list = list.filter((u) => u.branchId === branchFilter);
    }

    return [...list].sort((a, b) => {
      const rank = (r: Role) =>
        r === 'admin' ? 0 : r === 'barista' ? 1 : r === 'staff' ? 2 : 3;
      const d = rank(a.role) - rank(b.role);
      if (d !== 0) return d;
      return a.name.localeCompare(b.name);
    });
  }, [users, roleFilter, branchFilter, search]);

  const handleDelete = async (id: string) => {
    setDeleteError('');
    if (id === currentUserId) {
      setDeleteError('You cannot delete your own account while signed in.');
      return;
    }
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeletingId(id);
    try {
      await removeUser(id);
      setConfirmDeleteId(null);
      await hydrateUsers();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unable to delete user.');
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const startAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, branchId: activeBranches[0]?.id ?? '' });
    setPassword('');
    setFormError('');
    setShowForm(true);
  };
  const startEdit = (u: typeof users[0]) => {
    setEditingId(u.id);
    setForm({ name: u.name, email: u.email, role: u.role, branchId: u.branchId ?? '' });
    setFormError('');
    setShowForm(true);
  };
  const cancel = () => {
    setShowForm(false);
    setEditingId(null);
    setPassword('');
    setFormError('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.email.trim()) return;

    const needsBranch = form.role === 'barista' || form.role === 'staff';
    if (needsBranch && !form.branchId) {
      setFormError('A branch is required for barista / staff accounts.');
      return;
    }

    if (needsBranch && !activeBranches.some((b) => b.id === form.branchId)) {
      setFormError('Selected branch is not active. Choose an active branch.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      branchId: form.role === 'admin' || form.role === 'customer' ? undefined : form.branchId,
    };
    setSaving(true);
    try {
      if (editingId) {
        const existing = users.find((u) => u.id === editingId);
        const viaEdge =
          isInternalRole(payload.role) || (existing != null && isInternalRole(existing.role));
        if (viaEdge) {
          await authRepo.updateInternalUser({
            userId: editingId,
            name: payload.name,
            email: payload.email,
            role: payload.role as Extract<Role, 'admin' | 'barista' | 'staff' | 'customer'>,
            branchId: payload.branchId,
          });
        } else {
          await updateUser(editingId, payload);
        }
        await hydrateUsers();
      } else {
        if (password.trim().length < 8) {
          setFormError('Password must be at least 8 characters.');
          setSaving(false);
          return;
        }
        const created = await authRepo.createInternalUser({
          email: payload.email,
          password: password.trim(),
          name: payload.name,
          role: payload.role as Extract<Role, 'admin' | 'barista' | 'staff' | 'customer'>,
          branchId: payload.branchId,
        });
        const newId = created?.user?.id;
        if (!newId) throw new Error('Account was created but no user id was returned.');
        addUser({
          id: newId,
          ...payload,
        });
        await hydrateUsers();
      }
      cancel();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save user.');
    } finally {
      setSaving(false);
    }
  };

  const submitResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!resetUserId) return;
    if (resetPassword.trim().length < 8) {
      setResetError('Password must be at least 8 characters.');
      return;
    }
    setResetting(true);
    try {
      await authRepo.resetInternalPassword(resetUserId, resetPassword.trim());
      setResetUserId(null);
      setResetPassword('');
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setResetting(false);
    }
  };

  const rolePills: { id: RoleFilter; label: string }[] = [
    { id: 'team', label: 'Team' },
    { id: 'admin', label: 'Admin' },
    { id: 'barista', label: 'Barista' },
    { id: 'staff', label: 'Staff' },
    { id: 'customer', label: 'Customers' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div className="dash-page max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading">Users</h1>
          <p className="dash-muted text-sm mt-1">
            {teamCount} team member(s) — admin, barista, and staff. Customers are hidden until you search or filter.
          </p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="rounded-xl bg-kado-dark text-kado-cream px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add user
        </button>
      </div>

      <div className="rounded-2xl dash-card border dash-border p-4 mb-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dash-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email (includes customers)…"
            className="w-full rounded-xl dash-input pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 dash-muted shrink-0" />
          {rolePills.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setRoleFilter(id)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                roleFilter === id ? 'bg-kado-red text-white border-kado-red' : 'dash-border dash-muted hover:bg-kado-cream'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider dash-muted">Branch</span>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-xl dash-input border px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-kado-red/30"
          >
            <option value="all">All branches</option>
            {activeBranches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {deleteError && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{deleteError}</span>
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div className="rounded-xl dash-card border px-5 py-10 text-center text-sm dash-muted">
          {search.trim()
            ? 'No users match your search.'
            : roleFilter === 'customer'
              ? 'No customer accounts found. Customers usually sign up on the site.'
              : 'No team members match these filters.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredUsers.map((u) => (
            <li key={u.id} className="rounded-xl dash-card border px-5 py-4 flex items-center gap-4">
              <Shield className="w-5 h-5 text-kado-red shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm dash-heading">{u.name}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest dash-card-alt dash-muted px-2 py-0.5 rounded-full dash-border border">{u.role}</span>
                  {hasAllBranchAccess(u) && (
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-kado-red/10 text-kado-red px-2 py-0.5 rounded-full border border-kado-red/20">
                      All branches
                    </span>
                  )}
                </div>
                <p className="text-[10px] dash-muted">
                  {u.email}
                  {u.branchId && u.role !== 'admin'
                    ? ` · ${branchName(u.branchId)}`
                    : hasAllBranchAccess(u)
                      ? ' · All branches'
                      : ''}
                </p>
              </div>
              {u.role === 'customer' && (
                <button
                  type="button"
                  onClick={() => { setStampUserId(u.id); setStampDelta(1); setStampReason(''); }}
                  className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 text-[10px] font-bold"
                  title="Manage Kado Circle stamps"
                >
                  <Stamp className="w-3.5 h-3.5" /> {u.loyaltyStamps ?? 0}
                </button>
              )}
              <button type="button" onClick={() => startEdit(u)} className="dash-muted hover:text-kado-red p-1"><Pencil className="w-4 h-4" /></button>
              <button type="button" onClick={() => { setResetUserId(u.id); setResetPassword(''); setResetError(''); }} className="dash-muted hover:text-kado-red p-1" title="Reset password">
                <KeyRound className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(u.id)}
                onBlur={() => setConfirmDeleteId((id) => (id === u.id ? null : id))}
                disabled={u.id === currentUserId || deletingId === u.id}
                className={`p-1 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  confirmDeleteId === u.id ? 'bg-red-100 text-red-600' : 'text-red-400 hover:text-red-600'
                }`}
                title={
                  u.id === currentUserId
                    ? 'Cannot delete your own account'
                    : confirmDeleteId === u.id
                      ? 'Click again to confirm delete'
                      : 'Delete user (removes login and profile)'
                }
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={submit} className="w-full max-w-md dash-card rounded-[2rem] p-6 md:p-8 shadow-2xl">
            <h2 className="font-display font-bold text-xl dash-heading mb-4">{editingId ? 'Edit user' : 'New user'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30" />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Initial Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => {
                    const role = e.target.value as Role;
                    setForm((f) => ({
                      ...f,
                      role,
                      branchId: role === 'admin' || role === 'customer' ? '' : f.branchId,
                    }));
                  }}
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                >
                  {(editingId ? ALL_DISPLAY_ROLES : CREATABLE_ROLES).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {form.role === 'admin' && (
                  <p className="text-[10px] dash-muted mt-1">Admin accounts have access to every branch — no branch assignment.</p>
                )}
                {form.role === 'customer' && (
                  <p className="text-[10px] dash-muted mt-1">Customer accounts are for online ordering and Kado Circle — not shown in the default team list.</p>
                )}
              </div>
              {(form.role === 'barista' || form.role === 'staff') && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">
                    Branch <span className="text-kado-red">*</span>
                  </label>
                  <select
                    value={form.branchId}
                    onChange={(e) => { setForm((f) => ({ ...f, branchId: e.target.value })); setFormError(''); }}
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                    required
                  >
                    <option value="">— select branch —</option>
                    {activeBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <p className="text-[10px] dash-muted mt-1">
                    {form.role === 'staff' ? 'Staff' : 'Barista'} only sees orders for this branch.
                    {editingId ? ' They must sign out and back in after a branch change.' : ''}
                  </p>
                </div>
              )}
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={cancel} className="rounded-xl dash-border border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted hover:bg-kado-cream transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors disabled:opacity-60">{saving ? 'Saving…' : editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
      {resetUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={submitResetPassword} className="w-full max-w-md dash-card rounded-[2rem] p-6 md:p-8 shadow-2xl">
            <h2 className="font-display font-bold text-xl dash-heading mb-4">Reset password</h2>
            <p className="text-xs dash-muted mb-3">
              Set a new password for this account.
            </p>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">New password</label>
            <input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
            {resetError && <p className="mt-2 text-xs text-red-600">{resetError}</p>}
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => { setResetUserId(null); setResetPassword(''); setResetError(''); }} className="rounded-xl dash-border border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted hover:bg-kado-cream transition-colors">Cancel</button>
              <button type="submit" disabled={resetting} className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors disabled:opacity-60">{resetting ? 'Updating…' : 'Update password'}</button>
            </div>
          </form>
        </div>
      )}
      {stampUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md dash-card rounded-[2rem] p-6 md:p-8 shadow-2xl">
            <h2 className="font-display font-bold text-xl dash-heading mb-1 flex items-center gap-2">
              <Stamp className="w-5 h-5 text-kado-red" /> Kado Circle stamps
            </h2>
            <p className="text-xs dash-muted mb-4">{stampUser.name} · current balance <strong>{stampUser.loyaltyStamps ?? 0}</strong></p>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Adjustment</label>
            <div className="flex items-center gap-2 mb-3">
              <button type="button" onClick={() => setStampDelta((d) => d - 1)} className="rounded-lg dash-border border w-9 h-9 text-lg font-bold dash-muted">−</button>
              <input
                type="number"
                value={stampDelta}
                onChange={(e) => setStampDelta(parseInt(e.target.value || '0', 10))}
                className="w-full text-center rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              />
              <button type="button" onClick={() => setStampDelta((d) => d + 1)} className="rounded-lg dash-border border w-9 h-9 text-lg font-bold dash-muted">+</button>
            </div>
            <p className="text-[11px] dash-muted mb-3">New balance: <strong>{Math.max(0, (stampUser.loyaltyStamps ?? 0) + stampDelta)}</strong></p>
            <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Reason (optional)</label>
            <input
              value={stampReason}
              onChange={(e) => setStampReason(e.target.value)}
              placeholder="e.g. service recovery, promo"
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setStampUserId(null)} className="rounded-xl dash-border border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted hover:bg-kado-cream transition-colors">Cancel</button>
              <button
                type="button"
                onClick={() => { adjustLoyaltyStamps(stampUser.id, stampDelta, stampReason.trim() || undefined); setStampUserId(null); }}
                disabled={stampDelta === 0}
                className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors disabled:opacity-60"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
