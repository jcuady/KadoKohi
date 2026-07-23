import {StrictMode} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useEffect } from 'react';
import App from './App.tsx';
import './index.css';
import { useAuthStore } from './store/authStore';
import { hydrateGlobalMinimal } from './lib/bootstrapHydration';
import { supabase } from './lib/supabase/client';
import { stopOperationsRealtime } from './lib/supabase/operationsRealtime';
import { isAuthListenerPaused, recoverStaleAuthSession } from './lib/supabase/authSession';
import { redirectAuthCallbackToHandler } from './lib/authUrlBootstrap';
import { clearChunkReloadFlag } from './lib/lazyWithRetry';
import { registerSW } from 'virtual:pwa-register';

import { ensurePublishedCms } from './lib/cmsBootstrap';
import { initSupabaseNetworkLifecycle } from './lib/supabase/networkGuard';
import { initSupabaseRealtimeNetworkLifecycle } from './lib/supabase/networkLifecycle';

const pendingAuthRedirect = redirectAuthCallbackToHandler();

function Bootstrap() {
  const initAuth = useAuthStore((s) => s.initFromSupabase);

  useEffect(() => {
    initSupabaseNetworkLifecycle();
    initSupabaseRealtimeNetworkLifecycle();
    void recoverStaleAuthSession().then(() => initAuth());
  // Homepage critical path: don't block FCP/LCP on CMS seed probes.
    // Settings hydrate is shared with PublicLayout via kk_app_settings row cache.
    void hydrateGlobalMinimal();
    window.setTimeout(() => {
      void ensurePublishedCms();
    }, 2500);

    // Keep auth state in sync with Supabase session events (token refresh,
    // sign-out from another tab, OAuth callback, email confirmation, etc.).
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // IMPORTANT: never call supabase.auth.* (signOut/getSession) synchronously
      // inside this callback — it deadlocks the auth lock. On SIGNED_OUT the
      // session is already cleared at the Supabase layer, so just reset local
      // state (calling logout()/signOut() here would re-fire SIGNED_OUT → loop).
      if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        stopOperationsRealtime();
        useAuthStore.setState({ user: null, loading: false });
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (isAuthListenerPaused()) return;
        // Defer so we don't re-enter the auth lock held during this callback.
        setTimeout(() => {
          if (isAuthListenerPaused()) return;
          void useAuthStore.getState().initFromSupabase();
        }, 0);
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <App />;
}

if (!pendingAuthRedirect) {
  clearChunkReloadFlag();

  // Register SW after first paint — keeps workbox off the LCP critical path.
  const registerWhenIdle = () => {
    registerSW({
      immediate: false,
      onNeedRefresh() {
        window.location.reload();
      },
    });
  };
  if (document.readyState === 'complete') {
    window.setTimeout(registerWhenIdle, 1500);
  } else {
    window.addEventListener('load', () => window.setTimeout(registerWhenIdle, 1500), { once: true });
  }

  const container = document.getElementById('root')!;
  type RootHost = HTMLElement & { __kkReactRoot?: Root };
  const host = container as RootHost;
  const hostRoot = host.__kkReactRoot ?? createRoot(container);
  host.__kkReactRoot = hostRoot;

  hostRoot.render(
    <StrictMode>
      <Bootstrap />
    </StrictMode>,
  );
}
