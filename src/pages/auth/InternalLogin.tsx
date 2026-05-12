import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Coffee, Package, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useBranchStore } from '../../store/branchStore';
import type { Role } from '../../types/domain';

type InternalTab = 'admin' | 'barista' | 'staff';

const DEMO_CREDENTIALS: Record<InternalTab, { email: string; password: string }> = {
  admin: { email: 'admin@kadokohi.com', password: 'admin1234' },
  barista: { email: 'barista@kadokohi.com', password: 'barista1234' },
  staff: { email: 'staff@kadokohi.com', password: 'staff1234' },
};

export default function InternalLogin() {
  const navigate = useNavigate();
  const loginAs = useAuthStore((s) => s.loginAs);
  const users = useUserStore((s) => s.users);
  const branches = useBranchStore((s) => s.branches);

  const [tab, setTab] = useState<InternalTab>('admin');
  const [email, setEmail] = useState(DEMO_CREDENTIALS.admin.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.admin.password);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [error, setError] = useState('');

  const switchTab = (nextTab: InternalTab) => {
    setTab(nextTab);
    setEmail(DEMO_CREDENTIALS[nextTab].email);
    setPassword(DEMO_CREDENTIALS[nextTab].password);
    setError('');
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    const matchedUser = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!matchedUser) {
      setError('No internal account found with that email.');
      return;
    }

    if (!['admin', 'barista', 'staff'].includes(matchedUser.role)) {
      setError('This route is for internal team members only.');
      return;
    }

    const role = matchedUser.role as Exclude<Role, 'guest' | 'customer'>;
    loginAs(role, {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      branchId: role === 'barista' || role === 'staff' ? (matchedUser.branchId ?? branchId) : undefined,
      createdAt: matchedUser.createdAt,
    });

    if (role === 'admin') navigate('/admin', { replace: true });
    if (role === 'barista') navigate('/barista', { replace: true });
    if (role === 'staff') navigate('/staff', { replace: true });
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
          <p className="text-sm text-white/60 mt-2">Authorized team portal only.</p>
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
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
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
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full rounded-xl border border-white/15 bg-[#232323] px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-kado-red/30 focus:border-kado-red"
            />
          </div>

          {(tab === 'barista' || tab === 'staff') && (
            <div>
              <label htmlFor="branch" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                Branch
              </label>
              <select
                id="branch"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#232323] px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-kado-red/30 focus:border-kado-red"
              >
                {branches
                  .filter((b) => b.status === 'active')
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-kado-red text-kado-cream py-4 font-bold uppercase tracking-wider text-sm hover:bg-[#7d1115] transition-colors mt-2"
          >
            Sign in as {tabs.find((currentTab) => currentTab.key === tab)?.label}
          </button>
        </form>

        <p className="mt-6 rounded-xl bg-black/20 border border-white/10 p-4 text-[11px] text-white/65">
          Use internal credentials provisioned in the user directory.
        </p>

        <Link to="/" className="mt-4 block text-center text-sm font-semibold text-white/55 hover:text-kado-red">
          Back to site
        </Link>
      </div>
    </div>
  );
}
