import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Coffee, Package, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { Role } from '../../types/domain';

type InternalTab = 'admin' | 'barista' | 'staff';

const INTERNAL_ROLES: InternalTab[] = ['admin', 'barista', 'staff'];

export default function InternalLogin() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);

  const [tab, setTab] = useState<InternalTab>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchTab = (nextTab: InternalTab) => {
    setTab(nextTab);
    setError('');
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch {
      setError('Invalid credentials.');
      setSubmitting(false);
      return;
    }

    const profile = useAuthStore.getState().user;
    const role = profile?.role as Role | undefined;
    if (!profile || !role || !INTERNAL_ROLES.includes(role as InternalTab)) {
      await useAuthStore.getState().logout();
      setError('This portal is for admin, barista, and staff accounts only.');
      setSubmitting(false);
      return;
    }

    if (role !== tab) {
      // End the session so a mismatched login does not leave the user authenticated.
      await useAuthStore.getState().logout();
      setError(`This account is registered as ${role}. Switch to the ${role} tab or use the correct account.`);
      setSubmitting(false);
      return;
    }

    if (role === 'admin') navigate('/admin', { replace: true });
    else if (role === 'barista') navigate('/barista', { replace: true });
    else navigate('/staff', { replace: true });
  };

  const tabs: { key: InternalTab; label: string; icon: typeof Shield; desc: string }[] = [
    { key: 'admin', label: 'Admin', icon: Shield, desc: 'Operations, catalog, users, and settings.' },
    { key: 'barista', label: 'Barista', icon: Coffee, desc: 'Queue, board, kiosk and POS operations.' },
    { key: 'staff', label: 'Staff', icon: Package, desc: 'Merch and booth booking operations.' },
  ];

  return (
    <div className="min-h-screen bg-kado-dark/95 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#1b1b1b] p-8 md:p-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-kado-red text-kado-cream flex items-center justify-center font-display font-bold text-xl rounded-sm">
              角
            </div>
            <span className="font-display font-bold text-xl text-kado-cream">Kado Kohi Internal</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Internal Access</h1>
          <p className="text-sm text-white/60 mt-2">Sign in with credentials provisioned by your administrator.</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => switchTab(key)}
              className={`flex flex-col items-center gap-1 rounded-xl py-3 px-2 text-xs font-bold uppercase tracking-wider transition-all ${
                tab === key
                  ? 'bg-kado-red text-kado-cream shadow-lg'
                  : 'bg-[#232323] border border-white/10 text-white/70 hover:border-kado-red/40 hover:text-kado-cream'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs text-white/65 bg-white/5 rounded-xl px-4 py-2.5 mb-6 text-center">
          {tabs.find((currentTab) => currentTab.key === tab)?.desc}
        </p>

        {error && (
          <div className="flex items-start gap-2 bg-red-950/40 border border-red-500/30 text-red-200 rounded-xl px-4 py-3 mb-4 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              required
              className="w-full rounded-xl border border-white/15 bg-[#232323] px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-kado-red/30 focus:border-kado-red"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              required
              className="w-full rounded-xl border border-white/15 bg-[#232323] px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-kado-red/30 focus:border-kado-red"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-kado-red text-kado-cream py-4 font-bold uppercase tracking-wider text-sm hover:bg-[#7d1115] transition-colors mt-2 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : `Sign in — ${tabs.find((currentTab) => currentTab.key === tab)?.label}`}
          </button>
        </form>

        <Link to="/" className="mt-6 block text-center text-sm font-semibold text-white/55 hover:text-kado-red">
          Back to site
        </Link>
      </div>
    </div>
  );
}
