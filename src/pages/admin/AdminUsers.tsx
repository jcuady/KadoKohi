import { useState, useMemo, type FormEvent } from 'react';
import type { Role } from '../../types/domain';
import { useUserStore } from '../../store/userStore';
import { useBranchStore } from '../../store/branchStore';
import { Plus, Pencil, Trash2, Shield, AlertCircle } from 'lucide-react';

const ROLES: Role[] = ['admin', 'barista', 'customer'];

type FormData = { name: string; email: string; role: Role; branchId: string };
const emptyForm: FormData = { name: '', email: '', role: 'customer', branchId: '' };

export default function AdminUsers() {
  const users = useUserStore((s) => s.users);
  const addUser = useUserStore((s) => s.addUser);
  const updateUser = useUserStore((s) => s.updateUser);
  const removeUser = useUserStore((s) => s.removeUser);
  const branches = useBranchStore((s) => s.branches);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');

  const activeBranches = useMemo(() => branches.filter((b) => b.status === 'active'), [branches]);

  const startAdd = () => { setEditingId(null); setForm(emptyForm); setFormError(''); setShowForm(true); };
  const startEdit = (u: typeof users[0]) => {
    setEditingId(u.id);
    setForm({ name: u.name, email: u.email, role: u.role, branchId: u.branchId ?? '' });
    setFormError('');
    setShowForm(true);
  };
  const cancel = () => { setShowForm(false); setEditingId(null); setFormError(''); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.email.trim()) return;

    if (form.role === 'barista' && !form.branchId) {
      setFormError('A branch is required for barista accounts.');
      return;
    }

    if (form.role === 'barista' && !activeBranches.some((b) => b.id === form.branchId)) {
      setFormError('Selected branch is not active. Choose an active branch.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      branchId: form.role === 'barista' ? form.branchId : undefined,
    };
    if (editingId) updateUser(editingId, payload);
    else addUser(payload);
    cancel();
  };

  return (
    <div className="dash-page max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading">Users</h1>
          <p className="dash-muted text-sm mt-1">{users.length} user(s) — manage roles and branch assignments.</p>
        </div>
        <button type="button" onClick={startAdd} className="rounded-xl bg-kado-dark text-kado-cream px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add user
        </button>
      </div>

      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="rounded-xl dash-card border px-5 py-4 flex items-center gap-4">
            <Shield className="w-5 h-5 text-kado-red shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm dash-heading">{u.name}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest dash-card-alt dash-muted px-2 py-0.5 rounded-full dash-border border">{u.role}</span>
              </div>
              <p className="text-[10px] dash-muted">{u.email}{u.branchId ? ` · ${branches.find((b) => b.id === u.branchId)?.name ?? u.branchId}` : ''}</p>
            </div>
            <button type="button" onClick={() => startEdit(u)} className="dash-muted hover:text-kado-red p-1"><Pencil className="w-4 h-4" /></button>
            <button type="button" onClick={() => removeUser(u.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
          </li>
        ))}
      </ul>

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
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider dash-muted mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))} className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {form.role === 'barista' && (
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
                  <p className="text-[10px] dash-muted mt-1">Barista will only see orders for this branch.</p>
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
              <button type="submit" className="rounded-xl bg-kado-red text-kado-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-dark transition-colors">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
