import {
  LayoutDashboard,
  ClipboardList,
  CalendarHeart,
  Gift,
  User,
  type LucideIcon,
} from 'lucide-react';

export type AccountNavItem = {
  to: string;
  /** Full label (desktop / page titles) */
  label: string;
  /** Compact label for bottom tab bar */
  shortLabel: string;
  end?: boolean;
  icon: LucideIcon;
};

export const ACCOUNT_NAV: AccountNavItem[] = [
  { to: '/account', label: 'Home', shortLabel: 'Home', end: true, icon: LayoutDashboard },
  { to: '/account/orders', label: 'Orders', shortLabel: 'Orders', icon: ClipboardList },
  { to: '/account/booth', label: 'Events', shortLabel: 'Events', icon: CalendarHeart },
  { to: '/account/vouchers', label: 'Rewards', shortLabel: 'Rewards', icon: Gift },
  { to: '/account/profile', label: 'Profile', shortLabel: 'Profile', icon: User },
];
