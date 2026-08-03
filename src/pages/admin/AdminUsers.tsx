import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Role } from '../../types/domain';
import { useUserStore } from '../../store/userStore';
import { hasAllBranchAccess, isInternalRole, matchesUserSearch } from '../../lib/roles';
import { useBranchStore } from '../../store/branchStore';
import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  KeyRound,
  Stamp,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { authRepo } from '../../lib/supabase/repositories/auth';
import { useAuthStore } from '../../store/authStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useConfirmDialog } from '../../components/ui/ConfirmDialog';

const CREATABLE_ROLES: Role[] = ['admin', 'barista', 'staff', 'customer'];
const ALL_DISPLAY_ROLES: Role[] = ['admin', 'barista', 'staff', 'customer'];
const PAGE_SIZE = 12;

type RoleFilter = 'team' | Role | 'all';
type FormData = { name: string; email: string; role: Role; branchId: string };
const emptyForm: FormData = { name: '', email: '', role: 'barista', branchId: '' };

const ROLE_BADGE: Record<Role, string> = {
  admin: 'bg-kado-red/10 text-kado-red border-kado-red/25',
  barista: 'bg-amber-50 text-amber-900 border-amber-200',
  staff: 'bg-sky-50 text-sky-900 border-sky-200',
  customer: 'bg-kado-cream/80 text-kado-dark/70 border-kado-dark/10',
  guest: 'bg-kado-dark/5 text-kado-dark/60 border-kado-dark/10',
};

function roleRank(r: Role): number {
  return r === 'admin' ? 0 : r === 'barista' ? 1 : r === 'staff' ? 2 : 3;
}

/**
 * Admin Users — dense table CRUD with filters + client pagination.
 * Create/update/delete still go through authRepo / userStore (edge for internal accounts).
 */
export default function AdminUsers() {
  const { confirm, confirmDialog } = useConfirmDialog();
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
  const [page, setPage] = useState(1);

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
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState('');

  const activeBranches = useMemo(() => branches.filter((b) => b.status === 'active'), [branches]);
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? id;

  const teamCount = useMemo(() => users.filter((u) => isInternalRole(u.role)).length, [users]);
  const customerCount = useMemo(() => users.filter((u) => u.role === 'customer').length, [users]);

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
      const d = roleRank(a.role) - roleRank(b.role);
      if (d !== 0) return d;
      return a.name.localeCompare(b.name);
    });
  }, [users, roleFilter, branchFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, pageSafe]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, branchFilter, search]);

  useEffect(() => {
    if (!saveOk) return;
    const t = window.setTimeout(() => setSaveOk(''), 5000);
    return () => window.clearTimeout(t);
  }, [saveOk]);

  const handleDelete = async (id: string) => {
    setDeleteError('');
    if (id === currentUserId) {
      setDeleteError('You cannot delete your own account while signed in.');
      return;
    }
    const user = users.find((u) => u.id === id);
    if (
      !(await confirm({
        title: user ? `Delete “${user.name}”?` : 'Delete user?',
        description: 'This removes the account permanently.',
        confirmLabel: 'Delete',
      }))
    ) {
      return;
    }
    setDeletingId(id);
    try {
      await removeUser(id);
      setSaveOk('User removed.');
      await hydrateUsers();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unable to delete user.');
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

  const startEdit = (u: (typeof users)[0]) => {
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
        setSaveOk(`Updated ${payload.name}.`);
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
        addUser({ id: newId, ...payload });
        await hydrateUsers();
        setSaveOk(`Created ${payload.name}.`);
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
      setSaveOk('Password updated.');
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

  const rangeStart = filteredUsers.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(pageSafe * PAGE_SIZE, filteredUsers.length);

  return (
    <div className="dash-page max-w-6xl space-y-5 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red">Administration</p>
          <h1 className="font-display text-3xl font-bold dash-heading md:text-4xl">Users</h1>
          <p className="mt-1 text-sm dash-muted">
            {teamCount} team · {customerCount} customers — create accounts, assign branches, reset passwords.
          </p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-kado-red px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-kado-cream transition-colors hover:bg-kado-dark"
        >
          <Plus className="h-4 w-4" /> Add user
        </button>
      </div>

      {saveOk ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800">
          {saveOk}
        </p>
      ) : null}
      {deleteError ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{deleteError}</span>
        </div>
      ) : null}

      <div className="space-y-3 rounded-2xl border dash-border dash-card p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 dash-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-xl dash-input py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            aria-label="Search users"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Role filter">
            {rolePills.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setRoleFilter(id)}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  roleFilter === id
                    ? 'bg-kado-red text-white'
                    : 'border dash-border dash-muted hover:bg-kado-cream'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider dash-muted">
            Branch
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="min-h-[36px] rounded-lg border dash-input px-3 py-1.5 text-xs font-semibold normal-case tracking-normal focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            >
              <option value="all">All branches</option>
              {activeBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border dash-border dash-card">
        {filteredUsers.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm dash-muted">
            {search.trim()
              ? 'No users match your search.'
              : roleFilter === 'customer'
                ? 'No customer accounts found. Customers usually sign up on the site.'
                : 'No users match these filters.'}
          </div>
        ) : (
          <>
            <div className="dash-table-scroll custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="dash-card-alt hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold dash-heading">{u.name}</p>
                          {u.role === 'customer' ? (
                            <p className="mt-0.5 text-[10px] tabular-nums dash-muted">
                              Stamps: {u.loyaltyStamps ?? 0}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[14rem] truncate text-xs dash-muted">{u.email}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${ROLE_BADGE[u.role]}`}
                        >
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs dash-muted">
                        {hasAllBranchAccess(u)
                          ? 'All branches'
                          : u.branchId
                            ? branchName(u.branchId)
                            : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {u.role === 'customer' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setStampUserId(u.id);
                                setStampDelta(1);
                                setStampReason('');
                              }}
                              className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-[10px] font-bold text-amber-900 hover:bg-amber-100"
                              title="Manage stamps"
                              aria-label={`Manage stamps for ${u.name}`}
                            >
                              <Stamp className="h-3.5 w-3.5" />
                              {u.loyaltyStamps ?? 0}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => startEdit(u)}
                            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border dash-border dash-muted hover:border-kado-red/30 hover:text-kado-red"
                            aria-label={`Edit ${u.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setResetUserId(u.id);
                              setResetPassword('');
                              setResetError('');
                            }}
                            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border dash-border dash-muted hover:border-kado-red/30 hover:text-kado-red"
                            aria-label={`Reset password for ${u.name}`}
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(u.id)}
                            disabled={u.id === currentUserId || deletingId === u.id}
                            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-transparent px-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                            title={
                              u.id === currentUserId ? 'Cannot delete your own account' : 'Delete user'
                            }
                            aria-label={`Delete ${u.name}`}
                          >
                            {deletingId === u.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t dash-border px-4 py-3">
              <p className="text-[11px] dash-muted">
                Showing {rangeStart}–{rangeEnd} of {filteredUsers.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border dash-border dash-muted hover:bg-kado-cream disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[5.5rem] text-center text-[11px] font-semibold dash-muted">
                  Page {pageSafe} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border dash-border dash-muted hover:bg-kado-cream disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-kado-dark/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
          <form
            onSubmit={(e) => void submit(e)}
            className="flex max-h-[min(92dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border dash-border bg-[var(--color-dash-surface)] shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b dash-border px-5 py-4">
              <h2 className="font-display text-xl font-bold dash-heading">
                {editingId ? 'Edit user' : 'New user'}
              </h2>
              <button
                type="button"
                onClick={cancel}
                className="flex h-10 w-10 items-center justify-center rounded-full border dash-border dash-muted hover:bg-kado-cream"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto px-5 py-5">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                />
              </div>
              {!editingId ? (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">
                    Initial password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                  />
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">Role</label>
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
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {form.role === 'admin' ? (
                  <p className="mt-1 text-[10px] dash-muted">Admins access every branch — no branch assignment.</p>
                ) : null}
                {form.role === 'customer' ? (
                  <p className="mt-1 text-[10px] dash-muted">
                    Customers use online ordering and Kado Circle — hidden from the default Team filter.
                  </p>
                ) : null}
              </div>
              {form.role === 'barista' || form.role === 'staff' ? (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">
                    Branch <span className="text-kado-red">*</span>
                  </label>
                  <select
                    value={form.branchId}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, branchId: e.target.value }));
                      setFormError('');
                    }}
                    className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
                    required
                  >
                    <option value="">— select branch —</option>
                    {activeBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] dash-muted">
                    {form.role === 'staff' ? 'Staff' : 'Barista'} only sees this branch.
                    {editingId ? ' They must sign out and back in after a branch change.' : ''}
                  </p>
                </div>
              ) : null}
              {formError ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t dash-border px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancel}
                className="min-h-[48px] rounded-xl border dash-border px-5 text-xs font-bold uppercase tracking-wider dash-muted hover:bg-kado-cream sm:min-w-[7rem]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-kado-red px-6 text-xs font-bold uppercase tracking-wider text-kado-cream hover:bg-kado-dark disabled:opacity-60 sm:min-w-[8rem]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create user'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {resetUserId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-kado-dark/50 px-4 backdrop-blur-[2px]">
          <form
            onSubmit={(e) => void submitResetPassword(e)}
            className="w-full max-w-md rounded-2xl border dash-border bg-[var(--color-dash-surface)] p-6 shadow-xl"
          >
            <h2 className="mb-2 font-display text-xl font-bold dash-heading">Reset password</h2>
            <p className="mb-4 text-xs dash-muted">
              Instant admin set — use when someone cannot receive the reset email. Share the temporary password
              securely.
            </p>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">New password</label>
            <input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
            {resetError ? <p className="mt-2 text-xs text-red-600">{resetError}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setResetUserId(null);
                  setResetPassword('');
                  setResetError('');
                }}
                className="rounded-xl border dash-border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted hover:bg-kado-cream"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetting}
                className="rounded-xl bg-kado-red px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-kado-cream hover:bg-kado-dark disabled:opacity-60"
              >
                {resetting ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {stampUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-kado-dark/50 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border dash-border bg-[var(--color-dash-surface)] p-6 shadow-xl">
            <h2 className="mb-1 flex items-center gap-2 font-display text-xl font-bold dash-heading">
              <Stamp className="h-5 w-5 text-kado-red" /> Kado Circle stamps
            </h2>
            <p className="mb-4 text-xs dash-muted">
              {stampUser.name} · balance <strong>{stampUser.loyaltyStamps ?? 0}</strong>
            </p>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">Adjustment</label>
            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStampDelta((d) => d - 1)}
                className="h-10 w-10 rounded-lg border dash-border text-lg font-bold dash-muted"
              >
                −
              </button>
              <input
                type="number"
                value={stampDelta}
                onChange={(e) => setStampDelta(parseInt(e.target.value || '0', 10))}
                className="w-full rounded-xl dash-input px-4 py-2.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
              />
              <button
                type="button"
                onClick={() => setStampDelta((d) => d + 1)}
                className="h-10 w-10 rounded-lg border dash-border text-lg font-bold dash-muted"
              >
                +
              </button>
            </div>
            <p className="mb-3 text-[11px] dash-muted">
              New balance: <strong>{Math.max(0, (stampUser.loyaltyStamps ?? 0) + stampDelta)}</strong>
            </p>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider dash-muted">
              Reason (optional)
            </label>
            <input
              value={stampReason}
              onChange={(e) => setStampReason(e.target.value)}
              placeholder="e.g. service recovery"
              className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStampUserId(null)}
                className="rounded-xl border dash-border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-muted hover:bg-kado-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  adjustLoyaltyStamps(stampUser.id, stampDelta, stampReason.trim() || undefined);
                  setStampUserId(null);
                  setSaveOk('Stamps updated.');
                }}
                disabled={stampDelta === 0}
                className="rounded-xl bg-kado-red px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-kado-cream hover:bg-kado-dark disabled:opacity-60"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {confirmDialog}
    </div>
  );
}
