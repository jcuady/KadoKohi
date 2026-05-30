import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  LayoutGrid,
  ListOrdered,
  ShoppingCart,
  Coffee,
  Stamp,
  LogOut,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDashTheme } from '../lib/theme';
import NotificationToggle from '../components/NotificationToggle';
import { startOperationsRealtime, refreshOperationsData } from '../lib/supabase/operationsRealtime';

const nav = [
  { to: '/barista', label: 'Board', end: true, icon: LayoutGrid },
  { to: '/barista/queue', label: 'Queue', icon: ListOrdered },
  { to: '/barista/pos', label: 'POS', icon: ShoppingCart },
  { to: '/barista/menu', label: 'Menu', icon: Coffee },
  { to: '/barista/stamps', label: 'Stamps', icon: Stamp },
];

function sidebarFooterBtnClass() {
  return [
    'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium md:px-3',
    'transition-colors duration-150',
    'text-[var(--color-dash-text-muted)] hover:bg-[var(--color-dash-hover)]',
    'hover:text-[var(--color-dash-text)]',
  ].join(' ');
}

export default function BaristaLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { isDark, toggle } = useDashTheme();

  useEffect(() => {
    if (user?.role !== 'barista' && user?.role !== 'admin') return;
    startOperationsRealtime();
    void refreshOperationsData();
  }, [user?.id, user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-dash-bg)', color: 'var(--color-dash-text)' }}>
      {/* Fixed sidebar — matches admin behavior; narrow icons on small screens */}
      <aside
        className="fixed left-0 top-0 z-40 flex h-screen w-[4.5rem] shrink-0 flex-col border-r shadow-[2px_0_24px_rgba(0,0,0,0.04)] md:w-52"
        style={{ background: 'var(--color-dash-sidebar)', borderColor: 'var(--color-dash-border)' }}
      >
        <div className="shrink-0 border-b px-2 pb-3 pt-3 md:px-4" style={{ borderColor: 'var(--color-dash-border)' }}>
          <Link to="/barista" className="flex items-center justify-center md:justify-start">
            <img
              src="/logo/Logo2.png"
              alt="Kado Kohi"
              className="hidden h-7 w-auto object-contain object-left md:block"
              style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
            />
            <span className="font-display text-base font-bold text-kado-red md:hidden">角</span>
          </Link>
          <div className="mt-2 hidden items-center gap-2 md:flex">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-kado-red text-[10px] font-black uppercase text-white">
              {user?.name?.charAt(0) ?? 'B'}
            </div>
            <p className="truncate text-[10px] font-semibold" style={{ color: 'var(--color-dash-text-muted)' }}>
              {user?.name}
            </p>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-1.5 py-2 md:px-2">
          {nav.map(({ to, label, end, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center justify-center gap-2.5 rounded-lg px-2 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors duration-150 md:justify-start md:px-3 md:text-[13px]',
                  isActive
                    ? 'bg-kado-red text-white shadow-sm shadow-kado-red/20'
                    : 'text-[var(--color-dash-text-muted)] hover:bg-[var(--color-dash-hover)] hover:text-[var(--color-dash-text)]',
                ].join(' ')
              }
              title={label}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className="hidden truncate md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div
          className="shrink-0 space-y-1 border-t px-1.5 pb-2 pt-2 md:px-2 md:pb-3 md:pt-3"
          style={{ borderColor: 'var(--color-dash-border)' }}
        >
          <p
            className="hidden px-2 pb-0.5 text-[9px] font-bold uppercase tracking-[0.14em] md:block"
            style={{ color: 'var(--color-dash-text-muted)' }}
          >
            Workspace
          </p>
          <NotificationToggle variant="sidebar" audience="staff" label="Enable alerts" />
          <button
            type="button"
            onClick={toggle}
            className={sidebarFooterBtnClass()}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
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

      <div className="ml-[4.5rem] flex min-h-screen min-w-0 flex-1 flex-col md:ml-52">
        <Outlet />
      </div>
    </div>
  );
}
