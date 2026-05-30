import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallState = 'unavailable' | 'ready' | 'accepted' | 'dismissed';

export function usePWAInstall() {
  const [state, setState] = useState<InstallState>('unavailable');
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setState('ready');
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setState('accepted');
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = useCallback(async () => {
    if (!prompt) return 'unavailable' as const;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setPrompt(null);
    const next = outcome === 'accepted' ? 'accepted' : 'dismissed';
    setState(next);
    return next;
  }, [prompt]);

  const isInstalled = state === 'accepted';
  const canInstall = state === 'ready';

  return { state, canInstall, isInstalled, install };
}
