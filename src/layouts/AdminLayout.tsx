import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  ShoppingCart,
  ClipboardList,
  Coffee,
  CalendarClock,
  Package,
  Gift,
  CalendarDays,
  QrCode,
  Layers,
  Users,
  Settings,
  Monitor,
  LogOut,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDashTheme } from '../lib/theme';

const SIDEBAR_W = 'w-56'; /* 14rem — keep in sync with main margin */
const MAIN_OFFSET = 'ml-56';

const nav = [
  { to: '/admin', label: 'Overview', end: true, icon: LayoutDashboard },
  { to: '/admin/branches', label: 'Branches', icon: MapPin },
  { to: '/admin/pos', label: 'POS', icon: ShoppingCart },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/menu', label: 'Menu', icon: Coffee },
  { to: '/admin/booth-bookings', label: 'Booth Bookings', icon: CalendarClock },
  { to: '/admin/booth-catalog', label: 'Booth Catalog', icon: CalendarClock },
  { to: '/admin/booth-content', label: 'Booth Content', icon: CalendarClock },
  { to: '/admin/merch', label: 'Merch', icon: Package },
  { to: '/admin/loyalty', label: 'Loyalty', icon: Gift },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/tables', label: 'Tables & QR', icon: QrCode },
  { to: '/admin/sections', label: 'Sections', icon: Layers },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/barista/kiosk', label: 'KIOSK', icon: Monitor },
];

/** Shared footer control — same visual weight; sign-out uses hover danger */
function sidebarFooterBtnClass() {
  return [
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium',
    'transition-colors duration-150',
    'text-[var(--color-dash-text-muted)] hover:bg-[var(--color-dash-hover)]',
    'hover:text-[var(--color-dash-text)]',
  ].join(' ');
}

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { isDark, toggle } = useDashTheme();

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-dash-bg)', color: 'var(--color-dash-text)' }}>
      {/* Fixed sidebar — stays in view; nav scrolls independently */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen ${SIDEBAR_W} shrink-0 flex-col border-r shadow-[2px_0_24px_rgba(0,0,0,0.04)]`}
        style={{ background: 'var(--color-dash-sidebar)', borderColor: 'var(--color-dash-border)' }}
      >
        <div className="shrink-0 border-b px-4 pb-3 pt-4" style={{ borderColor: 'var(--color-dash-border)' }}>
          <Link to="/admin" className="block">
            <img
              src="/logo/Logo2.png"
              alt="Kado Kohi"
              className="h-8 w-auto object-contain object-left"
              style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined}
            />
          </Link>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kado-red text-[11px] font-black uppercase text-white">
              {user?.name?.charAt(0) ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold" style={{ color: 'var(--color-dash-text)' }}>
                {user?.name}
              </p>
              <p className="truncate text-[10px] leading-tight" style={{ color: 'var(--color-dash-text-muted)' }}>
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 py-3">
          {nav.map(({ to, label, end, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
          <p
            className="px-3 pb-1 text-[9px] font-bold uppercase tracking-[0.14em]"
            style={{ color: 'var(--color-dash-text-muted)' }}
          >
            Workspace
          </p>
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

      {/* Main column — offset for fixed sidebar */}
      <div className={`flex min-h-screen min-w-0 flex-1 flex-col ${MAIN_OFFSET}`}>
        <header
          className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b bg-[var(--color-dash-surface)]/95 px-6 backdrop-blur-sm"
          style={{ borderColor: 'var(--color-dash-border)' }}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red">Admin · Operations</span>
        </header>
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
