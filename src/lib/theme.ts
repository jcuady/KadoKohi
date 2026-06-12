import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import type { DashTheme } from '../store/settingsStore';

const INTERNAL_PREFIXES = ['/admin', '/barista', '/staff'] as const;

export function isInternalPortalPath(pathname: string): boolean {
  if (pathname === '/management-portal') return true;
  return INTERNAL_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Customer-facing routes always use brand light mode (cream / red / dark text). */
export function usePublicLightDocumentTheme(): void {
  const { pathname } = useLocation();
  const internal = isInternalPortalPath(pathname);

  useEffect(() => {
    if (internal) return;
    const root = document.documentElement;
    root.classList.remove('dash-dark');
    root.classList.add('public-light');
    root.style.colorScheme = 'light';
    return () => {
      root.classList.remove('public-light');
      root.style.colorScheme = '';
    };
  }, [internal]);
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
