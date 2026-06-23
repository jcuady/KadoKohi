import { useState, type FormEvent } from 'react';
import { Lock, User, Mail, Shield, MapPin, Save } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useBranchStore } from '../../store/branchStore';
import { authRepo } from '../../lib/supabase/repositories/auth';
import { formatAuthErrorMessage } from '../../lib/supabase/authSession';
import { hasAllBranchAccess } from '../../lib/roles';

type Props = {
  portalLabel: string;
};

export default function InternalAccountSettings({ portalLabel }: Props) {
  const user = useAuthStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const branches = useBranchStore((s) => s.branches);

  const [name, setName] = useState(user?.name ?? '');
  const [nameMsg, setNameMsg] = useState('');
  const [nameError, setNameError] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  if (!user) return null;

  const branchLabel = user.branchId
    ? branches.find((b) => b.id === user.branchId)?.name ?? user.branchId
    : hasAllBranchAccess(user)
      ? 'All branches'
      : 'Not assigned';

  const handleSaveName = async (e: FormEvent) => {
    e.preventDefault();
    setNameMsg('');
    setNameError('');
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Name is required.');
      return;
    }
    setSavingName(true);
    try {
      await updateUser(user.id, { name: trimmed });
      useAuthStore.setState({ user: { ...user, name: trimmed } });
      setNameMsg('Name updated.');
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Unable to update name.');
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError('');
    if (newPassword.trim().length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      await authRepo.updatePassword(newPassword.trim());
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg('Password updated. Use it the next time you sign in.');
    } catch (err) {
      setPasswordError(formatAuthErrorMessage(err, 'Unable to change password.'));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-xl dash-page">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red mb-2">{portalLabel}</p>
      <h1 className="font-display text-3xl md:text-4xl font-bold dash-heading mb-1">Account settings</h1>
      <p className="dash-muted text-sm mb-8">Update your display name and password for this portal.</p>

      <div className="rounded-2xl dash-card border dash-border p-6 mb-6 space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-widest dash-heading">Your account</h2>
        <div className="flex items-center gap-3 text-sm">
          <Mail className="w-4 h-4 dash-muted shrink-0" />
          <span className="dash-muted">Email</span>
          <span className="font-semibold dash-heading ml-auto truncate">{user.email}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Shield className="w-4 h-4 dash-muted shrink-0" />
          <span className="dash-muted">Role</span>
          <span className="font-semibold dash-heading ml-auto capitalize">{user.role}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <MapPin className="w-4 h-4 dash-muted shrink-0" />
          <span className="dash-muted">Branch</span>
          <span className="font-semibold dash-heading ml-auto text-right">{branchLabel}</span>
        </div>
        <p className="text-[10px] dash-muted leading-relaxed">
          Branch assignment is managed by an administrator. Contact admin if you need a different branch.
        </p>
      </div>

      <form onSubmit={handleSaveName} className="rounded-2xl dash-card border dash-border p-6 mb-6 space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-widest dash-heading flex items-center gap-2">
          <User className="w-4 h-4" /> Display name
        </h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
        />
        {nameError && <p className="text-xs text-red-600">{nameError}</p>}
        {nameMsg && <p className="text-xs text-emerald-700">{nameMsg}</p>}
        <button
          type="submit"
          disabled={savingName}
          className="inline-flex items-center gap-2 rounded-xl bg-kado-dark text-kado-cream px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-kado-red transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {savingName ? 'Saving…' : 'Save name'}
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="rounded-2xl dash-card border dash-border p-6 space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-widest dash-heading flex items-center gap-2">
          <Lock className="w-4 h-4" /> Password
        </h2>
        <p className="text-xs dash-muted">Use at least 8 characters. You stay signed in after changing your password.</p>
        <div>
          <label htmlFor="internal-new-password" className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1.5">
            New password
          </label>
          <input
            id="internal-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
            className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
          />
        </div>
        <div>
          <label htmlFor="internal-confirm-password" className="block text-[10px] font-bold uppercase tracking-wider dash-muted mb-1.5">
            Confirm password
          </label>
          <input
            id="internal-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
            className="w-full rounded-xl dash-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kado-red/30"
          />
        </div>
        {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
        {passwordMsg && <p className="text-xs text-emerald-700">{passwordMsg}</p>}
        <button
          type="submit"
          disabled={changingPassword}
          className="rounded-xl border dash-border px-5 py-2.5 text-xs font-bold uppercase tracking-wider dash-heading hover:border-kado-red/40 hover:text-kado-red transition-colors disabled:opacity-60"
        >
          {changingPassword ? 'Updating…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
