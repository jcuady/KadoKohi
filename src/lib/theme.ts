import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import type { DashTheme } from '../store/settingsStore';

const INTERNAL_PREFIXES = ['/admin', '/barista', '/staff'] as const;

export function isInternalPortalPath(pathname: string): boolean {
  if (pathname === '/management-portal' || pathname.startsWith('/management-portal/')) return true;
  return INTERNAL_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Public marketing, auth, account, QR/takeout — not admin/barista/staff portals. */
export function isCustomerFacingPath(pathname: string): boolean {
  return !isInternalPortalPath(pathname);
}

/** Standalone guest ordering (mobile QR scan) — respects OS light/dark. */
export function isQrGuestOrderPath(pathname: string): boolean {
  return pathname.startsWith('/order/qr/') || pathname === '/order/takeout';
}

function applyQrThemeColor(): void {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  meta.setAttribute('content', dark ? '#191919' : '#faf7f2');
}

/** Customer-facing routes use brand light mode; QR/takeout also adapts to OS dark mode. */
export function usePublicLightDocumentTheme(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const internal = isInternalPortalPath(pathname);
    const customerFacing = isCustomerFacingPath(pathname);
    const qrAdaptive = isQrGuestOrderPath(pathname);

    const cleanup = () => {
      root.classList.remove('public-light', 'customer-facing', 'qr-adaptive-theme');
      root.style.colorScheme = '';
    };

    if (internal) {
      cleanup();
      return cleanup;
    }

    root.classList.remove('dash-dark');
    root.classList.add('public-light');
    if (customerFacing) root.classList.add('customer-facing');
    else root.classList.remove('customer-facing');

    let mq: MediaQueryList | null = null;
    let onScheme: (() => void) | null = null;

    if (qrAdaptive) {
      root.classList.add('qr-adaptive-theme');
      root.style.colorScheme = 'light dark';
      applyQrThemeColor();
      mq = window.matchMedia('(prefers-color-scheme: dark)');
      onScheme = () => applyQrThemeColor();
      mq.addEventListener('change', onScheme);
    } else {
      root.classList.remove('qr-adaptive-theme');
      root.style.colorScheme = 'light';
    }

    return () => {
      if (mq && onScheme) mq.removeEventListener('change', onScheme);
      cleanup();
    };
  }, [pathname]);
}

export function useDashTheme(): { isDark: boolean; theme: DashTheme; toggle: () => void } {
  const theme = useSettingsStore((s) => s.settings.brandMode);
  const toggle = useSettingsStore((s) => s.toggleDashTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dash-dark');
      root.classList.remove('public-light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dash-dark');
      root.style.colorScheme = 'light';
    }
    return () => {
      root.classList.remove('dash-dark');
      root.style.colorScheme = '';
    };
  }, [theme]);

  return { isDark: theme === 'dark', theme, toggle };
}
