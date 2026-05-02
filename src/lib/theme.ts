import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import type { DashTheme } from '../store/settingsStore';

export function useDashTheme(): { isDark: boolean; theme: DashTheme; toggle: () => void } {
  const theme = useSettingsStore((s) => s.settings.brandMode);
  const toggle = useSettingsStore((s) => s.toggleDashTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dash-dark');
    } else {
      root.classList.remove('dash-dark');
    }
    return () => root.classList.remove('dash-dark');
  }, [theme]);

  return { isDark: theme === 'dark', theme, toggle };
}
