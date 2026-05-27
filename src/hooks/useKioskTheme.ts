import { useEffect, useState } from 'react';

export type KioskTheme = 'light' | 'dark';

const STORAGE_KEY = 'kado-kiosk-theme';

function readStored(): KioskTheme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {
    /* ignore */
  }
  return 'light';
}

/** Theme for the customer-facing kiosk display (defaults to light for readability). */
export function useKioskTheme() {
  const [theme, setTheme] = useState<KioskTheme>(() => readStored());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const isDark = theme === 'dark';
  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return { theme, isDark, toggle, setTheme };
}
