import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useBranchStore } from '../../store/branchStore';
import type { Role } from '../../types/domain';
import { Coffee, Shield, User as UserIcon, AlertCircle } from 'lucide-react';

type Tab = 'admin' | 'barista' | 'customer';

const DEMO_CREDENTIALS: Record<Tab, { email: string; password: string }> = {
  admin: { email: 'admin@kadokohi.com', password: 'admin1234' },
  barista: { email: 'barista@kadokohi.com', password: 'barista1234' },
  customer: { email: 'customer@kadokohi.com', password: 'customer1234' },
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginAs = useAuthStore((s) => s.loginAs);
  const users = useUserStore((s) => s.users);
  const branches = useBranchStore((s) => s.branches);
  const from = (location.state as { from?: string } | null)?.from;

  const [tab, setTab] = useState<Tab>('admin');
  const [email, setEmail] = useState(DEMO_CREDENTIALS.admin.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.admin.password);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [error, setError] = useState('');

  const switchTab = (t: Tab) => {
    setTab(t);
    setEmail(DEMO_CREDENTIALS[t].email);
    setPassword(DEMO_CREDENTIALS[t].password);
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
      setError('No account found with that email. Try a demo credential or sign up.');
      return;
    }

    const role: Exclude<Role, 'guest'> = matchedUser.role === 'guest' ? 'customer' : matchedUser.role;

    loginAs(role, {
      name: matchedUser.name,
      email: matchedUser.email,
      branchId: role === 'barista' ? (matchedUser.branchId ?? branchId) : undefined,
    });

    if (role === 'admin') navigate(from && from.startsWith('/admin') ? from : '/admin', { replace: true });
    else if (role === 'barista') navigate('/barista', { replace: true });
    else navigate(from && from.startsWith('/account') ? from : '/', { replace: true });
  };

  const tabs: { key: Tab; label: string; icon: typeof Coffee; desc: string }[] = [
    { key: 'admin', label: 'Admin', icon: Shield, desc: 'Full access — menu, branches, orders, POS' },
    { key: 'barista', label: 'Barista', icon: Coffee, desc: 'Kiosk — queue, POS, order board' },
    { key: 'customer', label: 'Customer', icon: UserIcon, desc: 'Online ordering, loyalty, profile' },
  ];

  return (
    <div className="min-h-screen bg-kado-cream flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-[2rem] border border-kado-dark/10 bg-kado-offwhite p-8 md:p-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-kado-red text-kado-cream flex items-center justify-center font-display font-bold text-xl rounded-sm">
              角
            </div>
            <span className="font-display font-bold text-xl text-kado-dark">Kado Kohi</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-kado-dark">Sign in to your portal</h1>
          <p className="text-sm text-kado-dark/60 mt-2">
            Local auth — validates against the user directory.
          </p>
        </div>

        {/* Role tabs */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => switchTab(key)}
              className={`flex flex-col items-center gap-1 rounded-xl py-3 px-2 text-xs font-bold uppercase tracking-wider transition-all ${
                tab === key
                  ? 'bg-kado-dark text-kado-cream shadow-lg'
                  : 'bg-white border border-kado-dark/10 text-kado-dark/70 hover:border-kado-red/40 hover:text-kado-red'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs text-kado-dark/55 bg-kado-cream/70 rounded-xl px-4 py-2.5 mb-6 text-center">
          {tabs.find((t) => t.key === tab)?.desc}
        </p>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-kado-dark/70 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="w-full rounded-xl border border-kado-dark/15 bg-white px-4 py-3 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/30 focus:border-kado-red"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-kado-dark/70 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full rounded-xl border border-kado-dark/15 bg-white px-4 py-3 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/30 focus:border-kado-red"
            />
          </div>

          {tab === 'barista' && (
            <div>
              <label htmlFor="branch" className="block text-xs font-bold uppercase tracking-wider text-kado-dark/70 mb-1.5">
                Branch
              </label>
              <select
                id="branch"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-xl border border-kado-dark/15 bg-white px-4 py-3 text-sm text-kado-dark focus:outline-none focus:ring-2 focus:ring-kado-red/30 focus:border-kado-red"
              >
                {branches.filter((b) => b.status === 'active').map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-kado-red text-kado-cream py-4 font-bold uppercase tracking-wider text-sm hover:bg-kado-dark transition-colors mt-2"
          >
            Sign in as {tabs.find((t) => t.key === tab)?.label}
          </button>
        </form>

        {/* Auto-fill hint */}
        <div className="mt-6 rounded-xl bg-kado-dark/5 border border-kado-dark/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-kado-dark/50 mb-2">Demo credentials (auto-filled)</p>
          <div className="grid grid-cols-3 gap-3 text-[11px] text-kado-dark/70">
            <div>
              <span className="font-bold block text-kado-dark">Admin</span>
              admin@kadokohi.com<br />admin1234
            </div>
            <div>
              <span className="font-bold block text-kado-dark">Barista</span>
              barista@kadokohi.com<br />barista1234
            </div>
            <div>
              <span className="font-bold block text-kado-dark">Customer</span>
              customer@kadokohi.com<br />customer1234
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-kado-dark/60">
          New customer?{' '}
          <Link to="/auth/signup" className="font-bold text-kado-red hover:underline">
            Create an account
          </Link>
        </p>

        <Link to="/" className="mt-3 block text-center text-sm font-semibold text-kado-dark/50 hover:text-kado-red">
          Back to site
        </Link>
      </div>
    </div>
  );
}
