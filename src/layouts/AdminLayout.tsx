import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  LayoutDashboard,
  MapPin,
  ShoppingCart,
  ClipboardList,
  Coffee,
  CalendarClock,
  Package,
  Gift,
  Stamp,
  Tag,
  CalendarDays,
  QrCode,
  Image,
  Newspaper,
  Users,
  ScrollText,
  Settings,
  Monitor,
  LogOut,
  Sun,
  Moon,
  ExternalLink,
  ChevronDown,
  Layers,
  PenLine,
  LayoutGrid,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDashTheme } from '../lib/theme';
import { hasAllBranchAccess } from '../lib/roles';
import NotificationToggle from '../components/NotificationToggle';
import { startOperationsRealtime, refreshOperationsData } from '../lib/supabase/operationsRealtime';
import { useBranchStore } from '../store/branchStore';
import AdminKioskBranchModal from '../components/admin/AdminKioskBranchModal';

const SIDEBAR_W = 'w-56';
const MAIN_OFFSET = 'ml-56';

type NavIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

type NavLinkItem = {
  type: 'link';
  to: string;
  label: string;
  icon: NavIcon;
  end?: boolean;
};

type NavGroupItem = {
  type: 'group';
  id: string;
  label: string;
  icon: NavIcon;
  children: Omit<NavLinkItem, 'type'>[];
};

type NavEntry = NavLinkItem | NavGroupItem;

const NAV: NavEntry[] = [
  { type: 'link', to: '/admin', label: 'Overview', end: true, icon: LayoutDashboard },
  {
    type: 'group',
    id: 'operations',
    label: 'Operations',
    icon: ShoppingCart,
    children: [
      { to: '/admin/pos', label: 'POS', icon: ShoppingCart },
      { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
      { to: '/admin/stamps', label: 'Stamps', icon: Stamp },
    ],
  },
  {
    type: 'group',
    id: 'catalog',
    label: 'Catalog',
    icon: Coffee,
    children: [
      { to: '/admin/menu', label: 'Menu', icon: Coffee },
      { to: '/admin/merch', label: 'Merch', icon: Package },
    ],
  },
  {
    type: 'group',
    id: 'booth',
    label: 'Coffee booth',
    icon: CalendarClock,
    children: [
      { to: '/admin/booth-bookings', label: 'Bookings', icon: CalendarClock },
      { to: '/admin/booth-catalog', label: 'Catalog', icon: Layers },
      { to: '/admin/booth-content', label: 'Page content', icon: PenLine },
    ],
  },
  {
    type: 'group',
    id: 'loyalty',
    label: 'Loyalty',
    icon: Gift,
    children: [
      { to: '/admin/loyalty', label: 'Program', icon: Gift },
      { to: '/admin/vouchers', label: 'Vouchers', icon: Tag },
    ],
  },
  {
    type: 'group',
    id: 'events',
    label: 'Events & QR',
    icon: CalendarDays,
    children: [
      { to: '/admin/events', label: 'Kado Events', icon: CalendarDays },
      { to: '/admin/tables', label: 'Tables & QR', icon: QrCode },
    ],
  },
  {
    type: 'group',
    id: 'website',
    label: 'Website',
    icon: Image,
    children: [
      { to: '/admin/landing', label: 'Homepage', icon: Image },
      { to: '/admin/sections', label: 'Custom sections', icon: LayoutGrid },
      { to: '/admin/blog', label: 'Blog', icon: Newspaper },
    ],
  },
  {
    type: 'group',
    id: 'administration',
    label: 'Administration',
    icon: Settings,
    children: [
      { to: '/admin/branches', label: 'Branches', icon: MapPin },
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/audit', label: 'Audit log', icon: ScrollText },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const KIOSK_NAV = { label: 'Kiosk', icon: Monitor };

function pathMatchesNav(to: string, pathname: string, end?: boolean) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function groupIsActive(group: NavGroupItem, pathname: string) {
  return group.children.some((child) => pathMatchesNav(child.to, pathname, child.end));
}

function linkClass(isActive: boolean, nested = false) {
  return [
    'flex items-center gap-2.5 rounded-lg font-semibold transition-colors duration-150',
    nested ? 'px-3 py-1.5 text-[12px]' : 'px-3 py-2 text-[13px]',
    isActive
      ? 'bg-kado-red text-white shadow-sm shadow-kado-red/20'
      : 'text-[var(--color-dash-text-muted)] hover:bg-[var(--color-dash-hover)] hover:text-[var(--color-dash-text)]',
  ].join(' ');
}

function groupHeaderClass(isActive: boolean, isOpen: boolean) {
  return [
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors duration-150',
    isActive
      ? 'bg-[var(--color-dash-hover)] text-[var(--color-dash-text)]'
      : 'text-[var(--color-dash-text-muted)] hover:bg-[var(--color-dash-hover)] hover:text-[var(--color-dash-text)]',
    isOpen && !isActive ? 'text-[var(--color-dash-text)]' : '',
  ].join(' ');
}

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
  const location = useLocation();
  const { isDark, toggle } = useDashTheme();
  const setAdminPosBranchId = useBranchStore((s) => s.setAdminPosBranchId);
  const [kioskBranchOpen, setKioskBranchOpen] = useState(false);

  const defaultOpenGroups = useMemo(() => {
    const open: Record<string, boolean> = {};
    for (const entry of NAV) {
      if (entry.type === 'group' && groupIsActive(entry, location.pathname)) {
        open[entry.id] = true;
      }
    }
    return open;
  }, [location.pathname]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(defaultOpenGroups);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const entry of NAV) {
        if (entry.type === 'group' && groupIsActive(entry, location.pathname)) {
          next[entry.id] = true;
        }
      }
      return next;
    });
  }, [location.pathname]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    startOperationsRealtime();
    void refreshOperationsData();
  }, [user?.id, user?.role]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-dash-bg)', color: 'var(--color-dash-text)' }}>
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
              {hasAllBranchAccess(user) && (
                <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-wider text-kado-red">
                  Super admin · All branches
                </p>
              )}
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-2 py-3">
          {NAV.map((entry) => {
            if (entry.type === 'link') {
              const Icon = entry.icon;
              return (
                <NavLink
                  key={entry.to}
                  to={entry.to}
                  end={entry.end}
                  className={({ isActive }) => linkClass(isActive)}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
                  <span className="truncate">{entry.label}</span>
                </NavLink>
              );
            }

            const active = groupIsActive(entry, location.pathname);
            const isOpen = openGroups[entry.id] ?? false;
            const GroupIcon = entry.icon;

            return (
              <div key={entry.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(entry.id)}
                  className={groupHeaderClass(active, isOpen)}
                  aria-expanded={isOpen}
                >
                  <GroupIcon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
                  <span className="flex-1 truncate text-left">{entry.label}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen ? (
                  <div
                    className="ml-3 space-y-0.5 border-l pl-2"
                    style={{ borderColor: 'var(--color-dash-border)' }}
                  >
                    {entry.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          end={child.end}
                          className={({ isActive }) => linkClass(isActive, true)}
                        >
                          <ChildIcon className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} />
                          <span className="truncate">{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className="pt-2">
            <p
              className="px-3 pb-1 text-[9px] font-bold uppercase tracking-[0.14em]"
              style={{ color: 'var(--color-dash-text-muted)' }}
            >
              In-store
            </p>
            <button
              type="button"
              onClick={() => setKioskBranchOpen(true)}
              className={[
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors duration-150',
                location.pathname === '/barista/kiosk'
                  ? 'bg-kado-red text-white shadow-sm shadow-kado-red/20'
                  : 'text-[var(--color-dash-text-muted)] hover:bg-[var(--color-dash-hover)] hover:text-[var(--color-dash-text)]',
              ].join(' ')}
            >
              <KIOSK_NAV.icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
              <span className="truncate">{KIOSK_NAV.label}</span>
            </button>
          </div>
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
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-kado-red">Admin · Operations</span>
        </header>
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </div>
      </div>

      <AdminKioskBranchModal
        open={kioskBranchOpen}
        onClose={() => setKioskBranchOpen(false)}
        onConfirm={(branchId) => {
          setAdminPosBranchId(branchId);
          setKioskBranchOpen(false);
          navigate(`/barista/kiosk?branch=${encodeURIComponent(branchId)}`);
        }}
      />
    </div>
  );
}
