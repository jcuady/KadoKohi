import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  CalendarClock,
  Package,
  ClipboardList,
  LogOut,
  Sun,
  Moon,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useBranchStore } from '../store/branchStore';
import { useDashTheme } from '../lib/theme';
import NotificationToggle from '../components/NotificationToggle';
import { hydrateOpsPortal } from '../lib/bootstrapHydration';

const SIDEBAR_W = 'w-56';
const MAIN_OFFSET = 'ml-56';

const nav = [
  { to: '/staff/booth-bookings', label: 'Booth Bookings', icon: CalendarClock },
  { to: '/staff/merch-orders', label: 'Merch Orders', icon: Package },
  { to: '/staff/orders', label: 'All Orders', icon: ClipboardList },
  { to: '/staff/settings', label: 'Settings', icon: Settings },
];

function sidebarFooterBtnClass() {
  return [
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium',
    'transition-colors duration-150',
    'text-[var(--color-dash-text-muted)] hover:bg-[var(--color-dash-hover)]',
    'hover:text-[var(--color-dash-text)]',
  ].join(' ');
}

export default function StaffLayout() {
  const user = useAuthStore((s) => s.user);
  const branches = useBranchStore((s) => s.branches);
  const branchLabel = user?.branchId
    ? branches.find((b) => b.id === user.branchId)?.name
    : null;
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { isDark, toggle } = useDashTheme();

  useEffect(() => {
    if (user?.role !== 'staff') return;
    void hydrateOpsPortal();
  }, [user?.id, user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/management-portal', { replace: true });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-dash-bg)', color: 'var(--color-dash-text)' }}>
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen ${SIDEBAR_W} shrink-0 flex-col border-r shadow-[2px_0_24px_rgba(0,0,0,0.04)]`}
        style={{ background: 'var(--color-dash-sidebar)', borderColor: 'var(--color-dash-border)' }}
      >
        <div className="shrink-0 border-b px-4 pb-3 pt-4" style={{ borderColor: 'var(--color-dash-border)' }}>
          <Link to="/staff/merch-orders" className="block">
            <img
              src="/logo/Logo2.png"
              alt="Kado Kohi"
              className="h-8 w-auto object-contain object-left"
              style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
            />
          </Link>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kado-red text-[11px] font-black uppercase text-white">
              {user?.name?.charAt(0) ?? 'S'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold" style={{ color: 'var(--color-dash-text)' }}>
                {user?.name}
              </p>
              <p className="truncate text-[10px] leading-tight" style={{ color: 'var(--color-dash-text-muted)' }}>
                {branchLabel ? `${branchLabel} · ` : ''}{user?.email}
              </p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 py-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-kado-red text-white shadow-sm shadow-kado-red/20'
                    : 'text-[var(--color-dash-text-muted)] hover:bg-[var(--color-dash-hover)] hover:text-[var(--color-dash-text)]',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div
          className="shrink-0 space-y-1 border-t px-2 pb-3 pt-3"
          style={{ borderColor: 'var(--color-dash-border)' }}
        >
          <NotificationToggle variant="sidebar" audience="staff" label="Enable alerts" />
          <button type="button" onClick={toggle} className={sidebarFooterBtnClass()}>
            {isDark ? <Sun className="h-4 w-4 shrink-0" strokeWidth={2} /> : <Moon className="h-4 w-4 shrink-0" strokeWidth={2} />}
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>
          <Link to="/" className={sidebarFooterBtnClass()}>
            <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2} />
            View site
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={`${sidebarFooterBtnClass()} hover:!text-kado-red`}
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>

      <div className={`flex min-h-screen min-w-0 flex-1 flex-col ${MAIN_OFFSET}`}>
        <header
          className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b bg-[var(--color-dash-surface)]/95 px-6 backdrop-blur-sm"
          style={{ borderColor: 'var(--color-dash-border)' }}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red">Staff · Dashboard</span>
        </header>
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {user?.role === 'staff' && !user.branchId && (
            <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
              This staff account has no branch assigned. Ask an administrator to set your branch under Admin → Users.
            </div>
          )}
          <Outlet />
        </div>
      </div>
    </div>
  );
}
