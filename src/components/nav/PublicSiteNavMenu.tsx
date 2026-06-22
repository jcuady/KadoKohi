import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Fragment, useEffect, useId, useRef, useState } from 'react';
import {
  PUBLIC_SITE_NAV,
  isNavRouteItem,
  navItemIsActive,
  pathMatchesNav,
  type NavDropdownItem,
  type NavItem,
} from '../../config/siteNav';
import { cn } from '../../lib/utils';

function dropdownLinkClass(active: boolean) {
  return cn('public-nav-dropdown-link', active && 'is-active');
}

function DropdownLink({
  item,
  onNavigate,
}: {
  item: NavDropdownItem;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const active = isNavRouteItem(item) && pathMatchesNav(item.path, pathname);

  if (isNavRouteItem(item)) {
    return (
      <Link
        to={item.path}
        className={dropdownLinkClass(active)}
        aria-current={active ? 'page' : undefined}
        onClick={onNavigate}
      >
        {item.label}
      </Link>
    );
  }
  return (
    <a href={item.href} className={dropdownLinkClass(false)} onClick={onNavigate}>
      {item.label}
    </a>
  );
}

function DesktopDropdown({ item }: { item: Extract<NavItem, { kind: 'dropdown' }> }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const active = navItemIsActive(item, location.pathname);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={cn('public-nav-link', (active || open) && 'is-active')}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {item.label}
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 opacity-50 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-[130] min-w-full pt-1.5">
          <div id={menuId} role="menu" className="public-nav-dropdown">
            {item.items.map((child) => (
              <Fragment key={child.label}>
                <DropdownLink item={child} onNavigate={() => setOpen(false)} />
              </Fragment>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DesktopNavItem({ item }: { item: NavItem }) {
  const location = useLocation();

  if (item.kind === 'dropdown') return <DesktopDropdown item={item} />;

  if (item.kind === 'external') {
    return (
      <a href={item.href} className="public-nav-link">
        {item.label}
      </a>
    );
  }

  const active = pathMatchesNav(item.path, location.pathname);

  return (
    <Link
      to={item.path}
      className={cn('public-nav-link', active && 'is-active')}
      aria-current={active ? 'page' : undefined}
    >
      {item.label}
    </Link>
  );
}

function MobileAccordion({
  item,
  onNavigate,
}: {
  item: Extract<NavItem, { kind: 'dropdown' }>;
  onNavigate: () => void;
}) {
  const location = useLocation();
  const [open, setOpen] = useState(navItemIsActive(item, location.pathname));
  const active = navItemIsActive(item, location.pathname);

  return (
    <div>
      <button
        type="button"
        className={cn('public-nav-mobile-link', (active || open) && 'is-active')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {item.label}
        <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-50 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open ? (
        <div className="public-nav-mobile-sub">
          {item.items.map((child) => (
            <Fragment key={child.label}>
              <DropdownLink item={child} onNavigate={onNavigate} />
            </Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MobileNavItem({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const location = useLocation();

  if (item.kind === 'dropdown') {
    return <MobileAccordion item={item} onNavigate={onNavigate} />;
  }

  if (item.kind === 'external') {
    return (
      <a href={item.href} onClick={onNavigate} className="public-nav-mobile-link font-semibold">
        {item.label}
      </a>
    );
  }

  const active = pathMatchesNav(item.path, location.pathname);

  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      className={cn('public-nav-mobile-link', active && 'is-active')}
      aria-current={active ? 'page' : undefined}
    >
      {item.label}
    </Link>
  );
}

export function PublicSiteNavDesktop() {
  return (
    <div className="hidden min-w-0 flex-1 justify-center xl:flex">
      <nav aria-label="Main" className="public-nav-shell">
        {PUBLIC_SITE_NAV.map((item) => (
          <Fragment key={item.label}>
            <DesktopNavItem item={item} />
          </Fragment>
        ))}
      </nav>
    </div>
  );
}

export function PublicSiteNavMobile({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav aria-label="Main" className="public-nav-mobile-shell">
      {PUBLIC_SITE_NAV.map((item) => (
        <Fragment key={item.label}>
          <MobileNavItem item={item} onNavigate={onNavigate} />
        </Fragment>
      ))}
    </nav>
  );
}
