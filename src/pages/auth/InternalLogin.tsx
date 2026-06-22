import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { AlertCircle, Coffee, Lock, Package, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { Role } from '../../types/domain';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthBrandMark from '../../components/auth/AuthBrandMark';
import InternalAuthSessionGate from '../../components/auth/InternalAuthSessionGate';
import InternalSignInForm from '../../components/auth/InternalSignInForm';

type InternalTab = 'admin' | 'barista' | 'staff';

const INTERNAL_ROLES: InternalTab[] = ['admin', 'barista', 'staff'];

const tabs: { key: InternalTab; label: string; icon: typeof Shield; desc: string }[] = [
  { key: 'admin', label: 'Admin', icon: Shield, desc: 'Branches, menu, orders, users, and settings.' },
  { key: 'barista', label: 'Barista', icon: Coffee, desc: 'Queue, board, kiosk display, and POS.' },
  { key: 'staff', label: 'Staff', icon: Package, desc: 'Merch fulfillment and booth bookings.' },
];

export default function InternalLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const logout = useAuthStore((s) => s.logout);
  const locationNotice = (location.state as { notice?: string } | null)?.notice;

  const [tab, setTab] = useState<InternalTab>('admin');
  const [error, setError] = useState('');

  const switchTab = (nextTab: InternalTab) => {
    setTab(nextTab);
    setError('');
  };

  useEffect(() => {
    if (!isSignedIn || loading || !user) return;
    const role = user.role as Role;
    if (!INTERNAL_ROLES.includes(role as InternalTab)) {
      void logout();
      setError('This portal is for admin, barista, and staff accounts only.');
      return;
    }
    if (role !== tab) {
      void logout();
      setError(`This account is registered as ${role}. Switch to the ${role} tab or use the correct account.`);
      return;
    }
    if (role === 'admin') navigate('/admin', { replace: true });
    else if (role === 'barista') navigate('/barista', { replace: true });
    else navigate('/staff', { replace: true });
  }, [isSignedIn, loading, user, tab, logout, navigate]);

  const activeTab = tabs.find((t) => t.key === tab);

  const formPanel = (
    <div className="w-full max-w-md mx-auto lg:max-w-none">
      <div className="lg:hidden mb-8">
        <AuthBrandMark variant="internal" subtitle="Authorized team access only." />
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-kado-red mb-2">Management portal</p>
      <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">Sign in</h1>
      <p className="text-sm text-white/60 mb-2">Use the email and password your administrator gave you.</p>
      <p className="text-xs text-white/45 mb-6">
        Team accounts are created in Admin → Users. There is no self-registration on this portal.
      </p>

      {locationNotice && !error && <AuthAlert variant="success" tone="internal">{locationNotice}</AuthAlert>}
      {error && <AuthAlert variant="error" tone="internal">{error}</AuthAlert>}

      <div className="grid grid-cols-3 gap-2 mb-4">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => switchTab(key)}
            className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
              tab === key
                ? 'bg-kado-red text-kado-cream shadow-lg shadow-kado-red/25'
                : 'bg-[#232323] border border-white/10 text-white/70 hover:border-kado-red/40 hover:text-kado-cream'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <p className="text-xs text-white/65 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 mb-6 text-center">
        {activeTab?.desc}
      </p>

      <InternalAuthSessionGate loadingMessage="Completing sign-in…">
        <InternalSignInForm expectedRole={tab} />
      </InternalAuthSessionGate>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[11px] text-white/55">
        <Lock className="w-4 h-4 shrink-0 mt-0.5 text-kado-red" />
        <span>
          Activity on this portal is logged for security. Do not share your password or leave sessions open on shared
          devices.
        </span>
      </div>

      <Link
        to="/"
        className="mt-6 block text-center text-sm font-semibold text-white/50 hover:text-kado-red transition-colors"
      >
        Back to public site
      </Link>
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col bg-[#141414] lg:flex-row">
      <aside className="hidden lg:flex lg:w-[42%] xl:w-[40%] shrink-0 flex-col justify-between bg-kado-dark text-kado-cream px-10 xl:px-12 py-12 border-r border-white/10">
        <div>
          <AuthBrandMark variant="internal" />
          <h2 className="font-display text-3xl xl:text-4xl font-bold mt-10 leading-tight">
            Run the café
            <br />
            from one place.
          </h2>
          <p className="text-sm text-kado-cream/70 mt-4 max-w-sm leading-relaxed">
            Orders, menu, branches, loyalty, and content — scoped to your role and branch.
          </p>
          <ul className="mt-10 space-y-3 text-sm text-kado-cream/80">
            <li className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-kado-red" /> Admin — full operations control
            </li>
            <li className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-kado-red" /> Barista — live queue & POS
            </li>
            <li className="flex items-center gap-2">
              <Package className="w-4 h-4 text-kado-red" /> Staff — merch & events ops
            </li>
          </ul>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-kado-cream/40 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> Authorized personnel only
        </p>
      </aside>

      <main className="flex-1 flex items-center justify-center px-6 py-12 lg:py-16 lg:px-12">
        {formPanel}
      </main>
    </div>
  );
}
