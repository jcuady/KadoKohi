import { LEGAL_CONTACT_EMAIL } from '../content/customerLegal';

export type NavRouteItem = {
  label: string;
  path: string;
};

export type NavExternalItem = {
  label: string;
  href: string;
};

export type NavDropdownItem = NavRouteItem | NavExternalItem;

export type NavLinkItem = {
  kind: 'link';
  label: string;
  path: string;
};

export type NavExternalLinkItem = {
  kind: 'external';
  label: string;
  href: string;
};

export type NavDropdown = {
  kind: 'dropdown';
  label: string;
  items: NavDropdownItem[];
};

export type NavItem = NavLinkItem | NavExternalLinkItem | NavDropdown;

export function isNavRouteItem(item: NavDropdownItem): item is NavRouteItem {
  return 'path' in item;
}

const CAREERS_MAILTO = `mailto:${LEGAL_CONTACT_EMAIL}?subject=${encodeURIComponent('Careers Application — Kado Kohi')}&body=${encodeURIComponent('Hi Kado Kohi team,\n\nI would like to apply for a position at Kado Kohi.\n\nName:\nRole interested in:\nPhone:\n\n(Please attach your resume.)\n\nThank you.')}`;

/** Public marketing header — dropdown groups match site IA. */
export const PUBLIC_SITE_NAV: NavItem[] = [
  { kind: 'link', label: 'Home', path: '/' },
  {
    kind: 'dropdown',
    label: 'Menu',
    items: [
      { label: 'Coffee', path: '/menu' },
      { label: 'Merch', path: '/merch' },
      { label: 'Pastries', path: '/pastries' },
    ],
  },
  {
    kind: 'dropdown',
    label: 'Events',
    items: [
      { label: 'Book Booth', path: '/book/booth' },
      { label: 'Kado Coffee Event', path: '/events' },
    ],
  },
  { kind: 'external', label: 'Careers', href: CAREERS_MAILTO },
  {
    kind: 'dropdown',
    label: 'About Us',
    items: [
      { label: 'Branches', path: '/branches' },
      { label: 'Our Story', path: '/about' },
    ],
  },
  { kind: 'link', label: 'Contact Us', path: '/contact' },
  { kind: 'link', label: 'Blogs', path: '/blog' },
];

export function navPathsForItem(item: NavItem): string[] {
  if (item.kind === 'link') return [item.path];
  if (item.kind === 'external') return [];
  return item.items.filter(isNavRouteItem).map((i) => i.path);
}

export function pathMatchesNav(path: string, pathname: string): boolean {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function navItemIsActive(item: NavItem, pathname: string): boolean {
  const paths = navPathsForItem(item);
  if (paths.length === 0) return false;
  return paths.some((p) => pathMatchesNav(p, pathname));
}
