import { lazy, Suspense, useEffect, useState } from 'react';

const SiteCookieConsent = lazy(() => import('./SiteCookieConsent'));

/**
 * Cookie UI is below-the-fold legally and pulls Motion when open.
 * Defer mount until idle so mobile FCP/LCP aren't competing with consent JS.
 */
export default function DeferredSiteCookieConsent() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const show = () => {
      if (!cancelled) setReady(true);
    };

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(show, { timeout: 2000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const t = window.setTimeout(show, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <SiteCookieConsent />
    </Suspense>
  );
}
