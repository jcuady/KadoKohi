import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_KEY = 'kk-chunk-reload';

/** Clear after a successful app boot (see main.tsx). */
export function clearChunkReloadFlag(): void {
  try {
    sessionStorage.removeItem(RELOAD_KEY);
  } catch {
    // ignore
  }
}

function isChunkLoadError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err).toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('error loading dynamically imported module')
  );
}

/** Retry once with a full reload when a lazy route chunk 404s after deploy. */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err: unknown) => {
      if (!isChunkLoadError(err)) throw err;
      try {
        if (!sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, '1');
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        // fall through
      }
      throw err;
    }),
  );
}
