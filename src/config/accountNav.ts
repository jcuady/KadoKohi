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
  label: string;
  end?: boolean;
  icon: LucideIcon;
};

export const ACCOUNT_NAV: AccountNavItem[] = [
  { to: '/account', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/account/orders', label: 'My Orders', icon: ClipboardList },
  { to: '/account/booth', label: 'Event Booking', icon: CalendarHeart },
  { to: '/account/vouchers', label: 'Vouchers', icon: Gift },
  { to: '/account/profile', label: 'Profile', icon: User },
];
