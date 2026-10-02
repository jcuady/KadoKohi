import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  CalendarClock,
  CalendarDays,
  Package,
  ClipboardList,
  LogOut,
  Sun,
  Moon,
  ExternalLink,
  Settings,
  LifeBuoy,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useBranchStore } from '../store/branchStore';
import { useDashTheme } from '../lib/theme';
import { LOGO } from '../lib/brandTokens';
import BrandHybridMark from '../components/BrandHybridMark';
import NotificationToggle from '../components/NotificationToggle';
import { hydrateOpsPortal } from '../lib/bootstrapHydration';

const nav = [
  { to: '/staff/booth-bookings', label: 'Booth Bookings', short: 'Booths', icon: CalendarClock },
  { to: '/staff/event-registrations', label: 'Event Sign-ups', short: 'Events', icon: CalendarDays },
  { to: '/staff/merch-orders', label: 'Merch Orders', short: 'Merch', icon: Package },
  { to: '/staff/orders', label: 'All Orders', short: 'Orders', icon: ClipboardList },
  { to: '/staff/tickets', label: 'Tickets', short: 'Tickets', icon: LifeBuoy },
  { to: '/staff/settings', label: 'Settings', short: 'Settings', icon: Settings },
];

function sidebarFooterBtnClass() {
  return [
    'flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium md:justify-start md:px-3',
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
    <div className="dash-shell min-h-screen" style={{ background: 'var(--color-dash-bg)', color: 'var(--color-dash-text)' }}>
      <aside
        className="dash-sidebar fixed left-0 top-0 z-40 flex h-[100dvh] w-[4.5rem] shrink-0 flex-col border-r shadow-[2px_0_24px_rgba(0,0,0,0.04)] md:w-56"
        style={{ background: 'var(--color-dash-sidebar)', borderColor: 'var(--color-dash-border)' }}
      >
        <div className="shrink-0 border-b px-2 pb-3 pt-3 md:px-4 md:pt-4" style={{ borderColor: 'var(--color-dash-border)' }}>
          <Link to="/staff/merch-orders" className="flex min-h-[44px] items-center justify-center md:justify-start">
            <img
              src={LOGO.hybridMark}
              alt="Kado Kohi"
              className="hidden h-8 w-auto object-contain object-left md:block"
              style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
            />
            <BrandHybridMark size="sm" alt="" className="md:hidden" />
          </Link>
          <div className="mt-3 hidden items-center gap-2.5 md:flex">
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

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-1.5 py-2 custom-scrollbar md:px-2 md:py-3">
          {nav.map(({ to, label, short, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                [
                  'flex min-h-[2.75rem] flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold leading-tight transition-colors duration-150 md:flex-row md:justify-start md:gap-2.5 md:px-3 md:py-2 md:text-[13px]',
                  isActive
                    ? 'bg-kado-red text-white shadow-sm shadow-kado-red/20'
                    : 'text-[var(--color-dash-text-muted)] hover:bg-[var(--color-dash-hover)] hover:text-[var(--color-dash-text)]',
                ].join(' ')
              }
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90 md:h-4 md:w-4" strokeWidth={2} />
              <span className="max-w-full truncate md:hidden">{short}</span>
              <span className="hidden truncate md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div
          className="shrink-0 space-y-1 border-t px-1.5 pb-2 pt-2 md:px-2 md:pb-3 md:pt-3"
          style={{ borderColor: 'var(--color-dash-border)' }}
        >
          <NotificationToggle variant="sidebar" audience="staff" label="Push alerts" />
          <button type="button" onClick={toggle} className={sidebarFooterBtnClass()} title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <Sun className="h-4 w-4 shrink-0" strokeWidth={2} /> : <Moon className="h-4 w-4 shrink-0" strokeWidth={2} />}
            <span className="hidden md:inline">{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <Link to="/" className={sidebarFooterBtnClass()} title="View site">
            <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="hidden md:inline">View site</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={`${sidebarFooterBtnClass()} hover:!text-kado-red`}
            title="Sign out"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </div>
      </aside>

      <div className="dash-main ml-[4.5rem] flex min-h-[100dvh] min-w-0 flex-1 flex-col md:ml-56">
        <header
          className="dash-main-header sticky top-0 z-30 flex h-12 shrink-0 items-center border-b bg-[var(--color-dash-surface)]/95 px-4 backdrop-blur-sm md:h-14 md:px-6"
          style={{ borderColor: 'var(--color-dash-border)' }}
        >
          <span className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-kado-red md:tracking-[0.2em]">
            Staff · Dashboard
          </span>
        </header>
        <div className="dash-main-body flex-1 overflow-auto p-3 sm:p-4 md:p-8" data-scroll-top>
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
